import * as agendaModel from '@/app/agenda/consultas-agenda.js';
const weatherService = require('@/app/weather/weatherService.js'); 
const { compararClimaConPreferencias } = require('@/app/agenda/comparisonService.js'); 
import { parseISO, closestIndexTo, differenceInHours } from 'date-fns'; // instalar date-fns: npm install date-fns

/**
 * Encuentra el punto de pronóstico más cercano en el tiempo a una entrada de agenda.
 * @param {object} agendaEntry - La entrada de la agenda con fecha y hora_inicio.
 * @param {Array<object>} forecastList - La lista `list` del pronóstico de OWM.
 * @returns {object|null} El punto de pronóstico más cercano o null.
 */
function findClosestForecast(agendaEntry, forecastList) {
    if (!forecastList || forecastList.length === 0) return null;
    try {
        const agendaDateTimeStr = `${agendaEntry.fecha}T${agendaEntry.hora_inicio}`;
        const agendaTargetDate = parseISO(agendaDateTimeStr); 

        if (isNaN(agendaTargetDate)) {
            console.warn(`Fecha/hora inválida para agenda ID ${agendaEntry.id}: ${agendaDateTimeStr}`);
            return null;
        }

        const forecastDates = forecastList.map(f => new Date(f.dt * 1000)); 

        const closestIdx = closestIndexTo(agendaTargetDate, forecastDates);

        if (closestIdx === undefined || closestIdx < 0 || closestIdx >= forecastList.length) {
             console.warn(`No se encontró índice de pronóstico cercano para agenda ID ${agendaEntry.id}`);
            return null;
        }

        const forecastDate = forecastDates[closestIdx];
        if (Math.abs(differenceInHours(agendaTargetDate, forecastDate)) > 2) {
            console.warn(`El pronóstico más cercano para agenda ID ${agendaEntry.id} está demasiado lejos en el tiempo.`);
        }

        return forecastList[closestIdx];

    } catch (e) {
         console.error(`Error procesando fecha/hora para agenda ID ${agendaEntry.id}:`, e);
         return null;
    }
}


/**
 * Controlador para OBTENER la agenda de un usuario para un rango de fechas
 * y AÑADIR información sobre la adecuación del clima según preferencias.
 * Ruta: GET /api/users/:userId/agenda/weather-suitability?city=NombreCiudad&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function handleGetAgendaWithWeatherSuitability(req, res) {
    try {
        const userId = parseInt(req.params.userId, 10);
        const { city, startDate, endDate } = req.query; 

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'User ID inválido.' });
        }
        if (!city) {
            return res.status(400).json({ error: 'Parámetro "city" requerido en la consulta.' });
        }

        let agendaConPrefs = await agendaModel.getUserAgendaWithWeatherPrefs(userId);

        if (startDate) {
             agendaConPrefs = agendaConPrefs.filter(entry => entry.fecha >= startDate);
        }
        if (endDate) {
             agendaConPrefs = agendaConPrefs.filter(entry => entry.fecha <= endDate);
        }

        if (agendaConPrefs.length === 0) {
             return res.status(200).json({ message: "No hay entradas de agenda en el rango especificado.", agenda: [] });
        }

        const pronostico = await weatherService.obtenerPronosticoPorHoras(city);

        if (!pronostico || !pronostico.list) {
             console.warn(`No se pudo obtener pronóstico para ${city}. Devolviendo agenda sin análisis de clima.`);
             return res.status(200).json({
                 message: "No se pudo obtener el pronóstico del tiempo.",
                 agenda: agendaConPrefs.map(entry => ({ ...entry, weatherSuitability: { checked: false, reason: "Pronóstico no disponible" } }))
             });
        }

        const agendaConResultadosClima = agendaConPrefs.map(entry => {
            const forecastPoint = findClosestForecast(entry, pronostico.list);
            let suitabilityResult = { checked: false, adecuado: false, razon: "No se encontró pronóstico para la hora exacta." };

            if (forecastPoint) {
                const preferencias = {
                    min_temp: entry.min_temp,
                    max_temp: entry.max_temp,
                    max_wind_speed: entry.max_wind_speed,
                    requires_no_precipitation: entry.requires_no_precipitation
                };
                suitabilityResult = { checked: true, ...compararClimaConPreferencias(forecastPoint, preferencias) };
            }

            return {
                ...entry, 
                weatherForecast: forecastPoint, 
                weatherSuitability: suitabilityResult 
            };
        });

        res.status(200).json({ message: "Análisis de clima completado.", agenda: agendaConResultadosClima });

    } catch (error) {
        console.error('Error en handleGetAgendaWithWeatherSuitability:', error);
        res.status(500).json({ error: 'Error al procesar la agenda con información del clima.' });
    }
}

