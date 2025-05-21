import React, { useState, useEffect, FormEvent } from 'react';
import { ActivityFormData, ActivityWithPreferences } from 'src/app/types'; 

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number; 
  activityToEdit?: ActivityWithPreferences | null; 
  onSave: () => void; 
}

const initialFormData: ActivityFormData = {
  name: '',
  description: '',
  icon_name: '',
  min_temp: null,
  max_temp: null,
  max_wind_speed: null,
  max_precipitation_probability: null,
  max_precipitation_intensity: null,
  requires_no_precipitation: false,
  max_uv: null,
  is_active: true,
};

const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  userId,
  activityToEdit,
  onSave,
}) => {
  const [formData, setFormData] = useState<ActivityFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditingUserActivity = activityToEdit && activityToEdit.user_id === userId;
  const isModifyingStandardActivity = activityToEdit && activityToEdit.user_id === null;
  const isCreatingNew = !activityToEdit;

  useEffect(() => {
    if (activityToEdit) {
      setFormData({
        name: activityToEdit.name || '',
        description: activityToEdit.description || '',
        icon_name: activityToEdit.icon_name || '',
        min_temp: activityToEdit.preferences?.min_temp ?? null,
        max_temp: activityToEdit.preferences?.max_temp ?? null,
        max_wind_speed: activityToEdit.preferences?.max_wind_speed ?? null,
        max_precipitation_probability: activityToEdit.preferences?.max_precipitation_probability ?? null,
        max_precipitation_intensity: activityToEdit.preferences?.max_precipitation_intensity ?? null,
        requires_no_precipitation: activityToEdit.preferences?.requires_no_precipitation ?? false,
        max_uv: activityToEdit.preferences?.max_uv ?? null,
        is_active: activityToEdit.preferences?.is_active ?? true,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [activityToEdit, isOpen]); 

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    }
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.name.trim()) {
      setError("El nombre de la actividad es obligatorio.");
      setIsLoading(false);
      return;
    }
    if (
      formData.min_temp != null && 
      formData.max_temp != null && 
      formData.min_temp > formData.max_temp 
    ) {
        setError("La temperatura mínima no puede ser mayor que la máxima.");
        setIsLoading(false);
        return;
    }


    const payload = {
      ...formData,
      user_id: userId, 
    };

    try {
      let response;
      if (isEditingUserActivity && activityToEdit?.id) {
        // Actualizar actividad existente del usuario
        response = await fetch(`/api/activities/${activityToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const createPayload = {
            activity: {
                name: payload.name,
                description: payload.description,
                icon_name: payload.icon_name,
                user_id: userId,
            },
            preferences: {
                user_id: userId, 
                min_temp: payload.min_temp,
                max_temp: payload.max_temp,
                max_wind_speed: payload.max_wind_speed,
                max_precipitation_probability: payload.max_precipitation_probability,
                max_precipitation_intensity: payload.max_precipitation_intensity,
                requires_no_precipitation: payload.requires_no_precipitation,
                max_uv: payload.max_uv,
                is_active: payload.is_active,
            }
        };

        response = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la actividad');
      }

      onSave(); 
      onClose(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  let title = "Crear Nueva Actividad";
  if (isEditingUserActivity) title = "Editar Mi Actividad";
  if (isModifyingStandardActivity) title = `Personalizar Actividad Estándar: ${activityToEdit?.name}`;


  return (
    <div className="modal-backdrop"> {/* Estilo para el fondo oscuro */}
      <div className="modal-content"> {/* Estilo para el contenido del modal */}
        <h2>{title}</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>Detalles de la Actividad</legend>
            <div>
              <label htmlFor="name">Nombre*:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="description">Descripción:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="icon_name">Nombre del Icono:</label>
              <input
                type="text"
                id="icon_name"
                name="icon_name"
                value={formData.icon_name || ''}
                onChange={handleChange}
                maxLength={50}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Preferencias Climáticas</legend>
            <div>
              <label htmlFor="min_temp">Temperatura Mínima (°C):</label>
              <input
                type="number"
                id="min_temp"
                name="min_temp"
                value={formData.min_temp ?? ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="max_temp">Temperatura Máxima (°C):</label>
              <input
                type="number"
                id="max_temp"
                name="max_temp"
                value={formData.max_temp ?? ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="max_wind_speed">Velocidad Máx. Viento (km/h):</label>
              <input
                type="number"
                id="max_wind_speed"
                name="max_wind_speed"
                value={formData.max_wind_speed ?? ''}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="max_precipitation_probability">Prob. Máx. Precipitación (%):</label>
              <input
                type="number"
                id="max_precipitation_probability"
                name="max_precipitation_probability"
                value={formData.max_precipitation_probability ?? ''}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label htmlFor="max_precipitation_intensity">Intensidad Máx. Precipitación (mm/hr):</label>
              <input
                type="number"
                id="max_precipitation_intensity"
                name="max_precipitation_intensity"
                value={formData.max_precipitation_intensity ?? ''}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="requires_no_precipitation">
                <input
                  type="checkbox"
                  id="requires_no_precipitation"
                  name="requires_no_precipitation"
                  checked={formData.requires_no_precipitation}
                  onChange={handleChange}
                />
                Requiere Sin Precipitación
              </label>
            </div>
            <div>
              <label htmlFor="max_uv">Índice UV Máximo:</label>
              <input
                type="number"
                id="max_uv"
                name="max_uv"
                value={formData.max_uv ?? ''}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="is_active">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                Activa (para recomendaciones)
              </label>
            </div>
          </fieldset>

          <div className="modal-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          color: black;
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-content h2 {
          margin-top: 0;
        }
        .modal-content form div {
          margin-bottom: 15px;
        }
        .modal-content form label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .modal-content form input[type="text"],
        .modal-content form input[type="number"],
        .modal-content form textarea,
        .modal-content form select {
          width: calc(100% - 16px); /* Adjust for padding */
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .modal-content form input[type="checkbox"] {
          margin-right: 5px;
          width: auto;
        }
        .modal-content form fieldset {
          border: 1px solid #ddd;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .modal-content form legend {
          font-weight: bold;
          padding: 0 5px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        .modal-actions button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .modal-actions button[type="submit"] {
          background-color: #007bff;
          color: white;
        }
        .modal-actions button[type="button"] {
          background-color: #6c757d;
          color: white;
        }
        .error-message {
          color: red;
          background-color: #ffebee;
          border: 1px solid red;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};

export default ActivityFormModal;