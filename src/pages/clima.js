const axios = require('axios');
require('dotenv').config(); 

const apiKey = process.env.OPENWEATHER_API_KEY; 
const baseUrl = 'https://api.openweathermap.org/data/2.5/weather';


if (!apiKey) {
    console.error("Error: La variable de entorno OPENWEATHER_API_KEY no está definida.");
    console.log("Asegúrate de crear un archivo .env con OPENWEATHER_API_KEY=TU_API_KEY_AQUI");
    process.exit(1); 
}



/**
 * Obtiene los datos del clima para una ciudad específica desde OpenWeatherMap.
 * @param {string} ciudad - El nombre de la ciudad (ej. "Concepcion", "Concepcion,cl").
 * @param {string} unidades - 'metric' (Celsius), 'imperial' (Fahrenheit), 'standard' (Kelvin - por defecto).
 * @param {string} idioma - Código de idioma (ej. 'es' para español, 'en' para inglés).
 * @returns {Promise<object|null>} Una promesa que resuelve con los datos del clima en formato JSON, o null si ocurre un error.
 */
async function obtenerClima(ciudad, unidades = 'metric', idioma = 'es') {
    if (!ciudad || typeof ciudad !== 'string' || ciudad.trim() === '') {
         console.error("Error: Debes proporcionar un nombre de ciudad válido.");
         return null; 
    }

    const params = {
        q: ciudad,          
        appid: apiKey,      
        units: unidades,    
        lang: idioma       
    };

    try {
        console.log(`\nBuscando clima para: ${ciudad} (Unidades: ${unidades}, Idioma: ${idioma})...`);

        const respuesta = await axios.get(baseUrl, { params }); 

        console.log(`Petición exitosa (Estado: ${respuesta.status})`);
        return respuesta.data; 

    } catch (error) {
        console.error("Error al obtener los datos del clima:");

        if (error.response) {
            console.error(`  Código de Estado: ${error.response.status}`);
            console.error(`  Mensaje del servidor: ${error.response.data?.message || JSON.stringify(error.response.data)}`);
            if (error.response.status === 401) {
                 console.error("  -> Problema de Autenticación: Verifica que tu API Key (OPENWEATHER_API_KEY) sea correcta y esté activa.");
            } else if (error.response.status === 404) {
                 console.error(`  -> Ciudad No Encontrada: Verifica que el nombre de la ciudad '${ciudad}' sea correcto.`);
            }
        } else if (error.request) {
            console.error("  Error de Red: No se pudo conectar con el servidor de OpenWeatherMap.");
            console.error(`  Detalles: ${error.message}`);
        } else {
            console.error('  Error Inesperado:', error.message);
        }
        return null; 
    }
}


async function mostrarClimaEjemplo(nombreCiudad) {
    const datosClima = await obtenerClima(nombreCiudad, 'metric', 'es'); 

    if (datosClima) {
        console.log("\n--- Datos del Clima Actual ---");
        console.log(`Ciudad: ${datosClima.name}, ${datosClima.sys.country}`);
        console.log(`Descripción: ${datosClima.weather[0].description}`);
        console.log(`Temperatura: ${datosClima.main.temp}°C`);
        console.log(`Sensación Térmica: ${datosClima.main.feels_like}°C`);
        console.log(`Temperatura Mínima: ${datosClima.main.temp_min}°C`);
        console.log(`Temperatura Máxima: ${datosClima.main.temp_max}°C`);
        console.log(`Presión: ${datosClima.main.pressure} hPa`);
        console.log(`Humedad: ${datosClima.main.humidity}%`);
        console.log(`Visibilidad: ${datosClima.visibility} metros`);
        console.log(`Viento: ${datosClima.wind.speed} m/s (Dirección: ${datosClima.wind.deg}°)`);
        console.log(`Nubosidad: ${datosClima.clouds.all}%`);
        console.log("----------------------------\n");
    } else {
        console.log(`\nNo se pudieron obtener los datos del clima para ${nombreCiudad}.\n`);
    }
}


const ciudadDesdeArgs = process.argv[2]; 

if (ciudadDesdeArgs) {
    mostrarClimaEjemplo(ciudadDesdeArgs);
} else {
    console.log("Ejecutando con ciudades de ejemplo (Concepcion)...");
    mostrarClimaEjemplo('Concepcion, cl');
}

