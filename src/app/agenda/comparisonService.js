const PRECIPITATION_CODES = [
    200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
    300, 301, 302, 310, 311, 312, 313, 314, 321,
    500, 501, 502, 503, 504, 511, 520, 521, 522, 531,
    600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622,
    701, 711, 721, 731, 741, 751, 761, 762, 771, 781
];

/**
 * Compara las condiciones climáticas con las preferencias de una actividad.
 * @param {object} datosClima - Objeto de datos del clima de OpenWeatherMap para un momento específico
 *                              (puede ser de la API de clima actual o un item de la lista de pronóstico).
 *                              Debe tener: main.temp, wind.speed, weather[0].id
 * @param {object} preferencias - Objeto con las preferencias del usuario para la actividad.
 *                                Debe tener: min_temp, max_temp, max_wind_speed, requires_no_precipitation.
 *                                Los valores pueden ser null si no hay preferencia.
 * @returns {object} Un objeto indicando si el clima es adecuado y la razón si no lo es.
 *                   Ej: { adecuado: true } o { adecuado: false, razon: "Temperatura muy baja" }
 */
function compararClimaConPreferencias(datosClima, preferencias) {
    if (!datosClima || !datosClima.main || !datosClima.weather || !datosClima.wind) {
        return { adecuado: false, razon: "Datos del clima incompletos o no disponibles." };
    }
    if (!preferencias) {
        return { adecuado: true }; // Si no hay preferencias, cualquier clima es "adecuado"
    }

    const tempActual = datosClima.main.temp;
    const vientoActual = datosClima.wind.speed;
    const codigoClimaActual = datosClima.weather[0].id;

    // 1. Comprobar Temperatura
    if (preferencias.min_temp !== null && tempActual < preferencias.min_temp) {
        return { adecuado: false, razon: `Temperatura (${tempActual}°C) por debajo del mínimo (${preferencias.min_temp}°C)` };
    }
    if (preferencias.max_temp !== null && tempActual > preferencias.max_temp) {
        return { adecuado: false, razon: `Temperatura (${tempActual}°C) por encima del máximo (${preferencias.max_temp}°C)` };
    }

    // 2. Comprobar Viento
    if (preferencias.max_wind_speed !== null && vientoActual > preferencias.max_wind_speed) {
        return { adecuado: false, razon: `Velocidad del viento (${vientoActual} m/s) excede el máximo (${preferencias.max_wind_speed} m/s)` };
    }

    // 3. Comprobar Precipitación
    if (preferencias.requires_no_precipitation === true && PRECIPITATION_CODES.includes(codigoClimaActual)) {
         const descripcionClima = datosClima.weather[0].description || `código ${codigoClimaActual}`;
         return { adecuado: false, razon: `Se requiere sin precipitación, pero el pronóstico es: ${descripcionClima}` };
    }

    // Si pasa todas las comprobaciones
    return { adecuado: true };
}

module.exports = {
    compararClimaConPreferencias
};