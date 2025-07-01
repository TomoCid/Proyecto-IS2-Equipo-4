import { handleCreateOrUpdatePreference } from '../preference.controller.js';
import { verifyToken } from '../../../../app/authentication/auth.service.js';

export default async function handler(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Acceso no autorizado.' });
        }
        
        const decoded = verifyToken(token);
        const { userId, activityId } = req.query;

        if (String(decoded.id) !== String(userId)) {
            return res.status(403).json({ error: 'Acción prohibida.' });
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            await handleCreateOrUpdatePreference(req, res, userId, activityId);
        } else {
            res.setHeader('Allow', ['POST', 'PUT']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token inválido o expirado.' });
        }
        console.error("Error en el manejador de la API de preferencias:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}