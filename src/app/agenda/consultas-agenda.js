// Ruta: src/app/agenda/consultas-agenda.js

import getPool from '../../pages/api/activities/db.js';
// *** CORRECCIÓN FINAL: Ahora la importación es correcta porque el otro archivo fue corregido ***
import { checkWeatherSuitability } from './comparisonService.js';
import weatherService from '../weather/weatherService.js';

const { obtenerClimaCompleto } = weatherService;

/**
 * 1. Crear nueva entrada en agenda
 */
export async function createAgendaEntry(entryData) {
  const pool = getPool();
  const {
    userId, activityId, periodicidad = 0, fecha, horaInicio, horaFin, notes = null,
    latitude = null, longitude = null, reminderEnabled = false, reminderOffsetMinutes = null,
    minTemp = null, maxTemp = null, maxWindSpeed = null, maxPrecipitationProbability = null,
    maxPrecipitationIntensity = null, requiresNoPrecipitation = false, maxUv = null,
  } = entryData;

  const query = `
    INSERT INTO "Agenda" (
      "user_id", "activity_id", "periodicidad", "fecha", "hora_inicio", "hora_fin", "notes",
      "location_latitude", "location_longitude", "reminder_enabled", "reminder_offset_minutes",
      "min_temp", "max_temp", "max_wind_speed", "max_precipitation_probability",
      "max_precipitation_intensity", "requires_no_precipitation", "max_uv"
    ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18 )
    RETURNING *;
  `;
  const values = [
    userId, activityId, periodicidad, fecha, horaInicio, horaFin, notes, latitude, longitude,
    reminderEnabled, reminderOffsetMinutes, minTemp, maxTemp, maxWindSpeed,
    maxPrecipitationProbability, maxPrecipitationIntensity, requiresNoPrecipitation, maxUv,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error en createAgendaEntry:", error);
    throw error;
  }
}

/**
 * 2. Obtener agenda completa de un usuario
 */
export async function getUserAgenda(userId) {
  const pool = getPool();
  const query = `
    SELECT
        a.id AS agenda_id, a.user_id, a.activity_id, a.periodicidad, a.fecha,
        a.hora_inicio, a.hora_fin, act.name AS actividad_nombre,
        act.description AS actividad_descripcion, act.icon_name AS actividad_icono,
        a.notes, a.location_latitude, a.location_longitude, a.reminder_enabled,
        a.reminder_offset_minutes, a.created_at, a.updated_at
    FROM "Agenda" a
    JOIN "activities" act ON a.activity_id = act.id
    WHERE a.user_id = $1
    ORDER BY a.fecha, a.hora_inicio;
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch(error) {
    console.error("Error en getUserAgenda:", error);
    throw error;
  }
}

/**
 * 3. Actualizar una entrada de agenda
 */
export async function updateAgendaEntry(agendaId, userId, updateData) {
  const pool = getPool();
  const setClauses = [];
  const values = [];
  let valueIndex = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    let columnName;
    switch (key) {
      case 'activityId': columnName = 'activity_id'; break;
      case 'periodicidad': columnName = 'periodicidad'; break;
      case 'fecha': columnName = 'fecha'; break;
      case 'horaInicio': columnName = 'hora_inicio'; break;
      case 'horaFin': columnName = 'hora_fin'; break;
      case 'notes': columnName = 'notes'; break;
      case 'latitude': columnName = 'location_latitude'; break;
      case 'longitude': columnName = 'location_longitude'; break;
      case 'reminderEnabled': columnName = 'reminder_enabled'; break;
      case 'reminderOffsetMinutes': columnName = 'reminder_offset_minutes'; break;
      default: return; 
    }
    setClauses.push(`"${columnName}" = $${valueIndex++}`);
    values.push(value);
  });

  if (setClauses.length === 0) {
    throw new Error('No fields provided for update.');
  }

  setClauses.push(`"updated_at" = CURRENT_TIMESTAMP`);
  values.push(agendaId, userId);
  const agendaIdIndex = valueIndex++;
  const userIdIndex = valueIndex;

  const query = `
    UPDATE "Agenda" SET ${setClauses.join(', ')}
    WHERE id = $${agendaIdIndex} AND user_id = $${userIdIndex}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Agenda entry not found or user does not have permission to update.');
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error en updateAgendaEntry:", error);
    throw error;
  }
}

