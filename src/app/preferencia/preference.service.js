import getPool from '../../pages/api/activities/db.js';

export async function createOrUpdatePreference(userId, activityId, prefs) {
    const pool = getPool(); 
    
    const {
        min_temp, max_temp, max_wind_speed, max_precipitation_probability,
        max_precipitation_intensity, requires_no_precipitation, max_uv
    } = prefs;

    const query = `
        INSERT INTO "user_activity_preferences" (
            user_id, activity_id, min_temp, max_temp, max_wind_speed, 
            max_precipitation_probability, max_precipitation_intensity, 
            requires_no_precipitation, max_uv
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, activity_id) DO UPDATE SET
            min_temp = EXCLUDED.min_temp, max_temp = EXCLUDED.max_temp,
            max_wind_speed = EXCLUDED.max_wind_speed, max_precipitation_probability = EXCLUDED.max_precipitation_probability,
            max_precipitation_intensity = EXCLUDED.max_precipitation_intensity,
            requires_no_precipitation = EXCLUDED.requires_no_precipitation, max_uv = EXCLUDED.max_uv,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *;
    `;

    const values = [
        userId, activityId, min_temp, max_temp, max_wind_speed,
        max_precipitation_probability, max_precipitation_intensity,
        requires_no_precipitation, max_uv
    ];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error("Error en la base de datos al guardar la preferencia:", error);
        throw error;
    }
}

export async function getPreferencesByActivity(userId, activityId) {
    const pool = getPool();
    const result = await pool.query(
        'SELECT * FROM "user_activity_preferences" WHERE user_id = $1 AND activity_id = $2',
        [userId, activityId]
    );
    return result.rows[0] || null;
}