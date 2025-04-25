// Importamos las funciones necesarias para el registro e inicio de sesión de usuarios
import { registerUser, loginUser } from '../../../app/authentication/auth.service';

/**
 * Controlador para registrar un nuevo usuario.
 * Recibe email, password y username desde el cuerpo del request.
 * Devuelve un token y los datos del usuario si el registro es exitoso.
 */
export async function register(req, res) {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { token, user } = await registerUser(email, password, username);

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * Controlador para iniciar sesión de un usuario.
 * Recibe email y password desde el cuerpo del request.
 * Devuelve un token y los datos del usuario si las credenciales son válidas.
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { token, user } = await loginUser(email, password);

    res.status(200).json({ token, user });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(401).json({ error: 'Invalid email or password' });
  }
}
