import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 1. Registra una nueva actividad en la base de datos.
 * @param {number} user_id - key del usuario asignado a las preferencias
 * @param {number} activity_id - Nombre de la actividad
 * @param {number} min_temp - Temperatura minima ena actividad
 * @param {number} max_temp - Temperatura maxima en la actividad
 * @param {number} max_wind_speed - Velocidad maximo el viento en al actividad
 * @param {number} max_precipitation_probability - Cantidad maxima de precipitacion en la actividad
 * @param {boolean} requires_no_precipitation - Requicito de precipitación en la actividad
 * @param {number} max_uv - Cantidad maxima de rayos UV en la actividad
 * @param {boolean} is_active - Estado de la actividad 
 * @returns {Object} Objeto que contiene las preferencias de la actividad agendada por un usuario
 */

export async function createPreference(user_id, activity_id, min_temp, max_temp, max_wind_speed, max_precipitation_probability,requires_no_precipitation, max_uv, is_active) {
    const query = `
        INSERT INTO "user_activity_preferences" ("user_id", "activity_id", "min_temp", "max_temp", "max_wind_speed", "max_precipitation_probability", "requires_no_precipitation", "max_uv", "is_active") VALUES
        ($1, $2, $3, $4, %5, $6, $7, $8, $9);
        RETURNING *;
    `;

    const values = [user_id, activity_id, min_temp, max_temp, max_wind_speed, max_precipitation_probability,requires_no_precipitation, max_uv, is_active];

    const client = await pool.connect();

    try {
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Failed to create preference');
        }
        return result.rows;
      } finally {
        client.release();
      }
}

/**
 * 2. Modificar preferencias de actividad de un usuario 
 * @param {number} user_id - key del usuario asignado a la actividad
 * @param {number} activity_id - Nombre de la actividad
 * @param {number} min_temp - Temperatura minima ena actividad
 * @param {number} max_temp - Temperatura maxima en la actividad
 * @param {number} max_wind_speed - Velocidad maximo el viento en al actividad
 * @param {number} max_precipitation_probability - Cantidad maxima de precipitacion en la actividad
 * @param {boolean} requires_no_precipitation - Requicito de precipitación en la actividad
 * @param {number} max_uv - Cantidad maxima de rayos UV en la actividad
 * @param {boolean} is_active
 * @param {boolean} status - Estado de la actividad (true o false)
 * @returns {boolean} Estado de la actividad 
 */

export async function modifyPreference(userId, activityId, updateData) {
    const query = `
        UPDATE "user_activity_preferences"
        SET min_temp = COALESCE($3, min_temp),
            max_temp = COALESCE($4, max_temp),
            max_wind_speed = COALESCE($5, max_wind_speed),
            max_precipitation_probability = COALESCE($6, max_precipitation_probability),
            requires_no_precipitation = COALESCE($7, requires_no_precipitation),
            max_uv = COALESCE($8, max_uv),
            is_active = COALESCE($9, is_active)
        WHERE user_id = $1 AND activity_id = $2
        RETURNING *;
    `;

    const values = [
        userId,
        activityId,
        updateData.min_temp,
        updateData.max_temp,
        updateData.max_wind_speed,
        updateData.max_precipitation_probability,
        updateData.requires_no_precipitation,
        updateData.max_uv,
        updateData.is_active,   
    ];

    const client = await pool.connect();

    try {
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Failed to modify preference');
        }
        return result.rows[0];
    } finally {
        client.release();
    }
}