/**
 * 4. Eliminar entrada de agenda
 */
export async function deleteAgendaEntry(agendaId, userId) {
  const pool = getPool();
  const query = `DELETE FROM "Agenda" WHERE id = $1 AND user_id = $2 RETURNING id;`;
  try {
    const result = await pool.query(query, [agendaId, userId]);
    return result.rowCount > 0; 
  } catch (error) {
    console.error("Error en deleteAgendaEntry:", error);
    throw error;
  }
}

/**
 * 5. Obtener actividades disponibles (activas) para un usuario con sus preferencias
 */
export async function getActiveUserActivitiesWithPrefs(userId) {
  const pool = getPool();
  const query = `
    SELECT
        act.id, act.name, act.description, act.icon_name, pref.min_temp, pref.max_temp,
        pref.max_wind_speed, pref.max_precipitation_probability, pref.max_precipitation_intensity,
        pref.requires_no_precipitation, pref.max_uv, pref.is_active
    FROM "user_activity_preferences" pref
    JOIN "activities" act ON pref.activity_id = act.id
    WHERE pref.user_id = $1 AND pref.is_active = true;
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id, name: row.name, description: row.description, icon_name: row.icon_name,
      preferences: {
        min_temp: row.min_temp, max_temp: row.max_temp, max_wind_speed: row.max_wind_speed,
        max_precipitation_probability: row.max_precipitation_probability, max_precipitation_intensity: row.max_precipitation_intensity,
        requires_no_precipitation: row.requires_no_precipitation, max_uv: row.max_uv, is_active: row.is_active
      }
    }));
  } catch (error) {
    console.error("Error en getActiveUserActivitiesWithPrefs:", error);
    throw error;
  }
}

/**
 * 6. Buscar conflictos de horario para una nueva entrada potencial
 */
export async function findScheduleConflicts(userId, fecha, newStartTime, newEndTime, excludeAgendaId = null) {
  const pool = getPool();
  let query = `
    SELECT * FROM "Agenda"
    WHERE user_id = $1 AND fecha = $2 AND hora_inicio < $4 AND hora_fin > $3
  `;
  const values = [userId, fecha, newStartTime, newEndTime];

  if (excludeAgendaId !== null) {
    query += ` AND id != $5`;
    values.push(excludeAgendaId);
  }
  query += `;`;

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error en findScheduleConflicts:", error);
    throw error;
  }
}

/**
 * 7. Obtener agenda con preferencias meteorológicas asociadas
 */
export async function getUserAgendaWithWeatherPrefs(userId) {
  const pool = getPool();
  const query = `
    SELECT a.*, pref.min_temp, pref.max_temp, pref.max_wind_speed, pref.requires_no_precipitation
    FROM "Agenda" a
    LEFT JOIN "user_activity_preferences" pref ON a.user_id = pref.user_id AND a.activity_id = pref.activity_id
    WHERE a.user_id = $1
    ORDER BY a.fecha, a.hora_inicio;
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error("Error en getUserAgendaWithWeatherPrefs:", error);
    throw error;
  }
}

/**
 * 8. Obtener entradas de agenda recurrentes
 */
