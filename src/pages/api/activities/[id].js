// pages/api/activities/[id].js
import getPool from 'src/pages/api/activities/db.js'; 

async function getActivityStatus(client, activityId, requestingUserId) {
  const activityQuery = 'SELECT id, user_id, name FROM activities WHERE id = $1';
  const activityResult = await client.query(activityQuery, [activityId]);

  if (activityResult.rows.length === 0) {
    return { status: 'not_found', activityData: null };
  }
  
  const activityData = activityResult.rows[0];
  if (activityData.user_id === null) {
    return { status: 'standard', activityData }; 
  }
  if (activityData.user_id === requestingUserId) {
    return { status: 'owned', activityData }; 
  }
  return { status: 'other_user', activityData }; 
}


export default async function handler(req, res) {
  const { id: activityIdParam } = req.query; 
  
  if (req.method === 'PUT') {
    const activityId = Number(activityIdParam);
    if (isNaN(activityId)) {
      return res.status(400).json({ message: 'ID de actividad inválido en la URL.' });
    }

    
    const {
      name, description, icon_name,
      min_temp, max_temp, max_wind_speed,
      max_precipitation_probability, max_precipitation_intensity,
      requires_no_precipitation, max_uv, is_active,
      user_id: currentUserId 
    } = req.body;

    // --- Validación de Payload ---
    if (typeof currentUserId !== 'number') {
        return res.status(400).json({ message: 'ID de usuario no proporcionado o inválido en el cuerpo de la solicitud.' });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre de la actividad es obligatorio.' });
    }
    if (name.trim().length > 100) {
        return res.status(400).json({ message: 'El nombre de la actividad no puede exceder los 100 caracteres.' });
    }
    if (min_temp !== null && max_temp !== null && Number(min_temp) > Number(max_temp)) {
      return res.status(400).json({ message: 'La temperatura mínima no puede ser mayor que la máxima.' });
    }
    // Aquí puedes añadir más validaciones de tipos y rangos

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { status, activityData: originalActivityData } = await getActivityStatus(client, activityId, currentUserId);

      if (status === 'not_found') {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Actividad no encontrada.' });
      }
      if (status === 'other_user') {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'No autorizado para modificar esta actividad.' });
      }

      let updatedActivityDetails;
      let updatedPreferencesDetails;

      if (status === 'owned') {
        // El usuario es dueño de la actividad: Actualizar 'activities' y 'user_activity_preferences'
        
        const activityUpdateQuery = `
          UPDATE activities
          SET name = $1, description = $2, icon_name = $3, updated_at = NOW()
          WHERE id = $4 AND user_id = $5
          RETURNING *;
        `;
        const activityUpdateValues = [
          name.trim(), description || null, icon_name || null,
          activityId, currentUserId
        ];
        const activityUpdateResult = await client.query(activityUpdateQuery, activityUpdateValues);
        updatedActivityDetails = activityUpdateResult.rows[0];

        // Siempre debe existir una preferencia si es 'owned', así que actualizamos.
        const preferencesUpdateQuery = `
          UPDATE user_activity_preferences
          SET min_temp = $1, max_temp = $2, max_wind_speed = $3,
              max_precipitation_probability = $4, max_precipitation_intensity = $5,
              requires_no_precipitation = $6, max_uv = $7, is_active = $8, updated_at = NOW()
          WHERE activity_id = $9 AND user_id = $10
          RETURNING *;
        `;
        const preferenceUpdateValues = [
          min_temp, max_temp, max_wind_speed,
          max_precipitation_probability, max_precipitation_intensity,
          requires_no_precipitation, max_uv, is_active,
          activityId, currentUserId
        ];
        const preferencesUpdateResult = await client.query(preferencesUpdateQuery, preferenceUpdateValues);
         if (preferencesUpdateResult.rowCount === 0) {
            // Esto no debería ocurrir si la lógica es correcta, pero como salvaguarda, la creamos.
            const prefInsertQuery = `
                INSERT INTO user_activity_preferences (user_id, activity_id, min_temp, max_temp, max_wind_speed, max_precipitation_probability, max_precipitation_intensity, requires_no_precipitation, max_uv, is_active)
                VALUES ($10, $9, $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
            `; // Note el orden de user_id, activity_id
            const preferencesInsertResult = await client.query(prefInsertQuery, preferenceUpdateValues);
            updatedPreferencesDetails = preferencesInsertResult.rows[0];
        } else {
            updatedPreferencesDetails = preferencesUpdateResult.rows[0];
        }

      } else if (status === 'standard') {
        // Es una actividad estándar (activity.user_id IS NULL).
        // El usuario está "personalizando" sus preferencias para esta actividad estándar.
        // No se actualiza la tabla 'activities'. Solo se hace un UPSERT en 'user_activity_preferences'.
        updatedActivityDetails = originalActivityData; // Los detalles de la actividad base no cambian

        const preferencesUpsertQuery = `
          INSERT INTO user_activity_preferences (
            user_id, activity_id, min_temp, max_temp, max_wind_speed,
            max_precipitation_probability, max_precipitation_intensity,
            requires_no_precipitation, max_uv, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (user_id, activity_id) DO UPDATE SET
            min_temp = EXCLUDED.min_temp,
            max_temp = EXCLUDED.max_temp,
            max_wind_speed = EXCLUDED.max_wind_speed,
            max_precipitation_probability = EXCLUDED.max_precipitation_probability,
            max_precipitation_intensity = EXCLUDED.max_precipitation_intensity,
            requires_no_precipitation = EXCLUDED.requires_no_precipitation,
            max_uv = EXCLUDED.max_uv,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
          RETURNING *;
        `;
        const preferenceUpsertValues = [
          currentUserId, activityId, // activityId aquí es el de la actividad estándar
          min_temp, max_temp, max_wind_speed,
          max_precipitation_probability, max_precipitation_intensity,
          requires_no_precipitation, max_uv, is_active
        ];
        const preferencesUpsertResult = await client.query(preferencesUpsertQuery, preferenceUpsertValues);
        updatedPreferencesDetails = preferencesUpsertResult.rows[0];
      }

      await client.query('COMMIT');
      res.status(200).json({
        message: 'Actividad y/o preferencias actualizadas exitosamente.',
        activity: updatedActivityDetails,
        preferences: updatedPreferencesDetails,
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error al actualizar actividad [PUT /api/activities/${activityIdParam}]:`, error);
       if (error.code === '23505') { 
         if (error.constraint && error.constraint.toLowerCase().includes('activities_name_user_id')) {
             return res.status(409).json({ message: `Ya existe otra actividad con el nombre "${name.trim()}" para este usuario.` });
         }
       }
      res.status(500).json({ message: 'Error interno del servidor al actualizar la actividad.' });
    } finally {
      client.release();
    }

  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}