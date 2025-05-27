import { useState, useEffect } from 'react';
import { FaSmile, FaCog } from 'react-icons/fa';
import '../styles/dashboard.css';
import {jwtDecode} from 'jwt-decode'; // Asegúrate de instalar jwt-decode: npm install jwt-decode
import AjustesClima from './ajustes-clima.js';

const Dashboard = () => {
  const [activities, setActivities] = useState(null);
  const [user, setUser] = useState({});
  const [agenda, setAgenda] = useState([]);
  const [clima, setClima] = useState({});
  const [loading, setLoading] = useState(true);
  const [ciudad, setCiudad] = useState("");
  const [fecha, setFecha] = useState("");
  const [actividadSeleccionada, setActividadSeleccionada] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendarModalAbierto, setAgendarModalAbierto] = useState(false);
  const [modalType, setModalType] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const StarIcon = () => (
    <svg
      width="20"
      height="19"
      viewBox="0 0 20 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 1.66669L12.575 6.88335L18.3334 7.72502L14.1667 11.7834L15.15 17.5167L10 14.8084L4.85002 17.5167L5.83335 11.7834L1.66669 7.72502L7.42502 6.88335L10 1.66669Z"
        stroke="#1E1E1E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  useEffect(() => {
    const savedActivities = localStorage.getItem("selectedActivities");

    if (savedActivities) {
      const parsedActivities = JSON.parse(savedActivities);
      setActivities(parsedActivities);
    }
  }, []);

  useEffect(() => {
    const obtenerDatosDashboard = async () => {
      try {
        setLoading(true);

        // Obtén el token del localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No se encontró un token. Por favor inicia sesión.");
        }

        // Decodifica el token para obtener los datos del usuario
        const decodedToken = jwtDecode(token);
        console.log("Token decodificado:", decodedToken);
        const userData = {
          username: decodedToken.username,
          email: decodedToken.email,
        };
        setUser(userData);

        if (!activities) {
          throw new Error("No hay actividades seleccionadas. Por favor selecciona tus actividades.");
        }

        const selectedActivities = Object.entries(activities)
          .filter(([key, value]) => value)
          .map(([key]) => key);

        const agendaData = selectedActivities.map((actividad, index) => ({
          id: index + 1,
          actividad_nombre: actividad,
          fecha: "2025-04-25",
          hora_inicio: "10:00",
          hora_fin: "11:00"
        }));
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
  }, [activities]);

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

  const isActivitySuitableForWeather = (activityName) => {
    const weatherDescription = clima.weather?.[0]?.description || '';

    switch (activityName.toLowerCase()) {
      case "yoga":
        return true;
      case "yiclismo":
        return !["Lluvioso", "Tormenta", "Granizo", "Nieve"].includes(weatherDescription);
      case "trekking":
        return !["Lluvioso", "Tormenta", "Granizo", "Nieve"].includes(weatherDescription);
      case "futbol":
        return !["Lluvioso", "Tormenta", "Granizo", "Nieve"].includes(weatherDescription);
      case "trote":
        return !["Lluvioso", "Tormenta", "Granizo", "Nieve"].includes(weatherDescription);
      default:
        return true;
    }
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
      {showSettingsMenu && <div className="background-blur" />}

      <div className="dashboard-content">
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

        <div className="text-center p-6">
          <h2 className="dashboard-title">
            <FaSmile className="inline-block mr-2 text-2xl text-yellow-400" />
            Bienvenido, {user.username}!
          </h2>
          <p className="dashboard-welcome">{user.email}</p>
        </div>

        <div className="clima-container">
          <h2 className="clima-title">Clima en {clima.name}</h2>
          <div className="text-lg text-gray-700">
            <p className="clima-temp">{clima.main?.temp}°C</p>
            <p className="clima-description">
              <span className="weather-icon">{getWeatherIcon(clima.weather?.[0]?.description)}</span>
              {clima.weather?.[0]?.description}
            </p>
            <button className="agendarButton" onClick={() => setAgendarModalAbierto(true)}> Agendar Actividad </button>
          </div>
        </div>

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


  {agendarModalAbierto && (
    <div
      className="modal-overlay z-10 bg-white"
      onClick={() => setAgendarModalAbierto(false)}
    >
      <div
        className="modal-container-auto border border-gray-500 rounded shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center text-black">
          <h3 className="mb-4 text-lg font-semibold">Agendar Actividad</h3>
          <div className="form-group flex flex-col gap-4">
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <StarIcon />
              </div>
              <select
                value={actividadSeleccionada}
                onChange={(e) => setActividadSeleccionada(e.target.value)}
                defaultValue=""
                className="pl-8 border p-2 rounded w-full bg-purple-100"
              >
                <option value="" disabled>Selecciona una actividad</option>
                <option value="Yoga">Yoga</option>
                <option value="Trekking">Trekking</option>
                <option value="Ciclismo">Ciclismo</option>
                <option value="Fútbol">Fútbol</option>
                <option value="Trote">Trote</option>
              </select>
            </div>


            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none ">

              </div>
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Agregar ubicación "
                className="pl-10 border p-2 rounded w-full bg-purple-100 "
              />
            </div>

            <p className="text-left font-medium text-black">Fecha</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">

              </div>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="pl-10 border p-2 rounded w-full bg-green-100"
              />
            </div>
            <div className="flex gap-4">
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="border p-2 rounded w-full bg-green-100"
              />
              <input
                type="time"
                value={horaTermino}
                onChange={(e) => setHoraTermino(e.target.value)}
                className="border p-2 rounded w-full bg-green-100"
              />
            </div>

            <div className="flex justify-center gap-2 mt-4">
              <button
                className="boton-verde-modal"
                onClick={() => {
                    const actividad = {
                    nombre: actividadSeleccionada,
                    ciudad,
                    fecha,
                    horaInicio,
                    horaTermino,
                  };
                  console.log("Actividad agendada:", actividad);
                  localStorage.setItem('actividadAgendada', JSON.stringify(actividad));
                  setAgendarModalAbierto(false);
                }}
              >
                Guardar
              </button>
              <button
                className="boton-rojo-modal"
                onClick={() => setAgendarModalAbierto(false)}
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )}


    </div>
  );
};

export default Dashboard;