export async function getRecurringAgendaEntries(userId) {
  const pool = getPool();
  const query = `
    SELECT * FROM "Agenda"
    WHERE user_id = $1 AND periodicidad IS NOT NULL AND periodicidad > 0
    ORDER BY fecha, hora_inicio;
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch(error) {
    console.error("Error en getRecurringAgendaEntries:", error);
    throw error;
  }
}

/**
 * 9. Obtener recordatorios pendientes para hoy
 */
export async function getPendingReminders(userId) {
  const pool = getPool();
  const query = `
    SELECT * FROM "Agenda"
    WHERE user_id = $1 AND reminder_enabled = true AND fecha = CURRENT_DATE
    AND (hora_inicio - (COALESCE(reminder_offset_minutes, 0) || ' minutes')::INTERVAL) <= CURRENT_TIME
    ORDER BY hora_inicio;
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch(error) {
    console.error("Error en getPendingReminders:", error);
    throw error;
  }
}

/**
 * 10. Actualizar solo las coordenadas de ubicación de una entrada de agenda
 */
export async function updateAgendaLocation(agendaId, userId, latitude, longitude) {
  const pool = getPool();
  const query = `
    UPDATE "Agenda" SET location_latitude = $1, location_longitude = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND user_id = $4
    RETURNING *;
  `;
  const values = [latitude, longitude, agendaId, userId];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Agenda entry not found or user does not have permission to update.');
    }
    return result.rows[0];
  } catch(error) {
    console.error("Error en updateAgendaLocation:", error);
    throw error;
  }
}

/**
 * 11. Obtener recomendaciones de actividades para un día específico
 */
export async function getDailyRecommendations(userId, date, lat, lon) {
  console.log(`\n\n[DEBUG] Iniciando getDailyRecommendations para User: ${userId}, Fecha: ${date}`);
  try {
    const userActivities = await getActiveUserActivitiesWithPrefs(userId);
    console.log(`[DEBUG] 1. Actividades activas del usuario encontradas: ${userActivities.length}`);
    if (!userActivities || userActivities.length === 0) {
      return [];
    }

    const weatherForecast = await obtenerClimaCompleto(`${lat},${lon}`);
    if (!weatherForecast) {
      console.log(`[DEBUG] No se pudo obtener el pronóstico del clima.`);
      return [];
    }
    
    const forecastForDay = weatherForecast.forecast.forecastday.find(day => day.date === date);

    if (!forecastForDay) {
      console.log(`[DEBUG] No se encontró pronóstico para la fecha ${date}.`);
      return [];
    }
    console.log(`[DEBUG] 2. Pronóstico para ${date}:`, {
        max_temp: forecastForDay.day.maxtemp_c, min_temp: forecastForDay.day.mintemp_c,
        max_wind: forecastForDay.day.maxwind_kph, precip_mm: forecastForDay.day.totalprecip_mm,
        uv: forecastForDay.day.uv,
    });

    const suitableActivities = [];
    for (const activity of userActivities) {
      console.log(`\n[DEBUG] --- Evaluando actividad: "${activity.name}" (ID: ${activity.id}) ---`);
      if (!activity.preferences) {
        console.log(`[DEBUG] -> OMITIDA: La actividad no tiene preferencias guardadas.`);
        continue;
      }
      console.log(`[DEBUG] -> Preferencias de la actividad:`, activity.preferences);
      
      // La llamada ahora es correcta
      const suitability = checkWeatherSuitability(activity.preferences, forecastForDay.day);
      console.log(`[DEBUG] -> Resultado de la comparación:`, suitability);

      if (suitability.isSuitable) {
        console.log(`[DEBUG] -> VEREDICTO: ¡RECOMENDADA!`);
        suitableActivities.push({
          ...activity,
          weather_summary: suitability.reasons.join(', ') || 'Clima ideal.'
        });
      } else {
        console.log(`[DEBUG] -> VEREDICTO: NO RECOMENDADA por las razones anteriores.`);
      }
    }
    
    console.log(`[DEBUG] 4. Proceso finalizado. Total de actividades recomendadas: ${suitableActivities.length}`);
    return suitableActivities;

  } catch (error) {
    console.error("[DEBUG] Error CRÍTICO en getDailyRecommendations:", error);
    throw error;
  }
}