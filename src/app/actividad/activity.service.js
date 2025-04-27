import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 1. Registra una nueva actividad en la base de datos.
 * @param {number} user_id - key del usuario asignado a la actividad
 * @param {string} name - Nombre de la actividad
 * @param {string} description - Descripción de la actividad
 * @param {string} icon_name - Nombre del icono de la actividad
 * @returns {Object} Objeto que contiene los datos de la actividad 
 */

export async function crearActivity(user_id, name, description, icon_name) {
    const query = `
        INSERT INTO "activity" (user_id, name, description, icon_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, name, description, icon_name
    `;

    const values = [under_id, name, description, icon_name];

    const client = await pool.connect();

    try {
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Failed to create activity');
        }
        return result.rows;
      } finally {
        client.release();
      }
}



