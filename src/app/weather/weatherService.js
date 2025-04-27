const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.OPENWEATHER_API_KEY;
const weatherBaseUrl = 'https://api.openweathermap.org/data/2.5/weather'; // Clima actual
const forecastBaseUrl = 'https://api.openweathermap.org/data/2.5/forecast'; // Pronóstico 5 días 

if (!apiKey) {
    console.error("Error: La variable de entorno OPENWEATHER_API_KEY no está definida.");
    process.exit(1);
}

/**
 * Maneja errores comunes de la API de OpenWeatherMap.
 * @param {Error} error - El objeto de error de Axios.
 * @param {string} ciudad - El nombre de la ciudad (para mensajes de error).
 */
function handleWeatherApiError(error, ciudad) {
    console.error(`Error al obtener datos del clima para ${ciudad}:`);
    if (error.response) {
        console.error(`  Código de Estado: ${error.response.status}`);
        console.error(`  Mensaje del servidor: ${error.response.data?.message || JSON.stringify(error.response.data)}`);
        if (error.response.status === 401) {
            console.error("  -> Problema de Autenticación: Verifica tu API Key.");
        } else if (error.response.status === 404) {
            console.error(`  -> Ciudad No Encontrada: Verifica que '${ciudad}' sea correcto.`);
        } else if (error.response.status === 429) {
             console.error("  -> Límite de Tasa Excedido: Demasiadas peticiones a la API.");
        }
    } else if (error.request) {
        console.error("  Error de Red: No se pudo conectar con OpenWeatherMap.");
        console.error(`  Detalles: ${error.message}`);
    } else {
        console.error('  Error Inesperado:', error.message);
    }
}


/**
 * Obtiene los datos del clima ACTUAL para una ciudad.
 * @param {string} ciudad - El nombre de la ciudad (ej. "Concepcion,cl").
 * @param {string} unidades - 'metric', 'imperial', 'standard'.
 * @param {string} idioma - Código de idioma (ej. 'es').
 * @returns {Promise<object|null>} Datos del clima actual o null.
 */
async function obtenerClimaActual(ciudad, unidades = 'metric', idioma = 'es') {
    if (!ciudad || typeof ciudad !== 'string' || ciudad.trim() === '') {
        console.error("Error: Debes proporcionar un nombre de ciudad válido.");
        return null;
    }
    const params = { q: ciudad, appid: apiKey, units: unidades, lang: idioma };
    try {
        console.log(`Buscando clima ACTUAL para: ${ciudad}...`);
        const respuesta = await axios.get(weatherBaseUrl, { params });
        console.log(`Petición de clima actual exitosa (Estado: ${respuesta.status})`);
        return respuesta.data;
    } catch (error) {
        handleWeatherApiError(error, ciudad);
        return null;
    }
}

/**
 * Obtiene el pronóstico del clima por horas (5 días / 3 horas) para una ciudad.
 * @param {string} ciudad - El nombre de la ciudad (ej. "Concepcion,cl").
 * @param {string} unidades - 'metric', 'imperial', 'standard'.
 * @param {string} idioma - Código de idioma (ej. 'es').
 * @returns {Promise<object|null>} Datos del pronóstico o null. La estructura contiene una lista `list` con los pronósticos cada 3 horas.
 */
async function obtenerPronosticoPorHoras(ciudad, unidades = 'metric', idioma = 'es') {
    if (!ciudad || typeof ciudad !== 'string' || ciudad.trim() === '') {
        console.error("Error: Debes proporcionar un nombre de ciudad válido para el pronóstico.");
        return null;
    }
    const params = { q: ciudad, appid: apiKey, units: unidades, lang: idioma };
    try {
        console.log(`Buscando PRONÓSTICO por horas para: ${ciudad}...`);
        const respuesta = await axios.get(forecastBaseUrl, { params });
        console.log(`Petición de pronóstico exitosa (Estado: ${respuesta.status})`);
        // La respuesta contiene city (info de la ciudad) y list (array de pronósticos)
        return respuesta.data;
    } catch (error) {
        handleWeatherApiError(error, ciudad);
        return null;
    }
}


module.exports = {
    obtenerClimaActual,
    obtenerPronosticoPorHoras,
    obtenerClima: obtenerClimaActual
};