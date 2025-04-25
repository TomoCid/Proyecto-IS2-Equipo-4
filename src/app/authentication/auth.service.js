import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * 1. Registra un nuevo usuario en la base de datos.
 * @param {string} email - Correo del usuario
 * @param {string} password - Contraseña del usuario (sin hashear)
 * @param {string} username - Nombre de usuario
 * @returns {Object} Objeto que contiene el token y los datos del usuario registrado
 */
export async function registerUser(email, password, username) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO "user" (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username`,
      [email, hashedPassword, username]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { token, user };
  } finally {
    client.release();
  }
}

/**
 * 2. Inicia sesión de un usuario validando su contraseña.
 * @param {string} email - Correo del usuario
 * @param {string} password - Contraseña del usuario (sin hashear)
 * @returns {Object} Objeto que contiene el token y los datos del usuario autenticado
 * @throws {Error} Si el usuario no existe o la contraseña es incorrecta
 */
export async function loginUser(email, password) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT id, email, password, username FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };
  } finally {
    client.release();
  }
}
