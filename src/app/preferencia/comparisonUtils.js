// src/app/preferencia/comparisonUtils.js (o donde lo tengas)

export function checkWeatherSuitability(forecastHour, preferences) {
  const reasons = [];
  let isSuitable = true;

  if (!forecastHour) {
    return { isSuitable: false, reasons: ["No hay pronóstico del tiempo disponible para la hora de la actividad."] };
  }

  // Temperatura
  if (preferences.min_temp !== null && forecastHour.temp_c < preferences.min_temp) {
    isSuitable = false;
    reasons.push(`La temperatura (${forecastHour.temp_c}°C) está por debajo del mínimo preferido (${preferences.min_temp}°C).`);
  }
  if (preferences.max_temp !== null && forecastHour.temp_c > preferences.max_temp) {
    isSuitable = false;
    reasons.push(`La temperatura (${forecastHour.temp_c}°C) está por encima del máximo preferido (${preferences.max_temp}°C).`);
  }

  // Viento
  if (preferences.max_wind_speed !== null && forecastHour.wind_kph > preferences.max_wind_speed) {
    isSuitable = false;
    reasons.push(`La velocidad del viento (${forecastHour.wind_kph} km/h) excede el máximo preferido (${preferences.max_wind_speed} km/h).`);
  }

  // Precipitación
  // WeatherAPI: chance_of_rain (probabilidad), precip_mm (cantidad)
  const willItRain = forecastHour.chance_of_rain > (preferences.max_precipitation_probability || 0);
  const actualPrecipMM = forecastHour.precip_mm || 0;

  if (preferences.requires_no_precipitation && (willItRain || actualPrecipMM > 0)) {
    isSuitable = false;
    let precipReason = "La actividad requiere que no haya precipitación.";
    if (willItRain && actualPrecipMM === 0) precipReason += ` (Probabilidad de lluvia: ${forecastHour.chance_of_rain}%)`;
    else if (actualPrecipMM > 0) precipReason += ` (Esperada: ${actualPrecipMM}mm)`;
    reasons.push(precipReason);
  } else {
    if (preferences.max_precipitation_probability !== null && forecastHour.chance_of_rain > preferences.max_precipitation_probability) {
      isSuitable = false;
      reasons.push(`La probabilidad de lluvia (${forecastHour.chance_of_rain}%) excede el máximo preferido (${preferences.max_precipitation_probability}%).`);
    }
    if (preferences.max_precipitation_intensity !== null && actualPrecipMM > preferences.max_precipitation_intensity) {
      isSuitable = false;
      reasons.push(`La intensidad de la precipitación (${actualPrecipMM}mm) excede el máximo preferido (${preferences.max_precipitation_intensity}mm).`);
    }
  }
  
  // Índice UV
  if (preferences.max_uv !== null && forecastHour.uv > preferences.max_uv) {
    isSuitable = false;
    reasons.push(`El índice UV (${forecastHour.uv}) excede el máximo preferido (${preferences.max_uv}).`);
  }

  if (isSuitable && reasons.length === 0) {
    reasons.push("Las condiciones climáticas son adecuadas para esta actividad.");
  } else if (!isSuitable && reasons.length === 0) {
    // Esto no debería ocurrir si la lógica es correcta, pero como fallback
    reasons.push("Las condiciones climáticas no son adecuadas por razones no especificadas.");
  }

  return { isSuitable, reasons };
}

// findClosestHourlyForecast no genera mensajes para el usuario, así que no necesita traducción.
export function findClosestHourlyForecast(activityDateTime, weatherApiForecastDays) {
  if (!weatherApiForecastDays || weatherApiForecastDays.length === 0) return null;

  const activityDateStr = activityDateTime.toISOString().split('T')[0]; 
  const activityHour = activityDateTime.getHours(); 

  const targetDayForecast = weatherApiForecastDays.find(day => day.date === activityDateStr);
  if (!targetDayForecast || !targetDayForecast.hour) return null;

  const targetHourForecast = targetDayForecast.hour.find(h => {
    const forecastHourEpoch = new Date(h.time_epoch * 1000).getHours();
    return forecastHourEpoch === activityHour;
  });
  
  if (targetHourForecast) return targetHourForecast;

  let closestHour = null;
  let minDiff = Infinity;

  targetDayForecast.hour.forEach(h => {
    const forecastHourTime = new Date(h.time_epoch * 1000);
    const diff = Math.abs(forecastHourTime.getTime() - activityDateTime.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestHour = h;
    }
  });

  // Solo aceptar si está razonablemente cerca (ej. dentro de 2 horas)
  if (closestHour && minDiff <= 2 * 60 * 60 * 1000) {
     return closestHour;
  }

  return null;
}