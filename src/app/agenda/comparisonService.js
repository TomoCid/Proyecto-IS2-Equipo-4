// Ruta: src/app/agenda/comparisonService.js

/**
 * Compara las preferencias de una actividad con el pronóstico del tiempo de WeatherAPI.com.
 * @param {object} preferences - Objeto con las preferencias del usuario.
 * @param {object} weatherDay - Objeto del pronóstico del día de WeatherAPI.com (forecastForDay.day).
 * @returns {{isSuitable: boolean, reasons: string[]}} - Objeto indicando si es adecuado y las razones.
 */
export function checkWeatherSuitability(preferences, weatherDay) {
    if (!preferences || !weatherDay) {
        return { isSuitable: false, reasons: ["Faltan datos de preferencias o del clima."] };
    }

    const reasons = [];

    // 1. Comprobar Temperatura Máxima
    if (preferences.max_temp !== null && weatherDay.maxtemp_c > preferences.max_temp) {
        reasons.push(`La T° máxima pronosticada (${weatherDay.maxtemp_c}°C) supera tu preferencia (${preferences.max_temp}°C).`);
    }

    // 2. Comprobar Temperatura Mínima
    if (preferences.min_temp !== null && weatherDay.mintemp_c < preferences.min_temp) {
        reasons.push(`La T° mínima pronosticada (${weatherDay.mintemp_c}°C) es inferior a tu preferencia (${preferences.min_temp}°C).`);
    }

    // 3. Comprobar Viento
    if (preferences.max_wind_speed !== null && weatherDay.maxwind_kph > preferences.max_wind_speed) {
        reasons.push(`El viento pronosticado (${weatherDay.maxwind_kph} km/h) supera tu preferencia (${preferences.max_wind_speed} km/h).`);
    }

    // 4. Comprobar si se requiere que no llueva
    if (preferences.requires_no_precipitation === true && weatherDay.totalprecip_mm > 0) {
        reasons.push(`Se requiere sin lluvia, pero se pronostican ${weatherDay.totalprecip_mm} mm de precipitación.`);
    }

    // 5. Comprobar intensidad y probabilidad de lluvia si está permitido
    if (preferences.requires_no_precipitation === false) {
        if (preferences.max_precipitation_intensity !== null && weatherDay.totalprecip_mm > preferences.max_precipitation_intensity) {
            reasons.push(`La precipitación pronosticada (${weatherDay.totalprecip_mm} mm) supera tu preferencia (${preferences.max_precipitation_intensity} mm).`);
        }
        if (preferences.max_precipitation_probability !== null && weatherDay.daily_chance_of_rain > preferences.max_precipitation_probability) {
             reasons.push(`La probabilidad de lluvia (${weatherDay.daily_chance_of_rain}%) supera tu preferencia (${preferences.max_precipitation_probability}%).`);
        }
    }

    // 6. Comprobar Índice UV
    if (preferences.max_uv !== null && weatherDay.uv > preferences.max_uv) {
        reasons.push(`El índice UV pronosticado (${weatherDay.uv}) supera tu preferencia (${preferences.max_uv}).`);
    }

    return {
        isSuitable: reasons.length === 0,
        reasons: reasons
    };
}