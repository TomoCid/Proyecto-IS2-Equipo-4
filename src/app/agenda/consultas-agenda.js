import pg from 'pg';


const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});


/**
 * 1. Crear nueva entrada en agenda
 * @param {object} entryData - Datos de la nueva entrada.
 * @param {number} entryData.userId - ID del usuario.
 * @param {number} entryData.activityId - ID de la actividad.
 * @param {number} [entryData.periodicidad=0] - Periodicidad en días.
 * @param {string} entryData.fecha - Fecha (YYYY-MM-DD).
 * @param {string} entryData.horaInicio - Hora de inicio (HH:MM:SS).
 * @param {string} entryData.horaFin - Hora de fin (HH:MM:SS).
 * @param {string|null} entryData.notes - Notas.
 * @param {number|null} entryData.latitude - Latitud.
 * @param {number|null} entryData.longitude - Longitud.
 * @param {boolean} [entryData.reminderEnabled=false] - Recordatorio activado.
 * @param {number|null} entryData.reminderOffsetMinutes - Minutos de antelación del recordatorio.
 * @param {number|null} entryData.minTemp
 * @param {number|null} entryData.maxTemp
 * @param {number|null} entryData.maxWindSpeed
 * @param {number|null} entryData.maxPrecipitationProbability
 * @param {number|null} entryData.maxPrecipitationIntensity
 * @param {boolean} [entryData.requiresNoPrecipitation=false]
 * @param {number|null} entryData.maxUv
 * @returns {Promise<object>} La entrada de agenda creada.
 */
export async function createAgendaEntry(entryData) {
  const {
    userId,
    activityId,
    periodicidad = 0,
    fecha,
    horaInicio,
    horaFin,
    notes = null,
    latitude = null,
    longitude = null,
    reminderEnabled = false,
    reminderOffsetMinutes = null,
    minTemp = null,
    maxTemp = null,
    maxWindSpeed = null,
    maxPrecipitationProbability = null,
    maxPrecipitationIntensity = null,
    requiresNoPrecipitation = false,
    maxUv = null,
  } = entryData;

  const query = `
    INSERT INTO "Agenda" (
      "user_id", "activity_id", "periodicidad", "fecha", "hora_inicio", "hora_fin", "notes",
      "location_latitude", "location_longitude",
      "reminder_enabled", "reminder_offset_minutes",
      "min_temp", "max_temp", "max_wind_speed", "max_precipitation_probability",
      "max_precipitation_intensity", "requires_no_precipitation", "max_uv"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9,
      $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18
    ) RETURNING *;
  `;
  const values = [
    userId,
    activityId,
    periodicidad,
    fecha,
    horaInicio,
    horaFin,
    notes,
    latitude,
    longitude,
    reminderEnabled,
    reminderOffsetMinutes,
    minTemp,
    maxTemp,
    maxWindSpeed,
    maxPrecipitationProbability,
    maxPrecipitationIntensity,
    requiresNoPrecipitation,
    maxUv,
  ];

  const client = await pool.connect();
  try {
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Failed to create agenda entry.');
    }
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * 2. Obtener agenda completa de un usuario con detalles de actividad
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<object>>} Lista de entradas de agenda con detalles de actividad.
 */
