import * as preferenceService from '@app/preference/preference.service.js';

/**
 * Controlador para asignar preferencias a actividad de un usuario.
 */

export async function handleCreatePreference(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const activityId = parseInt(req.params.activityId, 10);
    const preferenceData = req.body; // Datos de la preferencia desde el cuerpo de la solicitud

    if (isNaN(userId) || isNaN(activityId)) {
      return res.status(400).json({ error: 'User ID o Activity ID inválido.' });
    }
    if (!preferenceData.min_temp || !preferenceData.max_temp || !preferenceData.max_wind_speed 
        || !preferenceData.max_precipitation_probability || !preferenceData.requires_no_precipitation 
        || !preferenceData.max_uv || !preferenceData.is_active) {
      return res.status(400).json({ error: 'Faltan campos requeridos (nombre, descripcion).' });
    }

    preferenceData.userId = userId; // Asignar el ID del usuario a la preferencia
    preferenceData.activityId = activityId; // Asignar el ID de la actividad a la preferencia
    const newPreference = await preferenceService.createPreference(preferenceData); // Llamada al servicio para crear la preferencia

    res.status(201).json(newPreference); // Respuesta exitosa con la nueva preferencia creada
  } catch (error) {
    console.error('Error en handleCreatePreference:', error);
    res.status(500).json({ error: 'Error al crear la preferencia.' });
  }
}

/**
 * Controlador para modificar preferencias de actividad de un usuario.
 */

export async function handleModifyPreference(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const activityId = parseInt(req.params.activityId, 10);
    const updateData = req.body; // Datos de la preferencia desde el cuerpo de la solicitud

    if (isNaN(userId) || isNaN(activityId)) {
      return res.status(400).json({ error: 'User ID o Activity ID inválido.' });
    }

    const updatedPreference = await preferenceService.modifyPreference(userId, activityId, updateData); // Llamada al servicio para modificar la preferencia

    res.status(200).json(updatedPreference); // Respuesta exitosa con la preferencia modificada
  } catch (error) {
    console.error('Error en handleModifyPreference:', error);
    res.status(500).json({ error: 'Error al modificar la preferencia.' });
  }
}
