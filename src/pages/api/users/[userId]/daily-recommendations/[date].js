import { handleGetRecommendationsForDate } from '../../../agenda/agenda.controller';
import { verifyToken } from '../../../../../app/authentication/auth.service';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Acceso no autorizado.' });
        }
        
        const decoded = verifyToken(token);
        const { userId } = req.query;

        if (String(decoded.id) !== String(userId)) {
            return res.status(403).json({ error: 'Acción prohibida.' });
        }

        await handleGetRecommendationsForDate(req, res);

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token inválido o expirado.' });
        }
        console.error("Error en el manejador de la API de recomendaciones diarias:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}