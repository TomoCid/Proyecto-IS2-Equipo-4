const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.WEATHERAPI_KEY;
const baseUrl = process.env.NEXT_PUBLIC_WEATHERAPI_BASE_URL || 'https://api.weatherapi.com/v1';

if (!apiKey) {
    console.error("Error: La variable de entorno OPENWEATHER_API_KEY no está definida.");
    
}

/**
 * Maneja errores comunes de la API de OpenWeatherMap.
 * @param {Error} error - El objeto de error de Axios.
 * @param {string} ciudad - El nombre de la ciudad (para mensajes de error).
 */
function handleWeatherApiError(error, ciudad) {
    console.error(`Error al obtener datos del clima para ${ciudad} desde WeatherAPI:`);
    if (error.response) {
        console.error(`  Código de Estado: ${error.response.status}`);
        const errorData = error.response.data?.error;
        if (errorData) {
            console.error(`  Código de API: ${errorData.code}`);
            console.error(`  Mensaje de API: ${errorData.message}`);
        } else {
            console.error(`  Mensaje del servidor: ${JSON.stringify(error.response.data)}`);
        }
        
        if (error.response.status === 401 || errorData?.code === 2006 || errorData?.code === 1002) {
            console.error("  -> Problema de Autenticación/API Key. Verifica tu WEATHERAPI_KEY.");
        } else if (error.response.status === 400 && errorData?.code === 1006) {
            console.error(`  -> Ciudad No Encontrada: Verifica que '${ciudad}' sea correcto.`);
        } else if (error.response.status === 403 && (errorData?.code === 2007 || errorData?.code === 2008)) {
            console.error("  -> Problema con la API Key (quota excedida o deshabilitada).");
        }
    } else if (error.request) {
        console.error("  Error de Red: No se pudo conectar con WeatherAPI.");
        console.error(`  Detalles: ${error.message}`);
    } else {
        console.error('  Error Inesperado:', error.message);
    }
}


/**
 * Obtiene datos completos del clima (actual, pronóstico) para una ubicación.
 * La ubicación puede ser un nombre de ciudad o coordenadas "lat,lon".
 * @param {string} locationQuery - Nombre de la ciudad (ej. "Concepcion") O coordenadas (ej. "34.0522,-118.2437").
 * @param {number} diasPronostico - Número de días para el pronóstico (max 3 en plan gratuito, hasta 10 en planes de pago).
 * @param {string} idioma - Código de idioma (ej. 'es').
 * @returns {Promise<object|null>} Datos del clima o null si hay error.
 */
async function obtenerClimaCompleto(locationQuery, diasPronostico = 7, idioma = 'es') {
    if (!apiKey) {
        console.error("Error crítico: WEATHERAPI_KEY no está configurada en el servidor.");
        return null;
    }
    if (!locationQuery || typeof locationQuery !== 'string' || locationQuery.trim() === '') {
        console.error("Error: Debes proporcionar una consulta de ubicación válida (ciudad o lat,lon).");
        return null;
    }

    const params = {
        key: apiKey,
        q: locationQuery, 
        days: diasPronostico,
        lang: idioma,
        aqi: 'no',
        alerts: 'no'
    };

    try {
        console.log(`Buscando clima completo para: ${locationQuery} (${diasPronostico} días, idioma: ${idioma})...`);
        const respuesta = await axios.get(`${baseUrl}/forecast.json`, { params });
        console.log(`Petición de clima completo exitosa para ${locationQuery} (Estado: ${respuesta.status})`);
        return respuesta.data;
    } catch (error) {
        handleWeatherApiError(error, locationQuery);
        return null;
    }
}

module.exports = {
    obtenerClimaCompleto,
};