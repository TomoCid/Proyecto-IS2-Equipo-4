// pages/api/users/[userId]/agenda/recommendations.js
import { Pool } from 'pg';
import weatherService from '@/app/weather/weatherService.js';
import { checkWeatherSuitability, findClosestHourlyForecast } from 'src/app/preferencia/comparisonUtils.js'; // Ajusta la ruta si es necesario
import { jwtDecode } from 'jwt-decode';


if (!process.env.DATABASE_URL) {
  console.error("FATAL ERROR: La variable de entorno DATABASE_URL no está definida.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  let client; // Para la conexión a la BD

  try {
    const { userId: queryUserId } = req.query; // ID de la URL
    const token = req.headers.authorization?.split(' ')[1]; // Token de la cabecera

    if (!token) {
      console.warn("[Auth Check] No token provided.");
      return res.status(401).json({ error: 'No se proporcionó token.' });
    }

    let decodedTokenPayload; // Variable para el payload del token decodificado
    try {
      decodedTokenPayload = jwtDecode(token); // Decodificar el token
    } catch (e) {
      console.error("[Auth Check] Error decodificando token:", e.message);
      return res.status(401).json({ error: 'Token inválido o malformado.' });
    }
    
    // Ahora usamos decodedTokenPayload para la lógica de autorización
    const loggedInUserIdFromToken = parseInt(decodedTokenPayload.id || decodedTokenPayload.user_id, 10);
    const targetUserIdFromQuery = parseInt(queryUserId, 10);

    

    if (isNaN(loggedInUserIdFromToken) || isNaN(targetUserIdFromQuery)) {
        console.error("[Auth Check] Error: Uno de los User IDs es NaN después de parsear.");
        return res.status(400).json({ error: 'ID de usuario inválido en la ruta o el token.' });
    }

    if (targetUserIdFromQuery !== loggedInUserIdFromToken) {
        console.warn(`[Auth Check] Authorization FAILED: Target UserID ${targetUserIdFromQuery} !== Token UserID ${loggedInUserIdFromToken}`);
        return res.status(403).json({ error: 'No autorizado para acceder a las recomendaciones de este usuario.' });
    }
    

    // --- Lógica principal del endpoint ---
    client = await pool.connect();
    const todayDate = new Date().toISOString().split('T')[0];

    const queryText = `
      SELECT
          a.id, a.user_id, a.activity_id, act.name AS activity_name,
          a.fecha, a.hora_inicio, a.hora_fin, a.notes,
          a.location_latitude, a.location_longitude,
          a.min_temp, a.max_temp, a.max_wind_speed,
          a.max_precipitation_probability, a.max_precipitation_intensity,
          a.requires_no_precipitation, a.max_uv
      FROM "Agenda" a
      LEFT JOIN "activities" act ON a.activity_id = act.id
      WHERE a.user_id = $1 AND a.fecha >= $2
      ORDER BY a.fecha ASC
      LIMIT 10;
    `;
    // Usar loggedInUserIdFromToken para la consulta, ya que ha sido validado que coincide con el de la URL
    const queryParams = [loggedInUserIdFromToken, todayDate];
    const { rows: upcomingAgendaItems } = await client.query(queryText, queryParams);

    if (!upcomingAgendaItems.length) {
      return res.status(200).json({ recommendations: [], message: "No se encontraron actividades próximas." });
    }
    
    const recommendations = [];
    for (const item of upcomingAgendaItems) {
        const latitude = typeof item.location_latitude === 'object' && item.location_latitude !== null 
                       ? parseFloat(item.location_latitude.toString()) 
                       : parseFloat(item.location_latitude);
        const longitude = typeof item.location_longitude === 'object' && item.location_longitude !== null
                        ? parseFloat(item.location_longitude.toString())
                        : parseFloat(item.location_longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`[Recommendations Logic] Invalid location for agenda item ID ${item.id}. Skipping weather check.`);
            recommendations.push({
            ...item,
            weatherSuitability: { isSuitable: false, reasons: ["Ubicación no configurada o inválida para esta actividad."] }
            });
            continue;
        }
        const locationQuery = `${latitude},${longitude}`;
        
        const activityDate = new Date(item.fecha);
        const today = new Date();
        today.setHours(0,0,0,0); 
        activityDate.setHours(0,0,0,0); 
        
        const diffTime = Math.abs(activityDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        
        if (diffDays > 10) { // Límite de WeatherAPI (o el que tengas)
            recommendations.push({
            ...item,
            weatherSuitability: { isSuitable: false, reasons: ["La actividad está demasiado lejos en el futuro para un pronóstico confiable."] }
            });
            continue;
        }

        const weatherData = await weatherService.obtenerClimaCompleto(locationQuery, diffDays, 'es');
        let weatherSuitability;

        if (weatherData && weatherData.forecast && weatherData.forecast.forecastday) {
            const [hours, minutes, seconds] = item.hora_inicio.split(':').map(Number);
            const activityDateTime = new Date(item.fecha); // Asegúrate que item.fecha sea un objeto Date o un string parseable a Date
            activityDateTime.setHours(hours, minutes, seconds || 0, 0);
            
            const forecastHour = findClosestHourlyForecast(activityDateTime, weatherData.forecast.forecastday);
            
            if (forecastHour) {
                const preferences = {
                    min_temp: item.min_temp,
                    max_temp: item.max_temp,
                    max_wind_speed: item.max_wind_speed,
                    max_precipitation_probability: item.max_precipitation_probability,
                    max_precipitation_intensity: typeof item.max_precipitation_intensity === 'object' && item.max_precipitation_intensity !== null
                                                ? parseFloat(item.max_precipitation_intensity.toString())
                                                : parseFloat(item.max_precipitation_intensity),
                    requires_no_precipitation: item.requires_no_precipitation,
                    max_uv: item.max_uv,
                };
                weatherSuitability = checkWeatherSuitability(forecastHour, preferences);
            } else {
                console.warn(`[Recommendations Logic] Could not find specific hourly forecast for agenda item ID ${item.id} at ${activityDateTime}`);
                weatherSuitability = { isSuitable: false, reasons: ["No se pudo encontrar un pronóstico horario específico para la hora de la actividad."] };
            }
        } else {
            console.warn(`[Recommendations Logic] Weather data could not be fetched for agenda item ID ${item.id}, location: ${locationQuery}`);
            weatherSuitability = { isSuitable: false, reasons: ["No se pudieron obtener los datos del clima para la ubicación."] };
        }
        recommendations.push({ ...item, weatherSuitability });
    }
    
    res.status(200).json({ recommendations });

  } catch (error) {
    console.error('Error general en el handler de /api/users/[userId]/agenda/recommendations:', error);
    console.error(error.stack); 
    res.status(500).json({ error: 'Error interno del servidor al obtener recomendaciones.' });
  } finally {
    if (client) {
      client.release();
    }
  }
}