import pg from 'pg';
import { getUserById } from '../../app/usuario/consultas-usuario';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Necessary for Neon
});

// Handler principal para probar la conexión a la base de datos
export default async function handler(req, res) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return res.status(200).json({ message: 'Database connection successful', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
}

// Test obtención de datos de un usuario
export async function testFetchUserData(userId) {
  try {
    const user = await getUserById(userId);
    console.log('Datos del usuario:', user);
    return user;
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error.message);
    throw error;
  }
}