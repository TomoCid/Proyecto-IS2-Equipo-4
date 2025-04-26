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