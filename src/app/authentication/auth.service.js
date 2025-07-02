import getPool from '../../pages/api/activities/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key_for_development';

export async function registerUser(email, password, username) {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
        'INSERT INTO "users" (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
        [email, hashedPassword, username]
    );
    return result.rows[0];
}

export async function loginUser(email, password) {
    const pool = getPool();

    const result = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
        throw new Error('Invalid email or password'); 
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw new Error('Invalid email or password');
    }

    const payload = { 
      id: user.id, 
      email: user.email, 
      username: user.username  
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });

    return { token, user: { id: user.id, email: user.email, username: user.username } };
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        console.error("Error al verificar el token:", error.message);
        throw error;
    }
}