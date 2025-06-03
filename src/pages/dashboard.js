import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMapPin, FiCalendar, FiX, FiCheck, FiAlertCircle, FiBookmark, FiClock, FiPlus, FiSettings } from 'react-icons/fi';
import { MdSettings } from 'react-icons/md';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import '../styles/dashboard.css';


export default function Dashboard() {
  const router = useRouter();
  
  // Estados del usuario
  const [usuario, setUsuario] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Estados del clima
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [detectStatus, setDetectStatus] = useState('idle');
  const [detectError, setDetectError] = useState(null);
  const [inputCiudad, setInputCiudad] = useState('');
  const [currentCiudad, setCurrentCiudad] = useState(null);
  const [initialLocationAttempted, setInitialLocationAttempted] = useState(false);

  // Estados de actividades
  const [showSearch, setShowSearch] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [scheduledActivities, setScheduledActivities] = useState([]);
  const [showActivities, setShowActivities] = useState(false);
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [agendarModalAbierto, setAgendarModalAbierto] = useState(false);
  const [userActivities, setUserActivities] = useState([]);
  const activitiesForSelectedDate = scheduledActivities.filter(activity => {
    const activityDate = new Date(activity.fecha).toDateString();
    const selectedDate = new Date(calendarDate).toDateString();
    return activityDate === selectedDate;
  });
  
  // Estados para el modal de agendar
  const [actividadSeleccionada, setActividadSeleccionada] = useState("");
  const [ciudadActividad, setCiudadActividad] = useState("");
  const [fechaActividad, setFechaActividad] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaTermino, setHoraTermino] = useState("");

  // estados del modal para editar preferencias
  const [activityToEdit, setActivityToEdit] = useState(null);

  // StarIcon para el modal de agendar
  const StarIcon = () => (
    <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 1.66669L12.575 6.88335L18.3334 7.72502L14.1667 11.7834L15.15 17.5167L10 14.8084L4.85002 17.5167L5.83335 11.7834L1.66669 7.72502L7.42502 6.88335L10 1.66669Z" 
            stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      router.replace('/');
    } else {
      try {
        const decoded = jwtDecode(token);
        setUsuario({
          username: decoded.username || 'Usuario',
          email: decoded.email || 'usuario@email.com'
        });
        setCheckingAuth(false);

        // Cargar actividades guardadas por usuario
        const actividadesKey = `actividades_${decoded.email}`;
        const savedActivities = localStorage.getItem(actividadesKey);
        if (savedActivities) {
          setScheduledActivities(JSON.parse(savedActivities));
        }
      } catch (err) {
        console.error('Error decodificando token:', err);
        sessionStorage.removeItem('token');
        router.replace('/');
      }
    }
  }, [router]);

  // Cargar actividades del usuario al iniciar sesión
  useEffect(() => {
    if (!checkingAuth ,usuario) {
      fetchUserActivities();
    }
  }, [checkingAuth, usuario]);
  
  // Intentar detectar ubicación inicial si no se ha hecho
  useEffect(() => {
    if (!checkingAuth && usuario && !initialLocationAttempted && !detectedLocation && !currentCiudad) {
      console.log("Intentando detección de ubicación inicial...");
      handleDetectLocation(); 
      setInitialLocationAttempted(true); 
    }
  }, [checkingAuth, usuario, initialLocationAttempted, detectedLocation, currentCiudad]);

  // Función para cerrar sesión
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      const actividadesKey = `actividades_${usuario?.email}`;
      localStorage.removeItem(actividadesKey);
      sessionStorage.removeItem('token');
      router.replace('/');
    }
  };

  const handleEditPreferences = (activity) => {
    setShowEditPreferences(true);
    setActivityToEdit(activity);
    console.log("actividad a editar: " + activity);
  }

  async function handleRegistrarAgenda() {
    if (!actividadSeleccionada || !fechaActividad || !horaInicio || !horaTermino) {
      showNotification('error', 'Completa los campos obligatorios');
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      showNotification('error', 'Sesión expirada');
      return;
    }
    const decoded = jwtDecode(token);
    const userId = decoded.id || decoded.user_id;
    
    let lat = null;
    let lon = null;
    if (ciudadActividad) {
      const res = await fetch(`/api/weather/${encodeURIComponent(ciudadActividad)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.location) {
          lat = data.location.lat;
          lon = data.location.lon;
        }
      }
    }
    const entryData = {
      activityId: Number(actividadSeleccionada),
      fecha: fechaActividad,
      horaInicio,
      horaFin: horaTermino,
      notes: ciudadActividad || null,
      latitude: lat,
      longitude: lon,
    };

    try {
      const res = await fetch(`/api/agenda/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (!res.ok) {
        let errorMsg = 'Error al registrar agenda';
        const text = await res.text();
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorMsg;
        } catch (jsonErr) {
          errorMsg = text || errorMsg;
        }
        showNotification('error', errorMsg);
        return;
      }

      showNotification('success', 'Agenda registrada correctamente');
      setAgendarModalAbierto(false);
      // Limpia los campos si lo deseas
    } catch (err) {
      showNotification('error', err.message);
    }
  }
  
  async function fetchScheduledActivities() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.user_id;

      const res = await fetch(`/api/agenda/${userId}`);
      if (!res.ok) throw new Error('No se pudieron cargar las actividades agendadas');
      const data = await res.json();
      setScheduledActivities(data || []);
    } catch (err) {
      showNotification('error', err.message);
    }
  }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    if (checkingAuth) return;

    if (detectedLocation?.lat && detectedLocation?.lon) {
      fetchWeather(detectedLocation.lat, detectedLocation.lon);
    } else if (currentCiudad) {
      fetchWeather(null, null, currentCiudad);
    }
  }, [detectedLocation, currentCiudad, checkingAuth]); 

  async function fetchWeather(lat, lon, ciudad) {
    setLoading(true);
    setError(null);
    showNotification('loading', `Buscando clima para ${ciudad || 'tu ubicación'}...`);
    
    try {
      let url = '';
      if (lat && lon) {
        url = `/api/weather/coords?lat=${lat}&lon=${lon}&lang=es`;
      } else if (ciudad) {
        url = `/api/weather/${encodeURIComponent(ciudad)}?lang=es`;
      }

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(res.status === 404 
          ? 'Ciudad no encontrada' 
          : 'Error al obtener datos del clima');
      }

      const data = await res.json();
      setWeatherData(data);
      showNotification('success', `Clima actualizado para ${data.location.name}`);
    } catch (err) {
      setError(err.message);
      showNotification('error', `Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      const errorMsg = 'Tu navegador no soporta geolocalización o está desactivada';
      setDetectError(errorMsg);
      showNotification('error', errorMsg);
      setDetectStatus('error');
      return;
    }
    setDetectStatus('loading');
    setDetectError(null);
    //showNotification('loading', 'Detectando tu ubicación...');

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    setCurrentCiudad(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
            isNaN(latitude) || isNaN(longitude)) {
          const errMsg = 'Coordenadas inválidas obtenidas de geolocalización.';
          setDetectError(errMsg);
          showNotification('error', errMsg);
          setDetectStatus('error');
          console.error(errMsg);
          return; 
        }

        setDetectedLocation({
          lat: latitude,
          lon: longitude
        });
        setDetectStatus('success');
        if (initialLocationAttempted) { 
            showNotification('success', 'Ubicación detectada correctamente');
        }
      },
      (error) => {
        let errorMessage = 'Error al obtener la ubicación';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Por favor habilita los permisos de ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'No se pudo obtener tu ubicación. Verifica tu conexión a internet y que el GPS esté activado.';
            break;
          case error.TIMEOUT:
            errorMessage = 'El tiempo de espera se agotó. Intenta nuevamente en un área con mejor señal.';
            break;
          default:
            errorMessage = `Error desconocido: ${error.message}`;
        }
        
        setDetectError(errorMessage);
        showNotification('error', errorMessage); 
        setDetectStatus('error');
        console.error('Error en geolocalización:', error);
      },
      geoOptions
    );
  }

  function handleCityChange(e) {
    setInputCiudad(e.target.value);
  }

  function handleCitySubmit(e) {
    e.preventDefault();
    const ciudad = inputCiudad.trim();
    if (!ciudad) {
      showNotification('error', 'Por favor ingresa una ciudad');
      return;
    }
    setDetectedLocation(null);
    setCurrentCiudad(ciudad);
    setShowSearch(false);
    setInputCiudad('');
    setInitialLocationAttempted(true);
  }

  const loadScheduledActivities = async () => {
    try {
      await fetchScheduledActivities();
      setShowCalendar(true);
    } catch (error) {
      showNotification('error', 'Error al cargar actividades');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Funcion para cargar actividades del usuario
  const fetchUserActivities = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.user_id; // Ajusta según tu JWT

      const res = await fetch(`/api/users/actividades_usuario?userId=${userId}`);
      if (!res.ok) throw new Error('No se pudieron cargar las actividades');
      const data = await res.json();
      setUserActivities(data.activities || []);
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Función para guardar actividad desde el modal de agendar
  const handleAgendarActividad = () => {
    if (!actividadSeleccionada) {
      showNotification('error', 'Por favor selecciona una actividad');
      return;
    }
    if (horaInicio && horaTermino) {
      const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number);
      const [terminoHoras, terminoMinutos] = horaTermino.split(':').map(Number);

      const inicioEnMinutos = inicioHoras * 60 + inicioMinutos;
      const terminoEnMinutos = terminoHoras * 60 + terminoMinutos;

      if (terminoEnMinutos <= inicioEnMinutos) {
        showNotification("error", "La hora de término debe ser posterior a la de inicio");
        return;
      }    
    }

    const nuevaActividad = {
      id: Date.now(),
      title: actividadSeleccionada,
      description: ciudadActividad ? `Ubicación: ${ciudadActividad}` : '',
      date: fechaActividad || new Date(),
      time: `${horaInicio || '12:00'}${horaTermino ? ` - ${horaTermino}` : ''}`
    };

    const actividadesKey = `actividades_${usuario?.email}`; // o username si prefieres

    const actividadesActualizadas = [...scheduledActivities, nuevaActividad];
    setScheduledActivities(actividadesActualizadas);
    localStorage.setItem(actividadesKey, JSON.stringify(actividadesActualizadas));
    
    setAgendarModalAbierto(false);
    showNotification('success', 'Actividad agendada correctamente');
    
    // Resetear campos
    setActividadSeleccionada("");
    setCiudadActividad("");
    setFechaActividad("");
    setHoraInicio("");
    setHoraTermino("");
  };

  const [selectedForecast, setSelectedForecast] = useState(null);
  const [showForecastTooltip, setShowForecastTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const forecastSectionRef = useRef(null);
  const tooltipRef = useRef(null);

  // Cierra el tooltip al hacer click fuera
  useEffect(() => {
    if (!showForecastTooltip) return;
    function handleClickOutside(e) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target) &&
        forecastSectionRef.current &&
        !forecastSectionRef.current.contains(e.target)
      ) {
        setShowForecastTooltip(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForecastTooltip]);

  // Muestra el tooltip cerca de la tarjeta clickeada
  const handleForecastClick = (day, event) => {
    setSelectedForecast(day);
    setShowForecastTooltip(true);

    // Calcula la posición a la derecha de la tarjeta
    const cardRect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: cardRect.top + window.scrollY + cardRect.height / 2,
      left: cardRect.right + window.scrollX + 16, // 16px de separación
      align: 'right'
    });
  };

  if (checkingAuth) {
    return ( 
      <div className="flex justify-center items-center min-h-screen">
        <p>Verificando sesión...</p> {/* O un spinner */}
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Redirigiendo...</p>
      </div>
    );
  }
console.log("scheduledActivities:", scheduledActivities);
  return (
    <div className="appWrapper">
      {/* Botón de ajustes en la esquina superior derecha */}
      <div className="absolute top-5 right-5 z-50">
        <div className="relative">
          <FiSettings 
            className="text-2xl cursor-pointer text-gray-700 hover:text-blue-600"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          />
          {showSettingsMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
              <button
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notificación flotante */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'loading' && <div className="spinner"></div>}
            {notification.type === 'success' && <FiCheck className="notification-icon" />}
            {notification.type === 'error' && <FiAlertCircle className="notification-icon" />}
            <span>{notification.message}</span>
          </div>
          <button 
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Sidebar*/}
      <aside className="sidebar">
        <div className="sidebar-content">
          {/* Botón de búsqueda */}
          <div className="sidebar-item">
            <button 
              className="sidebar-button" 
              onClick={() => setShowSearch(!showSearch)}
            >
              <FiSearch className="sidebar-icon" />
              <span>Buscar ciudad</span>
            </button>
            
            {showSearch && (
              <form onSubmit={handleCitySubmit} className="sidebar-search-form">
                <input
                  type="text"
                  value={inputCiudad}
                  onChange={handleCityChange}
                  placeholder="Ej: Madrid, Barcelona..."
                  className="sidebar-input"
                  autoFocus
                />
                <button type="submit" className="search-submit-button">
                  Buscar
                </button>
              </form>
            )}
          </div>

          {/* Botón de ubicación */}
          <div className="sidebar-item">
            <button 
              className="sidebar-button"
              onClick={handleDetectLocation}
              disabled={detectStatus === 'loading'}
            >
              <FiMapPin className="sidebar-icon" />
              <span>
                {detectStatus === 'loading' ? 'Detectando...' : 'Mi ubicación'}
              </span>
            </button>
          </div>

          {/* Botón de actividades */}
          <div className="sidebar-item">
            <button 
              className="sidebar-button"
              onClick={() => {
                setShowActivities(!showActivities);
                setShowAddActivity(false);
                if (!showActivities) fetchUserActivities();
              }}
            >
              <FiBookmark className="sidebar-icon" />
              <span>Mis actividades</span>
            </button>
          </div>

          {/* Botón de Calendario */}
          <div className="sidebar-item">
            <button 
              className="sidebar-button"
              onClick={loadScheduledActivities}
            >
              <FiCalendar className="sidebar-icon" />
              <span>Calendario</span>
            </button>
          </div>

          {/* Nuevo botón para agendar actividad */}
          <div className="sidebar-item">
            <button 
              className="sidebar-button"
              onClick={() => setAgendarModalAbierto(true)}
            >
              <FiPlus className="sidebar-icon" />
              <span>Agendar Actividad</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="dashboardContainer">
        <header className="userHeader">
          <h1 className="title">👋 ¡Bienvenido, {usuario.username}!</h1>
          <p className="userEmail">📧 {usuario.email}</p>
          {weatherData?.location && (
            <p className="cityInfo">
              🌍 <strong>{weatherData.location.name}, {weatherData.location.region}</strong>
            </p>
          )}
        </header>

        {loading && (
          <div className="statusBubble loading">
            <div className="spinner"></div> Buscando datos del clima...
          </div>
        )}

        {error && (
          <div className="statusBubble error">
            <FiAlertCircle /> Error: {error}
          </div>
        )}

        {detectError && (
          <div className="statusBubble error">
            <FiAlertCircle /> {detectError}
          </div>
        )}

        {/* Modal de Calendario */}
        {showCalendar && (
          <div className="calendar-modal-overlay">
            <div className="calendar-modal">
              <div className="modal-header">
                <h2>Mis Actividades Agendadas</h2>
                <button 
                  className="modal-close-button"
                  onClick={() => setShowCalendar(false)}
                  aria-label="Cerrar calendario"
                >
                  <FiX className="close-icon" />
                </button>
              </div>
              
              <div className="calendar-container">
                <Calendar
                  onChange={setCalendarDate}
                  value={calendarDate}
                  locale="es"
                  className="react-calendar-custom"
                  tileContent={({ date, view }) => {
                    if (view === 'month') {
                      const hasActivity = scheduledActivities.some(
                        activity => new Date(activity.fecha).toDateString() === date.toDateString()
                      );
                      return hasActivity ? <div className="calendar-activity-dot" /> : null;
                    }
                  }}
                />
                
                <div className="calendar-activities-container">
                  <h3 className="calendar-selected-date">
                    {formatDate(calendarDate)}
                  </h3>
                  
                  {activitiesForSelectedDate.length > 0 ? (
                    <div className="activities-list">
                      {activitiesForSelectedDate.map(activity => {
                        const activityName = activity.actividad_nombre || 'Sin nombre';
                        const horaInicio = activity.hora_inicio ? activity.hora_inicio.slice(0,5) : '--:--';
                        const horaFin = activity.hora_fin ? activity.hora_fin.slice(0,5) : '--:--';
                        return (
                          <div key={activity.agenda_id || activity.id} className="activity-card">
                            <div className="activity-time">
                              <FiClock className="activity-icon" />
                              {horaInicio} - {horaFin}
                            </div>
                            <div className="activity-content">
                              <h4>{activityName}</h4>
                              {activity.notes && (
                                <p className="activity-description">
                                  {activity.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-activities">
                      No hay actividades programadas para este día
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Actividades */}
        {showActivities && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                className="modal-close-button"
                onClick={() => setShowActivities(false)}
              >
                <FiX />
              </button>
              
              <h2>Mis Actividades</h2>        
              <div className="activities-list-container">
                {userActivities.length > 0 ? (
                  userActivities.map(activity => (
                    <div key={activity.id} className="activity-item relative">
                      <h3>{activity.name}</h3>
                      {activity.description && (
                        <p>{activity.description}</p>
                      )}
                      <button
                        className="settings-button absolute top-2 right-2"
                        onClick={() => handleEditPreferences(activity)}
                      >
                        <MdSettings size={20} />
                      </button>
                    </div>
                      ))
                    ) : (
                      <p className="no-activities">No tienes actividades asociadas</p>
                    )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición de preferencias climáticas */}
        {showEditPreferences && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{activityToEdit.name}</h2>
              <button
                className="modal-agendar-button modal-agendar-button-secondary"
                onClick={() => setShowEditPreferences(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
          
        )}

        {/* Modal para Agendar Actividad */}
        {agendarModalAbierto && (
          <div className="modal-overlay" onClick={() => setAgendarModalAbierto(false)}>
            <div className="modal-agendar-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-agendar-content">
                <h3 className="modal-agendar-title">Agendar Actividad</h3>
                <div className="modal-agendar-form">
                  <div className="modal-agendar-input-group">
                    <div className="modal-agendar-icon">
                      <StarIcon />
                    </div>
                      <select
                        value={actividadSeleccionada}
                        onChange={(e) => setActividadSeleccionada(e.target.value)}
                        className="modal-agendar-select"
                      >
                        <option value="" disabled>Selecciona una actividad</option>
                        {userActivities.length > 0 ? (
                          userActivities.map(activity => (
                            <option key={activity.id} value={activity.id}>
                              {activity.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No tienes actividades disponibles</option>
                        )}
                      </select>
                  </div>

                  <input
                    type="text"
                    value={ciudadActividad}
                    onChange={(e) => setCiudadActividad(e.target.value)}
                    placeholder="Ubicación (opcional)"
                    className="modal-agendar-input"
                  />

                  <input
                    type="date"
                    value={fechaActividad}
                    onChange={(e) => setFechaActividad(e.target.value)}
                    className="modal-agendar-input"
                  />

                  <div className="modal-agendar-time-section">
                    <div className="modal-agendar-time-group">
                      <label className="modal-agendar-time-label">Hora de inicio</label>
                      <input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        className="modal-agendar-time-input"
                      />
                    </div>
                    
                    <div className="modal-agendar-time-group">
                      <label className="modal-agendar-time-label">Hora de término</label>
                      <input
                        type="time"
                        value={horaTermino}
                        onChange={(e) => setHoraTermino(e.target.value)}
                        className="modal-agendar-time-input"
                      />
                    </div>
                  </div>

                  <div className="modal-agendar-buttons">
                    <button
                      className="modal-agendar-button modal-agendar-button-primary"
                      onClick={handleRegistrarAgenda}
                    >
                      Guardar
                    </button>
                    <button
                      className="modal-agendar-button modal-agendar-button-secondary"
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

         {!weatherData && !loading && !error && !showCalendar && !showActivities && !agendarModalAbierto && detectStatus === 'idle' && (
            <div className="welcome-message">
              <h2>Consulta el clima de cualquier ciudad</h2>
              <p>Intentando obtener tu ubicación actual o usa el buscador...</p>
            </div>
          )}
      
          {/* Mostrar mensaje si la detección inicial falló y no hay ciudad buscada */}
          {!weatherData && !loading && !currentCiudad && detectStatus === 'error' && initialLocationAttempted && (
            <div className="welcome-message">
              <h2>No se pudo obtener tu ubicación automáticamente</h2>
              <p>Por favor, usa el buscador para consultar el clima de una ciudad, o intenta detectar tu ubicación de nuevo.</p>
              {detectError && <p className="text-red-500 mt-2">{detectError}</p>}
            </div>
          )}

        {weatherData && !showCalendar && !showActivities && !agendarModalAbierto && (
          <div className="weatherContent">
            <div className="weatherMainCard">
              <div className="currentWeatherSection compact">
                <div className="weatherIconContainer">
                  <img
                    className="weatherIconLarge"
                    src={`https:${weatherData.current.condition.icon}`}
                    alt={weatherData.current.condition.text}
                  />
                </div>
                <div className="temperatureLarge">
                  {Math.round(weatherData.current.temp_c)}<span className="degree">°C</span>
                </div>
                <div className="conditionTextLarge">
                  {weatherData.current.condition.text}
                </div>
              </div>
              <div className="weatherDetailsGrid compact">
                {[
                  { emoji: '💧', label: 'Humedad', value: `${weatherData.current.humidity}%` },
                  { emoji: '🌬️', label: 'Viento', value: `${weatherData.current.wind_kph} km/h` },
                  { emoji: '☁️', label: 'Nubosidad', value: `${weatherData.current.cloud}%` },
                  { emoji: '🌡️', label: 'Sensación', value: `${Math.round(weatherData.current.feelslike_c)}°C` },
                  { emoji: '🌅', label: 'Amanecer', value: weatherData.forecast.forecastday[0].astro.sunrise },
                  { emoji: '🌇', label: 'Atardecer', value: weatherData.forecast.forecastday[0].astro.sunset },
                  { emoji: '🧭', label: 'Presión', value: `${weatherData.current.pressure_mb} hPa` },
                  { emoji: '👁️', label: 'Visibilidad', value: `${weatherData.current.vis_km} km` },
                  { emoji: '🔆', label: 'Índice UV', value: weatherData.current.uv },
                  { emoji: '🌧️', label: 'Precipitación', value: `${weatherData.current.precip_mm} mm` },
                  { emoji: '💦', label: 'Punto de rocío', value: `${weatherData.current.dewpoint_c ?? '-'}°C` },
                ].map((item, index) => (
                  <div key={index} className="detailCard">
                    <span className="emoji">{item.emoji}</span>
                    <div className="label">{item.label}</div>
                    <div className="value">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sevenDayForecast">
              <h3 className="forecastsectionTitle">Próximos días</h3>
              <div className="forecastsection" ref={forecastSectionRef}>
                {weatherData.forecast.forecastday.slice(1, 7).map((day, index) => (
                  <div
                    key={day.date_epoch}
                    className="detailCard forecastCard"
                    onClick={(e) => handleForecastClick(day, e)}
                  >
                    <div className="dayName">
                      {index === 0 ? '📅 Hoy' : new Date(day.date).toLocaleDateString('es-CL', { weekday: 'long' })}
                    </div>
                    <img
                      src={`https:${day.day.condition.icon}`}
                      alt={day.day.condition.text}
                      className="forecastIcon"
                    />
                    <div className="label">{day.day.condition.text}</div>
                    <div className="value">
                      {Math.round(day.day.maxtemp_c)}° / {Math.round(day.day.mintemp_c)}°
                    </div>
                  </div>
                ))}
              </div>
              {/* Tooltip de datos secundarios */}
              {showForecastTooltip && selectedForecast && (
                <div
                  className="forecast-tooltip"
                  ref={tooltipRef}
                  style={{
                    position: 'absolute',
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                    zIndex: 2000,
                  }}
                >
                  <h4>
                    {new Date(selectedForecast.date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </h4>
                  <ul>
                    <li><span className="tooltip-label">Humedad:</span>💧 {selectedForecast.day.avghumidity}%</li>
                    <li><span className="tooltip-label">Viento:</span>🌬️ {selectedForecast.day.maxwind_kph} km/h</li>
                    <li><span className="tooltip-label">Nubosidad:</span>☁️ {selectedForecast.day.daily_chance_of_cloud ?? '-'}%</li>
                    <li><span className="tooltip-label">Sensación:</span>🌡️ {Math.round(selectedForecast.day.avgtemp_c)}°C</li>
                    <li><span className="tooltip-label">Amanecer:</span>🌅 {selectedForecast.astro.sunrise}</li>
                    <li><span className="tooltip-label">Atardecer:</span>🌇 {selectedForecast.astro.sunset}</li>
                    <li><span className="tooltip-label">Presión:</span>🧭 {selectedForecast.day.pressure_mb ?? '-'} hPa</li>
                    <li><span className="tooltip-label">Visibilidad:</span>👁️ {selectedForecast.day.avgvis_km ?? '-'} km</li>
                    <li><span className="tooltip-label">UV:</span>🔆 {selectedForecast.day.uv}</li>
                    <li><span className="tooltip-label">Precipitación:</span>🌧️ {selectedForecast.day.totalprecip_mm} mm</li>
                    <li><span className="tooltip-label">Rocío:</span>💦 {selectedForecast.day.dewpoint_c ?? '-'}°C</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}