import * as agendaModel from '../../../app/agenda/consultas-agenda.js';

/**
 * Controlador para OBTENER la agenda completa de un usuario.
 */
export async function handleGetUserAgenda(req, res) {
  try {
    const userId = parseInt(req.query.userId, 10); 
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'User ID inválido.' });
    }
    const agenda = await agendaModel.getUserAgenda(userId);
    res.status(200).json(agenda);
  } catch (error) {
    console.error('Error en handleGetUserAgenda:', error);
    res.status(500).json({ error: 'Error al obtener la agenda del usuario.' });
  }
}

/**
 * Controlador para CREAR una nueva entrada en la agenda.
 */
export async function handleCreateAgendaEntry(req, res) {
  try {
    const userId = parseInt(req.query.userId, 10);
    const entryData = req.body; 

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'User ID inválido.' });
    }
    if (!entryData.activityId || !entryData.fecha || !entryData.horaInicio || !entryData.horaFin) {
       return res.status(400).json({ error: 'Faltan campos requeridos (activityId, fecha, horaInicio, horaFin).' });
    }

    // Usamos agendaModel para llamar a la función
    const conflicts = await agendaModel.findScheduleConflicts(
      userId,
      entryData.fecha,
      entryData.horaInicio,
      entryData.horaFin
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ 
        error: 'Conflicto de horario detectado con entradas existentes.',
        conflicts: conflicts 
      });
    }

    entryData.userId = userId;
    // Usamos agendaModel para llamar a la función
    const newEntry = await agendaModel.createAgendaEntry(entryData);
    res.status(201).json(newEntry); 
  } catch (error) {
    console.error('Error en handleCreateAgendaEntry:', error);
     if (error.message.includes('foreign key constraint')) { 
        return res.status(400).json({ error: 'La actividad especificada no existe.' });
     }
    res.status(500).json({ error: 'Error al crear la entrada de agenda.' });
  }
}

/**
 * Controlador para ACTUALIZAR una entrada de agenda existente.
 */
export async function handleUpdateAgendaEntry(req, res) {
  try {
    const agendaId = parseInt(req.params.agendaId, 10);
    const updateData = req.body;
    const userId = req.user.id;

    if (isNaN(agendaId)) {
      return res.status(400).json({ error: 'Agenda ID inválido.' });
    }
    if (Object.keys(updateData).length === 0) {
       return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
    }
   
    if (updateData.fecha && updateData.horaInicio && updateData.horaFin) {
        const conflicts = await agendaModel.findScheduleConflicts(
            userId,
            updateData.fecha,
            updateData.horaInicio,
            updateData.horaFin,
            agendaId 
        );
        if (conflicts.length > 0) {
            return res.status(409).json({
                error: 'Conflicto de horario detectado con otras entradas al actualizar.',
                conflicts: conflicts
            });
        }
    }
    const updatedEntry = await agendaModel.updateAgendaEntry(agendaId, userId, updateData);
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Error en handleUpdateAgendaEntry:', error);
    if (error.message.includes('not found or user does not have permission')) {
        return res.status(404).json({ error: 'Entrada no encontrada o sin permiso para actualizar.' });
    }
    res.status(500).json({ error: 'Error al actualizar la entrada de agenda.' });
  }
}

/**
 * Controlador para ELIMINAR una entrada de agenda.
 */
export async function handleDeleteAgendaEntry(req, res) {
  try {
    const agendaId = parseInt(req.params.agendaId, 10);
    const userId = req.user.id; 

     if (isNaN(agendaId)) {
      return res.status(400).json({ error: 'Agenda ID inválido.' });
    }
    const deleted = await agendaModel.deleteAgendaEntry(agendaId, userId);

    if (deleted) {
      res.status(204).send(); 
    } else {
      res.status(404).json({ error: 'Entrada no encontrada o sin permiso para eliminar.' });
    }
  } catch (error) {
    console.error('Error en handleDeleteAgendaEntry:', error);
    res.status(500).json({ error: 'Error al eliminar la entrada de agenda.' });
  }
}