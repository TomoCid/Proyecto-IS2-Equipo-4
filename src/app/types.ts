export interface Activity {
  id?: number; // BIGINT -> number
  user_id?: number | null; // BIGINT -> number, puede ser null para actividades estándar
  name: string;
  description?: string | null;
  icon_name?: string | null;
  created_at?: string; // TIMESTAMP WITH TIME ZONE -> string
}

export interface UserActivityPreferences {
  preferences_id?: number; // BIGINT -> number
  user_id: number; // BIGINT -> number
  activity_id: number; // BIGINT -> number (se asignará después de crear la actividad)
  min_temp?: number | null; // SMALLINT -> number
  max_temp?: number | null; // SMALLINT -> number
  max_wind_speed?: number | null; // SMALLINT -> number
  max_precipitation_probability?: number | null; // SMALLINT -> number
  max_precipitation_intensity?: number | null; // DECIMAL(4, 2) -> number
  requires_no_precipitation: boolean;
  max_uv?: number | null; // SMALLINT -> number
  is_active: boolean;
  created_at?: string; // TIMESTAMP WITH TIME ZONE -> string
  updated_at?: string; // TIMESTAMP WITH TIME ZONE -> string
}


export interface ActivityFormData extends Omit<Activity, 'id' | 'user_id' | 'created_at'> {
  name: string;
  description?: string | null;
  icon_name?: string | null;

  
  min_temp?: number | null;
  max_temp?: number | null;
  max_wind_speed?: number | null;
  max_precipitation_probability?: number | null;
  max_precipitation_intensity?: number | null;
  requires_no_precipitation: boolean;
  max_uv?: number | null;
  is_active: boolean; 
}

export interface ActivityWithPreferences extends Activity {
  preferences?: Omit<UserActivityPreferences, 'user_id' | 'activity_id' | 'preferences_id' | 'created_at' | 'updated_at'>;
}