export async function getUserAgenda(userId) {
  const query = `
    SELECT
        a.id AS agenda_id,
        a.user_id,
        a.activity_id,
        a.periodicidad,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        act.name AS actividad_nombre, -- Renombrado para claridad
        act.description AS actividad_descripcion, -- Añadido si es útil
        act.icon_name AS actividad_icono, -- Añadido si es útil
        a.notes,
        a.location_latitude,
        a.location_longitude,
        a.reminder_enabled,
        a.reminder_offset_minutes,
        a.created_at,
        a.updated_at
    FROM "Agenda" a
    JOIN "activities" act ON a.activity_id = act.id
    WHERE a.user_id = $1
    ORDER BY a.fecha, a.hora_inicio;
  `;
  const client = await pool.connect();
  try {
    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 3. Actualizar una entrada de agenda
 * @param {number} agendaId - ID de la entrada de agenda a actualizar.
 * @param {number} userId - ID del usuario propietario (para verificación).
 * @param {object} updateData - Campos a actualizar.
 * @param {number} [updateData.activityId] - Nuevo ID de actividad.
 * @param {number|null} [updateData.periodicidad] - Nueva periodicidad.
 * @param {string} [updateData.fecha] - Nueva fecha.
 * @param {string} [updateData.horaInicio] - Nueva hora de inicio.
 * @param {string} [updateData.horaFin] - Nueva hora de fin.
 * @param {string|null} [updateData.notes] - Nuevas notas.
 * @param {number|null} [updateData.latitude] - Nueva latitud.
 * @param {number|null} [updateData.longitude] - Nueva longitud.
 * @param {boolean} [updateData.reminderEnabled] - Nuevo estado de recordatorio.
 * @param {number|null} [updateData.reminderOffsetMinutes] - Nuevo offset de recordatorio.
 * @returns {Promise<object>} La entrada de agenda actualizada.
 */
export async function updateAgendaEntry(agendaId, userId, updateData) {
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

  values.push(agendaId);
  const agendaIdIndex = valueIndex++;
  values.push(userId);
  const userIdIndex = valueIndex++;


  const query = `
    UPDATE "Agenda"
    SET ${setClauses.join(', ')}
    WHERE id = $${agendaIdIndex} AND user_id = $${userIdIndex}
    RETURNING *;
  `;

  const client = await pool.connect();
  try {
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Agenda entry not found or user does not have permission to update.');
    }
    return result.rows[0];
  } finally {
    client.release();
  }
}


/**
 * 4. Eliminar entrada de agenda
 * @param {number} agendaId - ID de la entrada de agenda a eliminar.
 * @param {number} userId - ID del usuario propietario (para verificación).
 * @returns {Promise<boolean>} True si se eliminó, false si no se encontró o no tenía permiso.
 */
export async function deleteAgendaEntry(agendaId, userId) {
  const query = `
    DELETE FROM "Agenda"
    WHERE id = $1 AND user_id = $2
    RETURNING id; -- Para verificar si se eliminó algo
  `;
  const client = await pool.connect();
  try {
    const result = await client.query(query, [agendaId, userId]);
    return result.rowCount > 0; 
  } finally {
    client.release();
  }
}

/**
 * 5. Obtener actividades disponibles (activas) para un usuario con sus preferencias
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<object>>} Lista de actividades activas y sus preferencias.
 */
export async function getActiveUserActivitiesWithPrefs(userId) {
  const query = `
    SELECT
        act.id,
        act.name,
        act.description,
        act.icon_name,
        pref.min_temp,
        pref.max_temp,
        pref.max_wind_speed, -- Asumiendo que existe en preferencias
        pref.requires_no_precipitation, -- Asumiendo que existe
        pref.is_active -- Confirmando que is_active viene de la tabla pref
    FROM "user_activity_preferences" pref
    JOIN "activities" act ON pref.activity_id = act.id
    WHERE pref.user_id = $1
    AND pref.is_active = true;
 `;
  const client = await pool.connect();
  try {
    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 6. Buscar conflictos de horario para una nueva entrada potencial
 * @param {number} userId - ID del usuario.
 * @param {string} fecha - Fecha de la nueva entrada (YYYY-MM-DD).
 * @param {string} newStartTime - Hora de inicio de la nueva entrada (HH:MM:SS).
 * @param {string} newEndTime - Hora de fin de la nueva entrada (HH:MM:SS).
 * @param {number|null} excludeAgendaId - Opcional: ID de una entrada existente a excluir ( útil si se está actualizando).
 * @returns {Promise<Array<object>>} Lista de entradas de agenda existentes que entran en conflicto.
 */
export async function findScheduleConflicts(userId, fecha, newStartTime, newEndTime, excludeAgendaId = null) {
  let query = `
    SELECT *
    FROM "Agenda"
    WHERE user_id = $1
    AND fecha = $2
    AND hora_inicio < $4 -- La existente empieza antes de que la nueva termine
    AND hora_fin > $3    -- La existente termina después de que la nueva empiece
  `;
  const values = [userId, fecha, newStartTime, newEndTime];

  if (excludeAgendaId !== null) {
    query += ` AND id != $5`;
    values.push(excludeAgendaId);
  }
  query += `;`


  const client = await pool.connect();
  try {
    const result = await client.query(query, values);
    return result.rows; // Devuelve las filas que solapan
  } finally {
    client.release();
  }
}


/**
 * 7. Obtener agenda con preferencias meteorológicas asociadas
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<object>>} Lista de entradas de agenda con sus preferencias meteorológicas.
 */
export async function getUserAgendaWithWeatherPrefs(userId) {
  const query = `
    SELECT
        a.*, -- Todos los campos de Agenda
        pref.min_temp,
        pref.max_temp,
        pref.max_wind_speed,
        pref.requires_no_precipitation
    FROM "Agenda" a
    LEFT JOIN "user_activity_preferences" pref -- Usar LEFT JOIN por si alguna actividad no tiene prefs definidas
        ON a.user_id = pref.user_id
        AND a.activity_id = pref.activity_id
    WHERE a.user_id = $1
    ORDER BY a.fecha, a.hora_inicio;
  `;
  const client = await pool.connect();
  try {
    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 8. Obtener entradas de agenda recurrentes (periodicidad > 0)
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<object>>} Lista de entradas de agenda recurrentes.
 */
export async function getRecurringAgendaEntries(userId) {
  // Esta consulta obtiene las entradas base que son recurrentes.
  // La lógica para calcular las fechas futuras específicas basadas en 'periodicidad'
  // generalmente se realiza en la capa de aplicación.
  const query = `
    SELECT *
    FROM "Agenda"
    WHERE user_id = $1
    AND periodicidad IS NOT NULL AND periodicidad > 0
    ORDER BY fecha, hora_inicio;
  `;
  const client = await pool.connect();
  try {
    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 9. Obtener recordatorios pendientes para hoy
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<object>>} Lista de entradas de agenda con recordatorios pendientes para hoy.
 */
export async function getPendingReminders(userId) {
  // Nota: Esta consulta depende de que la hora del servidor de BD esté sincronizada.
  // Compara la hora de inicio menos el offset con la hora actual del día actual.
  const query = `
    SELECT *
    FROM "Agenda"
    WHERE user_id = $1
    AND reminder_enabled = true
    AND fecha = CURRENT_DATE -- Solo para el día de hoy
    AND (hora_inicio - (COALESCE(reminder_offset_minutes, 0) || ' minutes')::INTERVAL) <= CURRENT_TIME -- La hora del recordatorio ya pasó o es ahora
    -- Opcional: podrías añadir una condición para no mostrar recordatorios demasiado viejos del mismo día
    -- AND (hora_inicio - (COALESCE(reminder_offset_minutes, 0) || ' minutes')::INTERVAL) >= (CURRENT_TIME - '1 hour'::INTERVAL) -- Ejemplo: solo de la última hora
    ORDER BY hora_inicio;
 `;
  const client = await pool.connect();
  try {
    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 10. Actualizar solo las coordenadas de ubicación de una entrada de agenda
 * @param {number} agendaId - ID de la entrada de agenda.
 * @param {number} userId - ID del usuario propietario (para verificación).
 * @param {number} latitude - Nueva latitud.
 * @param {number} longitude - Nueva longitud.
 * @returns {Promise<object>} La entrada de agenda actualizada.
 */
export async function updateAgendaLocation(agendaId, userId, latitude, longitude) {
  const query = `
    UPDATE "Agenda"
    SET
        location_latitude = $1,
        location_longitude = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND user_id = $4
    RETURNING *;
  `;
  const values = [latitude, longitude, agendaId, userId];

  const client = await pool.connect();
  try {
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Agenda entry not found or user does not have permission to update.');
    }
    return result.rows[0];
  } finally {
    client.release();
  }
}

