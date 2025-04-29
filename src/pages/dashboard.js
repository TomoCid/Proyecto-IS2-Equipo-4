import { useState, useEffect } from 'react';
import { FaSmile, FaCog } from 'react-icons/fa';
import '../styles/dashboard.css';
import AjustesClima from './ajustes-clima.js';

const Dashboard = () => {
  const [user, setUser] = useState({});
  const [agenda, setAgenda] = useState([]);
  const [clima, setClima] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  useEffect(() => {
    const obtenerDatosDashboard = async () => {
      try {
        setLoading(true);

        const userData = {
          username: "Juan Pérez",
          email: "juan.perez@correo.com"
        };
        setUser(userData);

        const agendaData = [
          { id: 1, actividad_nombre: 'Correr al aire libre', fecha: '2025-04-25', hora_inicio: '08:00', hora_fin: '09:00' },
          { id: 2, actividad_nombre: 'Ir al gimnasio', fecha: '2025-04-25', hora_inicio: '10:00', hora_fin: '11:00' },
          { id: 3, actividad_nombre: 'Leer en el parque', fecha: '2025-04-25', hora_inicio: '12:00', hora_fin: '13:00' }
        ];
        setAgenda(agendaData);

        const savedWeather = localStorage.getItem("selectedWeather");
        const savedTemperature = localStorage.getItem("temperature");

        if (!savedWeather || !savedTemperature) {
          throw new Error("Faltan datos de clima. Por favor selecciona el clima primero.");
        }

        const numericTemperature = parseInt(savedTemperature.replace("°", ""), 10);
        const climaData = {
          name: "Tu localidad",
          main: { temp: numericTemperature },
          weather: [{ description: savedWeather }]
        };
        setClima(climaData);

        setError(null);
      } catch (err) {
        setError(err.message);
        setUser({});
        setAgenda([]);
        setClima({});
      } finally {
        setLoading(false);
      }
    };

    obtenerDatosDashboard();
  }, []);

  const getWeatherIcon = (description) => {
    switch (description) {
      case "Soleado": return "☀️";
      case "Parcialmente Nublado": return "⛅";
      case "Nublado": return "☁️";
      case "Neblina": return "🌫️";
      case "Lluvioso": return "🌧️";
      case "Tormenta": return "⛈️";
      case "Granizo": return "🌨️";
      case "Nieve": return "❄️";
      default: return "🌈";
    }
  };

  // Nueva función para verificar si la actividad es adecuada para el clima
  const isActivitySuitableForWeather = (activityName) => {
    const weatherDescription = clima.weather?.[0]?.description || '';

    if (activityName === 'Correr al aire libre') {
      return weatherDescription !== 'Lluvioso' && weatherDescription !== 'Tormenta' && weatherDescription !== 'Nieve';
    }

    if (activityName === 'Leer en el parque') {
      return weatherDescription === 'Soleado' || weatherDescription === 'Parcialmente Nublado';
    }

    return true;
  };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
    setShowSettingsMenu(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
  };

  const toggleSettingsMenu = () => {
    setShowSettingsMenu(prev => !prev);
  };

  const handleSaveWeather = (newWeatherDescription, newTemperature) => {
    const updatedClima = {
      ...clima,
      main: { temp: parseInt(newTemperature, 10) },
      weather: [{ description: newWeatherDescription }]
    };

    setClima(updatedClima);
    localStorage.setItem('selectedWeather', newWeatherDescription);
    localStorage.setItem('temperature', `${newTemperature}°`);

    closeModal();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <span className="text-2xl text-blue-600">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-100">
        <span className="text-2xl text-red-600">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Fondo que se difumina cuando el menú está abierto */}
      {showSettingsMenu && <div className="background-blur" />}

      <div className="dashboard-content">
        {/* Botón de Configuración */}
        <div className="absolute top-5 right-5">
          <div className="relative">
            <FaCog className="text-2xl cursor-pointer settings-icon" onClick={toggleSettingsMenu} />
            {showSettingsMenu && (
              <div className="menu-float">
                <button onClick={() => openModal('clima')}>Ajustes Clima</button>
                <button onClick={() => openModal('actividad')}>Ajustes Actividades</button>
              </div>
            )}
          </div>
        </div>

        {/* Bienvenida */}
        <div className="text-center p-6">
          <h2 className="dashboard-title">
            <FaSmile className="inline-block mr-2 text-2xl text-yellow-400" />
            Bienvenido, {user.username}!
          </h2>
          <p className="dashboard-welcome">{user.email}</p>
        </div>

        {/* Clima */}
        <div className="clima-container">
          <h2 className="clima-title">Clima en {clima.name}</h2>
          <div className="text-lg text-gray-700">
            <p className="clima-temp">{clima.main?.temp}°C</p>
            <p className="clima-description">
              <span className="weather-icon">{getWeatherIcon(clima.weather?.[0]?.description)}</span>
              {clima.weather?.[0]?.description}
            </p>
          </div>
        </div>

        {/* Agenda */}
        <div className="agenda-container">
          <h3 className="agenda-title">Actividades de tu Agenda</h3>
          <div className="space-y-6">
            {agenda.length > 0 ? (
              agenda.map((actividad) => (
                <div key={actividad.id} className="agenda-item">
                  <div className="agenda-item-title">{actividad.actividad_nombre}</div>
                  <div className="agenda-item-time">
                    {actividad.fecha} {actividad.hora_inicio} - {actividad.hora_fin}
                  </div>
                  {/* Verificación de si la actividad es adecuada para el clima */}
                  <p className={`activity-suitability ${isActivitySuitableForWeather(actividad.actividad_nombre) ? 'text-green-600' : 'text-red-600'}`}>
                    {isActivitySuitableForWeather(actividad.actividad_nombre)
                      ? '¡Puedes realizar esta actividad con el clima actual!'
                      : 'No se recomienda realizar esta actividad debido al clima.'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No tienes actividades en tu agenda.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            {modalType === 'clima' ? (
              <AjustesClima
                climaActual={clima}
                onClose={closeModal}
                onSave={handleSaveWeather}
              />
            ) : (
              <div>
                <h3>Editar Actividad</h3>
                <div className="form-group">
                  <input type="text" placeholder="Nombre de la actividad" />
                  <input type="datetime-local" />
                </div>
                <button className="save-button" onClick={closeModal}>Guardar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
