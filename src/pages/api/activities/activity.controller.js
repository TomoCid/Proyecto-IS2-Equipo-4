import { crearActivity } from "@/app/actividad/activity.service";

/**
 * Controlador para añadir una nueva actividad al usuario.
 */

export async function handleCreateActivity(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const activityData = req.body; // Datos de la actividad desde el cuerpo de la solicitud

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'User ID inválido.' });
      }
    if (!activityData.nombre || !activityData.descripcion || !activityData.nombre_icono) {
      return res.status(400).json({ error: 'Faltan campos requeridos (nombre, descripcion, nombre icono).' });
    }

    activityData.userId = userId; // Asignar el ID del usuario a la actividad
    const newActivity = await crearActivity(activityData); // Llamada al servicio para crear la actividad

    res.status(201).json(newActivity); // Respuesta exitosa con la nueva actividad creada
  } catch (error) {
    console.error('Error en handleCreateActivity:', error);
    res.status(500).json({ error: 'Error al crear la actividad.' });
  }
}