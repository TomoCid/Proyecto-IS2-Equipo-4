import weatherService from '@/app/weather/weatherService.js'; 

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Método ${req.method} no permitido.` });
    }

    try {
        const { ciudad } = req.query; // El nombre del archivo [ciudad].js hace que 'ciudad' esté en req.query
        const { lang = 'es', days = '7' } = req.query; // Opciones desde query params

        if (!ciudad) {
            return res.status(400).json({ error: 'Nombre de ciudad requerido en la ruta. Ejemplo: /api/weather/Concepcion' });
        }

        const diasPronostico = parseInt(days, 10);
        if (isNaN(diasPronostico) || diasPronostico < 1 || diasPronostico > 10) { // WeatherAPI permite hasta 10 (plan gratuito 3)
             return res.status(400).json({ error: 'El parámetro "days" debe ser un número entre 1 y 10.' });
        }

        const climaData = await weatherService.obtenerClimaCompleto(ciudad, diasPronostico, lang);

        if (climaData) {
            res.status(200).json(climaData);
        } else {
            res.status(404).json({ error: `No se pudo obtener el clima para ${ciudad}. Revisa los logs del servidor.` });
        }

    } catch (error) {
        console.error('Error inesperado en el handler de /api/weather/[ciudad]:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener el clima.' });
    }
}