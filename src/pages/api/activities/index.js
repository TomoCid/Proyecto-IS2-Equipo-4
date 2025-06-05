// pages/api/activities/index.js
import getPool from 'src/pages/api/activities/db.js'; 

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log("REQ.BODY en /api/activities POST:", JSON.stringify(req.body, null, 2));
    const { activity, preferences } = req.body;

    if (!activity || typeof activity !== 'object' || !preferences || typeof preferences !== 'object') {
        console.error("Error: Estructura de payload inválida recibida.");
        return res.status(400).json({ message: 'Estructura de payload inválida.' });
    }

    const { name, description, icon_name, user_id: activityUserId } = activity;
    const {
      user_id: prefUserId,
      min_temp, max_temp, max_wind_speed,
      max_precipitation_probability, max_precipitation_intensity,
      requires_no_precipitation, max_uv, is_active,
    } = preferences;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'El nombre de la actividad es obligatorio.' });
    }
    if (name.trim().length > 100) {
        return res.status(400).json({ message: 'El nombre de la actividad no puede exceder los 100 caracteres.' });
    }
    if (typeof activityUserId !== 'number' || typeof prefUserId !== 'number' || activityUserId !== prefUserId) {
        console.error("Error: ID de usuario inválido o no coincidente. activityUserId:", activityUserId, "prefUserId:", prefUserId);
        return res.status(400).json({ message: 'ID de usuario inválido o no coincidente en el payload.' });
    }
    if (min_temp !== null && max_temp !== null && Number(min_temp) > Number(max_temp)) {
        return res.status(400).json({ message: 'La temperatura mínima no puede ser mayor que la máxima.' });
    }
    // Aquí puedes añadir más validaciones de tipos y rangos para los campos de preferencias

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN'); // Iniciar transacción

      // 1. Insertar en la tabla 'activities'
      const activityInsertQuery = `
        INSERT INTO activities (user_id, name, description, icon_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, icon_name, user_id, created_at;
      `;
      const activityValues = [
        activityUserId,
        name.trim(),
        description || null,
        icon_name || null,
      ];
      
      const activityResult = await client.query(activityInsertQuery, activityValues);
      const newActivity = activityResult.rows[0];

      // 2. Insertar en la tabla 'user_activity_preferences'
      const preferencesInsertQuery = `
        INSERT INTO user_activity_preferences (
          user_id, activity_id, min_temp, max_temp, max_wind_speed,
          max_precipitation_probability, max_precipitation_intensity,
          requires_no_precipitation, max_uv, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *; 
      `;
      // Los valores numéricos ya deberían ser null o Number desde el frontend
      const preferenceValues = [
        prefUserId,
        newActivity.id,
        min_temp, max_temp, max_wind_speed,
        max_precipitation_probability, max_precipitation_intensity,
        typeof requires_no_precipitation === 'boolean' ? requires_no_precipitation : false,
        max_uv,
        typeof is_active === 'boolean' ? is_active : true,
      ];

      const preferencesResult = await client.query(preferencesInsertQuery, preferenceValues);
      const newPreferences = preferencesResult.rows[0];

      await client.query('COMMIT'); // Confirmar transacción

      res.status(201).json({
        message: 'Actividad y preferencias creadas exitosamente.',
        activity: newActivity,
        preferences: newPreferences,
      });

    } catch (error) {
      await client.query('ROLLBACK'); // Revertir transacción en caso de error
      console.error('Error al crear actividad [POST /api/activities]:', error);

      if (error.code === '23505') { // Código de error para violación de unicidad en PostgreSQL
        // El nombre de la constraint es 'activities_name_user_id_key' si se creó con UNIQUE("name", "user_id")
        // y la BD le asignó ese nombre. Verifica el nombre exacto en tu BD.
        if (error.constraint && error.constraint.toLowerCase().includes('activities_name_user_id')) { 
             return res.status(409).json({ message: `Ya existe una actividad con el nombre "${name.trim()}" para este usuario.` });
        }
      }
      
      res.status(500).json({ message: 'Error interno del servidor al guardar la actividad.' });
    } finally {
      client.release(); // Liberar cliente de la pool
    }

  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}