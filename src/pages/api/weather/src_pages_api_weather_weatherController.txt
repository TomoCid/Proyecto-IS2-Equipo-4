const weatherService = require('@\src\app\weather\weatherService.js'); 

/**
 * Controlador para OBTENER el clima actual de una ciudad.
 * Ruta: GET /api/weather/current/:ciudad
 */
export async function handleGetCurrentWeather(req, res) {
    try {
        const ciudad = req.params.ciudad;
        const { units = 'metric', lang = 'es' } = req.query; // Opciones desde query params

        if (!ciudad) {
            return res.status(400).json({ error: 'Nombre de ciudad requerido en la ruta.' });
        }

        const climaActual = await weatherService.obtenerClimaActual(ciudad, units, lang);

        if (climaActual) {
            res.status(200).json(climaActual);
        } else {
            res.status(404).json({ error: `No se pudo obtener el clima actual para ${ciudad}. Revisa los logs.` });
        }

    } catch (error) {
        console.error('Error inesperado en handleGetCurrentWeather:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener el clima actual.' });
    }
}

/**
 * Controlador para OBTENER el pronóstico por horas de una ciudad.
 * Ruta: GET /api/weather/forecast/hourly/:ciudad
 */
export async function handleGetHourlyForecast(req, res) {
    try {
        const ciudad = req.params.ciudad;
        const { units = 'metric', lang = 'es' } = req.query;

        if (!ciudad) {
            return res.status(400).json({ error: 'Nombre de ciudad requerido en la ruta.' });
        }

        const pronostico = await weatherService.obtenerPronosticoPorHoras(ciudad, units, lang);

        if (pronostico) {
            res.status(200).json(pronostico);
        } else {
            res.status(404).json({ error: `No se pudo obtener el pronóstico para ${ciudad}. Revisa los logs.` });
        }

    } catch (error) {
        console.error('Error inesperado en handleGetHourlyForecast:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener el pronóstico.' });
    }
}

