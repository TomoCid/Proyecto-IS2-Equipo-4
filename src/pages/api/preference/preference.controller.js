import { createOrUpdatePreference } from '../../../app/preferencia/preference.service.js';

export async function handleCreateOrUpdatePreference(req, res, userId, activityId) {
    try {
        const preferenceData = req.body;
        
        if (!preferenceData || Object.keys(preferenceData).length === 0) {
            return res.status(400).json({ error: 'No se enviaron datos de preferencias.' });
        }
        
        const preference = await createOrUpdatePreference(userId, activityId, preferenceData);
        res.status(200).json(preference);

    } catch (error) {
        console.error(`Error en handleCreateOrUpdatePreference para user ${userId}, activity ${activityId}:`, error);
        res.status(500).json({ error: 'Error interno al guardar las preferencias.' });
    }
}