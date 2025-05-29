// pages/api/weather/coords.js
import weatherService from '@/app/weather/weatherService.js'; 
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Método ${req.method} no permitido.` });
    }

    try {
        const { lat, lon, lang = 'es', days = '7' } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: 'Los parámetros "lat" (latitud) y "lon" (longitud) son requeridos.' });
        }

        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);

        if (isNaN(parsedLat) || isNaN(parsedLon)) {
            return res.status(400).json({ error: 'Latitud y longitud deben ser números válidos.' });
        }

        const diasPronostico = parseInt(days, 10);
        if (isNaN(diasPronostico) || diasPronostico < 1 || diasPronostico > 10) { // WeatherAPI permite hasta 10
             return res.status(400).json({ error: 'El parámetro "days" debe ser un número entre 1 y 10.' });
        }

        const locationQuery = `${parsedLat},${parsedLon}`;

        const climaData = await weatherService.obtenerClimaCompleto(locationQuery, diasPronostico, lang);

        if (climaData) {
            res.status(200).json(climaData);
        } else {
            res.status(404).json({ error: `No se pudo obtener el clima para las coordenadas ${locationQuery}. Revisa los logs del servidor.` });
        }

    } catch (error) {
        console.error('Error inesperado en el handler de /api/weather/coords:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener el clima por coordenadas.' });
    }
}