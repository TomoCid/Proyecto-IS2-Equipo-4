import React, { useState, useEffect } from 'react';
import ActivityFormModal from 'src/components/Activity/ActivityFormModal'; 
import { ActivityWithPreferences } from 'src/app/types'; 

const MyActivitiesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUserId = 1; 
  const [activities, setActivities] = useState<ActivityWithPreferences[]>([]);
  const [activityToEdit, setActivityToEdit] = useState<ActivityWithPreferences | null>(null);

  const fetchActivities = async () => {
    const exampleActivities: ActivityWithPreferences[] = [
      {
        id: 101,
        user_id: null, // Actividad Estándar
        name: 'Correr al Aire Libre (Estándar)',
        description: 'Una carrera vigorizante por el parque.',
        icon_name: 'directions_run',
      },
      {
        id: 1,
        user_id: currentUserId,
        name: 'Mi Paseo en Bici',
        description: 'Ruta por la montaña los fines de semana.',
        icon_name: 'pedal_bike',
        preferences: {
          min_temp: 15,
          max_temp: 28,
          max_wind_speed: 20,
          requires_no_precipitation: true,
          is_active: true,
        }
      }
    ];
    setActivities(exampleActivities);
  };

  useEffect(() => {
    fetchActivities();
  }, [currentUserId]);


  const handleOpenCreateModal = () => {
    setActivityToEdit(null); 
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (activity: ActivityWithPreferences) => {
    setActivityToEdit(activity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActivityToEdit(null);
  };

  const handleSave = () => {
    console.log('Actividad guardada, refrescando lista...');
    fetchActivities();
  };

  return (
    <div>
      <h1>Mis Actividades y Estándar</h1>
      <button onClick={handleOpenCreateModal}>Crear Nueva Actividad</button>

      <h2>Actividades Disponibles</h2>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id || activity.name}> {/* Usar name como fallback si id es undefined (nueva no guardada) */}
            {activity.name} ({activity.user_id === null ? 'Estándar' : 'Mía'})
            <button onClick={() => handleOpenEditModal(activity)}>
              {activity.user_id === null ? 'Personalizar' : 'Editar'}
            </button>
          </li>
        ))}
      </ul>

      {isModalOpen && (
        <ActivityFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          userId={currentUserId}
          activityToEdit={activityToEdit}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default MyActivitiesPage;