import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * 1. Obtiene los datos de un usuario por su ID.
 * @param {number} userId - ID único del usuario.
 * @returns {Object} Datos del usuario.
 * @throws {Error} Si el usuario no existe o ocurre un error en la consulta.
 */
export async function getUserById(userId) {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id, email, username, created_at, updated_at
      FROM "users"
      WHERE id = $1
    `;
    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * 2. Obtiene todas las actividades de un usuario, incluyendo las del sistema (user_id NULL).
 * @param {number} userId 
 * @returns {Array}
 */
export async function getActividadesByUserId(userId) {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id, user_id, name, description, icon_name
      FROM "activities"
      WHERE user_id = $1 OR user_id IS NULL
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
}