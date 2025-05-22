import { getUserById, getActividadesByUserId } from '@/app/usuario/consultas-usuario.js';

/**
 * 1. Controlador para obtener los datos de un usuario por su ID.
 * @param {Object} req
 * @param {Object} res 
 */
export async function handleGetUserById(req, res) {
  if (req.method === 'GET') {
    const { userId } = req.query; 

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      const user = await getUserById(userId);
      return res.status(200).json({ message: 'User data retrieved successfully', user });
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      return res.status(500).json({ error: 'Failed to fetch user data', details: error.message });
    }
  } else {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

/**
 * 2. Controlador para obtener las actividades de un usuario por su ID.
 * @param {Object} req
 * @param {Object} res 
 */
//Pruebas de ejemplo: http://localhost:3000/api/users/usuario.controller?userId=1&activities=true
export async function handleGetUserActivities(req, res) {
  if (req.method === 'GET') {
    const { userId } = req.query; 

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      const actividadesUsuario = await getActividadesByUserId(userId);
      return res.status(200).json({ message: 'Actividades obtenidas correctamente', activities: actividadesUsuario });
    } catch (error) {
      console.error('Error fetching user activities:', error.message);
      return res.status(500).json({ error: 'Failed to fetch user activities', details: error.message });
    }
  } else {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}