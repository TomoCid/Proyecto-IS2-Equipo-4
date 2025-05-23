import * as agendaModel from '@/app/agenda/consultas-agenda.js';
import { createAgendaEntry } from '@/app/agenda/consultas-agenda';

/**
 * Controlador para OBTENER la agenda completa de un usuario.
 */
export async function handleGetUserAgenda(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10); 

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
    const userId = parseInt(req.params.userId, 10);
    const entryData = req.body; 

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'User ID inválido.' });
    }
    if (!entryData.activityId || !entryData.fecha || !entryData.horaInicio || !entryData.horaFin) {
       return res.status(400).json({ error: 'Faltan campos requeridos (activityId, fecha, horaInicio, horaFin).' });
    }

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

/**
 * Controlador para OBTENER las actividades activas de un usuario con sus preferencias.
 */
export async function handleGetActiveUserActivities(req, res) {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'User ID inválido.' });
        }

        const activities = await agendaModel.getActiveUserActivitiesWithPrefs(userId);
        res.status(200).json(activities);

    } catch (error) {
        console.error('Error en handleGetActiveUserActivities:', error);
        res.status(500).json({ error: 'Error al obtener las actividades activas del usuario.' });
    }
}


/**
 * Controlador para OBTENER la agenda de un usuario con preferencias meteorológicas.
 * Ruta: GET /api/users/:userId/agenda/weather
 */
export async function handleGetUserAgendaWithWeather(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'User ID inválido.' });
    }

    const agendaWithPrefs = await agendaModel.getUserAgendaWithWeatherPrefs(userId);

    res.status(200).json(agendaWithPrefs);

  } catch (error) {
    console.error('Error en handleGetUserAgendaWithWeather:', error);
    res.status(500).json({ error: 'Error al obtener la agenda con preferencias meteorológicas.' });
  }
}

/**
 * Controlador para OBTENER las entradas de agenda recurrentes de un usuario.
 * Ruta: GET /api/users/:userId/agenda/recurring
 */
export async function handleGetRecurringEntries(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'User ID inválido.' });
    }
    const recurringEntries = await agendaModel.getRecurringAgendaEntries(userId);

    res.status(200).json(recurringEntries);

  } catch (error) {
    console.error('Error en handleGetRecurringEntries:', error);
    res.status(500).json({ error: 'Error al obtener las entradas recurrentes.' });
  }
}

/**
 * Controlador para OBTENER los recordatorios pendientes para hoy de un usuario.
 * Ruta: GET /api/users/:userId/reminders/pending
 */
export async function handleGetPendingReminders(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'User ID inválido.' });
    }
    if (req.user.id !== userId) {
        return res.status(403).json({ error: 'No autorizado para ver estos recordatorios.' });
    }

    const pendingReminders = await agendaModel.getPendingReminders(userId);

    res.status(200).json(pendingReminders);

  } catch (error) {
    console.error('Error en handleGetPendingReminders:', error);
    res.status(500).json({ error: 'Error al obtener los recordatorios pendientes.' });
  }
}

/**
 * Controlador para ACTUALIZAR solo la ubicación de una entrada de agenda.
 * Ruta: PATCH /api/agenda/:agendaId/location
 */
export async function handleUpdateLocation(req, res) {
  try {
    const agendaId = parseInt(req.params.agendaId, 10);
    const { latitude, longitude } = req.body; 
    const userId = req.user.id;

    if (isNaN(agendaId)) {
      return res.status(400).json({ error: 'Agenda ID inválido.' });
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
       return res.status(400).json({ error: 'Latitud y longitud deben ser números válidos.' });
    }
    const updatedEntry = await agendaModel.updateAgendaLocation(agendaId, userId, latitude, longitude);

    res.status(200).json(updatedEntry);

  } catch (error) {
    console.error('Error en handleUpdateLocation:', error);
    if (error.message.includes('not found or user does not have permission')) {
        return res.status(404).json({ error: 'Entrada no encontrada o sin permiso para actualizar ubicación.' });
    }
    res.status(500).json({ error: 'Error al actualizar la ubicación de la entrada.' });
  }
}

/**
 * Controlador para REGISTRAR una agenda en la base de datos.
 * 
 */
export default async function handlerCreateAgenda(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  try {
    const entryData = req.body;

    const nuevaEntrada = await createAgendaEntry(entryData);
    res.status(201).json({ success: true, agenda: nuevaEntrada });
  } catch (error) {
    console.error('Error al crear entrada de agenda:', error);
    res.status(500).json({ error: 'No se pudo crear la entrada de agenda.' });
  }
}