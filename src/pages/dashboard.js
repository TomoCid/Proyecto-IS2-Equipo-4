import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMapPin, FiCalendar, FiX, FiCheck, FiAlertCircle, FiBookmark, FiClock, FiPlus, FiSettings } from 'react-icons/fi';
import { MdSettings } from 'react-icons/md';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import { FiThumbsUp, FiThumbsDown, FiInfo } from 'react-icons/fi';
import ActivityFormModal from 'src/components/Activity/ActivityFormModal';
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
  const [notasPreferencias, setNotasPreferencias] = useState('');

  // estados del modal para editar preferencias
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [permiteLluvia, setPermiteLluvia] = useState(false);
  const [tempMinima, setTempMinima] = useState(null);
  const [tempMaxima, setTempMaxima] = useState(null);
  const [lluviaProbMaxima, setlluviaProbMaxima] = useState(null);
  const [lluviaMaxima, setlluviaMaxima] = useState(null);
  const [vientoMaximo, setVientoMaximo] = useState(null);
  const [vieneDeAgendar, setVieneDeAgendar] = useState(false);
  const [maxUV, setMaxUV] = useState('');
  const [periodicidad] = useState(0);
  const [requiresNoPrecipitation, setRequiresNoPrecipitation] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState(null);

  const [activityRecommendations, setActivityRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [errorRecommendations, setErrorRecommendations] = useState(null);
  const [forceRefreshRecommendations, setForceRefreshRecommendations] = useState(0);
  const [preferenciasClimaticasTemp, setPreferenciasClimaticasTemp] = useState(null);
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  
  // StarIcon para el modal de agendar
  const StarIcon = () => (
    <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 1.66669L12.575 6.88335L18.3334 7.72502L14.1667 11.7834L15.15 17.5167L10 14.8084L4.85002 17.5167L5.83335 11.7834L1.66669 7.72502L7.42502 6.88335L10 1.66669Z" 
            stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Verificar autenticación al cargar
  useEffect(() => {
    console.log("[AUTH_EFFECT] Running authentication check effect. Current user:", usuario);
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.log("[AUTH_EFFECT] No token found, redirecting.");
      if (router.pathname !== '/') router.replace('/'); 
      setCheckingAuth(false);
    } else {
      let currentDecodedUserId = null;
      try {
        const decoded = jwtDecode(token);
        currentDecodedUserId = decoded.id || decoded.user_id;
        console.log("[AUTH_EFFECT] Token decoded. Decoded User ID:", currentDecodedUserId);

        if (!usuario || (usuario && String(usuario.id) !== String(currentDecodedUserId))) {
          console.log("[AUTH_EFFECT] Setting/Updating user state.");
          setUsuario({
            id: currentDecodedUserId, 
            username: decoded.username || 'Usuario',
            email: decoded.email || 'usuario@email.com'
          });
        } else {
          console.log("[AUTH_EFFECT] User already set and ID matches, no user state update needed.");
        }

        const actividadesKey = `actividades_${decoded.email}`;
        const savedActivities = localStorage.getItem(actividadesKey);
        if (savedActivities) {
          try {
            setScheduledActivities(JSON.parse(savedActivities));
          } catch (e) { console.error("Error parsing saved activities from localStorage", e); }
        }
      } catch (err) {
        console.error('[AUTH_EFFECT] Error processing token:', err);
        sessionStorage.removeItem('token');
        if (router.pathname !== '/') router.replace('/');
      } finally {
        setCheckingAuth(false);
      }
    }
  }, [router]);

  // Cargar actividades del usuario al iniciar sesión
  useEffect(() => {
    if (!checkingAuth && usuario) { 
      fetchUserActivities();
    }
  }, [checkingAuth, usuario]);
  
  // Sincronizar preferencias climáticas al abrir el modal de agendar
  useEffect(() => {
    if (agendarModalAbierto && preferenciasClimaticasTemp) {
      setTempMinima(preferenciasClimaticasTemp.tempMinima);
      setTempMaxima(preferenciasClimaticasTemp.tempMaxima);
      setPermiteLluvia(preferenciasClimaticasTemp.permiteLluvia);
      setlluviaMaxima(preferenciasClimaticasTemp.lluviaMaxima);
      setVientoMaximo(preferenciasClimaticasTemp.vientoMaximo);
      setlluviaProbMaxima(preferenciasClimaticasTemp.lluviaProbMaxima);
      setMaxUV(preferenciasClimaticasTemp.maxUV);
    }
  }, [agendarModalAbierto]);

  // Intentar detectar ubicación inicial si no se ha hecho
  useEffect(() => {
    if (!checkingAuth && usuario && !initialLocationAttempted && !detectedLocation && !currentCiudad) {
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
    setActivityToEdit(activity);
    setShowEditPreferences(true);
  }

  const limpiarCampos = () => {
  setTempMinima(null);
  setTempMaxima(null);
  setlluviaProbMaxima(null);
  setlluviaMaxima(null);
  setVientoMaximo(null);
  setMaxUV(null)
  setRequiresNoPrecipitation(false);
  };

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
    const preferencias = preferenciasClimaticasTemp || {
      tempMinima,
      tempMaxima,
      permiteLluvia,
      lluviaMinima,
      lluviaMaxima,
      vientoMinimo,
      vientoMaximo,
      maxUV
    };

    const entryData = {
      activityId: Number(actividadSeleccionada),
      periodicidad: periodicidad,
      fecha: fechaActividad,
      horaInicio: horaInicio,
      horaFin: horaTermino,
      notes: notasPreferencias || null,
      latitude: lat,
      longitude: lon,
      reminderEnabled: reminderEnabled || false,
      reminderOffsetMinutes: reminderOffsetMinutes !== '' ? Number(reminderOffsetMinutes) : null,
      minTemp: preferencias.tempMinima !== null && preferencias.tempMinima !== '' ? Number(preferencias.tempMinima) : null,
      maxTemp: preferencias.tempMaxima !== null && preferencias.tempMaxima !== '' ? Number(preferencias.tempMaxima) : null,
      maxWindSpeed: preferencias.vientoMaximo !== null && preferencias.vientoMaximo !== '' ? Number(preferencias.vientoMaximo) : null,
      maxPrecipitationProbability: preferencias.lluviaProbMaxima !== null && preferencias.lluviaProbMaxima !== '' ? Number(preferencias.lluviaProbMaxima) : null,
      maxPrecipitationIntensity: preferencias.lluviaMaxima !== null && preferencias.lluviaMaxima !== '' ? Number(preferencias.lluviaMaxima) : null,
      requiresNoPrecipitation: !!preferencias.permiteLluvia,
      maxUv: preferencias.maxUV !== null && preferencias.maxUV !== '' ? Number(preferencias.maxUV) : null
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
      limpiarCampos();
      setForceRefreshRecommendations(prev => prev + 1); 
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

  useEffect(() => {
    const currentUserId = usuario?.id; // Extraer el ID del usuario

    if (currentUserId) { // Solo proceder si tenemos un ID de usuario
      const controller = new AbortController(); // Crear un AbortController
      const signal = controller.signal;

      const fetchRecommendations = async () => {
        setLoadingRecommendations(true);
        setErrorRecommendations(null);
        try {
          const token = sessionStorage.getItem('token');
          if (!token) {
            setErrorRecommendations("Token de autenticación no encontrado.");
            setActivityRecommendations([]); // Limpiar en caso de error de token
            return; // Salir temprano
          }
          
          const apiUrl = `/api/users/${currentUserId}/agenda/recommendations`; 

          const res = await fetch(apiUrl, {
            signal,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });


          if (!res.ok) {
            let errorData = { error: `Error de la API: ${res.status} ${res.statusText}` };
            try {
              errorData = await res.json();
            } catch (parseError) {
              console.warn("[FRONTEND] Could not parse error response JSON:", parseError);
            }
            console.error("[FRONTEND] API Error Data:", errorData);
            throw new Error(errorData.error || `Fallo al obtener recomendaciones: ${res.status}`);
          }

          const data = await res.json();
          setActivityRecommendations(data.recommendations || []);
          setErrorRecommendations(null); // Limpiar error si fue exitoso

        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('[FRONTEND] Fetch aborted');
          } else {
            console.error("[FRONTEND] Error in fetchRecommendations (catch block):", err);
            setErrorRecommendations(err.message || "Error al cargar recomendaciones.");
          }
          setActivityRecommendations([]);
        } finally {
          setLoadingRecommendations(false);
        }
      };
      fetchRecommendations();
      return () => {
        controller.abort(); 
      };
    } else {
      setActivityRecommendations([]);
      setLoadingRecommendations(false);
      setErrorRecommendations(null);
    }
  }, [usuario?.id, forceRefreshRecommendations]);

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
    console.log("[USER_ACTIVITIES] Fetching user activities. Current user state:", usuario);
    if (!usuario || !usuario.id) { 
        console.warn("[USER_ACTIVITIES] Skipping fetch, user or user.id is not defined.");
        return;
    }
    try {
      const userId = usuario.id; 
      console.log("[USER_ACTIVITIES] Fetching for userId:", userId);
      const res = await fetch(`/api/users/actividades_usuario?userId=${userId}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[USER_ACTIVITIES] API Error:", errorText);
        throw new Error('No se pudieron cargar las actividades del usuario');
      }
      const data = await res.json();
      console.log("[USER_ACTIVITIES] Data received:", data);
      setUserActivities(data.activities || []);
    } catch (err) {
      console.error("[USER_ACTIVITIES] Error:", err);
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

    const handleCloseAgendaModal = () => {
      setShowCalendar(false); 
      setForceRefreshRecommendations(prev => prev + 1); 
    };

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
    setForceRefreshRecommendations(prev => prev + 1);
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

  const handleSaveNewActivity = () => {
    fetchUserActivities(); 
    setForceRefreshRecommendations(prev => prev + 1);
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
                  onClick={() => {
                    setShowCalendar(false);
                    setForceRefreshRecommendations(prev => prev + 1); // Actualizar aquí
                  }}
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

              {/* --- BOTÓN PARA ABRIR EL MODAL DE CREACIÓN DE ACTIVIDAD --- */}
              <button
                onClick={() => setShowCreateActivityModal(true)}
                className="create-activity-button" // Añade estilos para esta clase en tu CSS
              >
                <FiPlus /> Crear Nueva Actividad
              </button>
              
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
                        onClick={() => handleEditPreferences(activity)} // Esto usa tu modal de preferencias simple
                      >
                        <MdSettings size={20} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-activities">No tienes actividades personalizadas. ¡Crea una!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición de preferencias climáticas*/}
        {showEditPreferences && (
          <div className="fixed modal-overlay z-50">
            <div className="modal-content flex flex-col gap-y-4 z-50">
              <h2>{activityToEdit ? activityToEdit.name : "Preferencias climáticas"}</h2>
              <h1 className='text-center'>Rango de temperatura (°C)</h1>
              <div className='flex gap-4'>
                <input
                  type="number"
                  value={tempMinima ?? ''}
                  onChange={(e) => setTempMinima(e.target.value)}
                  placeholder="Temperatura Mínima"
                  className="modal-agendar-input"
                />
                <input
                  type="number"
                  value={tempMaxima ?? ''}
                  onChange={(e) => setTempMaxima(e.target.value)}
                  placeholder="Temperatura Máxima"
                  className="modal-agendar-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permiteLluvia}
                    onChange={(e) => setPermiteLluvia(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <h1>
                    ¿Esta actividad se puede hacer con lluvia?
                  </h1>
                </label>
              </div>

              {permiteLluvia ? (
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={lluviaProbMaxima ?? ''}
                    placeholder="Probabilidad máx. de lluvia"
                    onChange={(e) => setlluviaProbMaxima(e.target.value)}
                    className="modal-agendar-input"
                  />
                  <input
                    type="number"
                    value={lluviaMaxima ?? ''}
                    placeholder="Precipitación máxima (mm)"
                    onChange={(e) => setlluviaMaxima(e.target.value)}
                    className="modal-agendar-input"
                  />
                </div>
              ) : (
                <p></p>
              )}
              <h1 className='text-center'>Intensidad del Viento (km/h)</h1>
              <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Intensidad máxima de viento"
                    onChange={(e) => setVientoMaximo(e.target.value)}
                    className="modal-agendar-input"
                  />

              </div>

              <h1 className='text-center'>Nivel UV máximo (Opcional)</h1>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={maxUV ?? ''}
                  placeholder="Nivel UV máximo"
                  onChange={(e) => setMaxUV(e.target.value)}
                  className="modal-agendar-input"
                />
              </div>

              <div className='flex gap-4'>
                <button
                  className="modal-agendar-button modal-agendar-button-primary flex-1"
                  onClick={() => {
                    const minTemp = parseFloat(tempMinima);
                    const maxTemp = parseFloat(tempMaxima);
                    const probMaxLluvia = parseFloat(lluviaProbMaxima);
                    const maxLluvia = parseFloat(lluviaMaxima);
                    const maxViento = parseFloat(vientoMaximo);

                    if (isNaN(minTemp) || isNaN(maxTemp)) {
                      showNotification('error', "Completa los rangos de temperatura");
                      return;
                    } else if (maxTemp < minTemp) {
                      showNotification('error', "Temperatura máxima no puede ser inferior a temperatura mínima");
                      return;
                    }

                    if (permiteLluvia && (isNaN(probMaxLluvia) || isNaN(maxLluvia) || probMaxLluvia < 0 || maxLluvia < 0 )) {
                      showNotification('error', "Valores de precipitación inválidos o incompletos");
                      return;
                    }

                    if (isNaN(maxViento) ||  maxViento < 0) {
                      showNotification('error', "Valores de intensidad del viento inválida o incompleta");
                      return;
                    }

                    if (maxUV < 0) {
                      showNotification('error', "Índice UV no puede tomar valores negativos");
                      return;
                    }

                    // GUARDAR preferencias SOLO si el usuario pulsa Guardar
                    setPreferenciasClimaticasTemp({
                      tempMinima,
                      tempMaxima,
                      permiteLluvia,
                      lluviaProbMaxima,
                      lluviaMaxima,
                      vientoMaximo,
                      maxUV
                    });

                    limpiarCampos();
                    setShowEditPreferences(false);
                    if (vieneDeAgendar) {
                      setAgendarModalAbierto(true);
                      setVieneDeAgendar(false);
                    }

                    const preferenciasClimaticas = {
                      actividadId: activityToEdit.id,
                      temperatura: {
                        minima: Number(tempMinima),
                        maxima: Number(tempMaxima),
                      },
                      permiteLluvia,
                      lluvia: permiteLluvia
                        ? {
                            probMaxima: Number(lluviaProbMaxima),
                            maxima: Number(lluviaMaxima),
                          }
                        : null,
                      viento: {
                        maxima: Number(vientoMaximo),
                      },
                      max_uv: maxUV !== "" ? Number(maxUV) : null
                    };
                    console.log(preferenciasClimaticas); 
                    limpiarCampos();

                  }}
                >
                  Guardar
                </button>
                <button
                  className="modal-agendar-button modal-agendar-button-secondary flex-1"
                  onClick={() => {
                    limpiarCampos();
                    setPreferenciasClimaticasTemp(null);
                    setShowEditPreferences(false);
                    if (vieneDeAgendar) {
                      setAgendarModalAbierto(true);
                      setVieneDeAgendar(false);
                    }
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Agendar Actividad */}
        {agendarModalAbierto && (
            <div
              className="modal-overlay"
              onClick={() => {
                setAgendarModalAbierto(false);
                limpiarCampos();
                setPreferenciasClimaticasTemp(null);
              }}
            >
            <div className="modal-agendar-container z-40" onClick={(e) => e.stopPropagation()}>
              <div className="modal-agendar-content relative ">

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
                  <button
                    onClick={() => {
                      setVieneDeAgendar(true);
                      setAgendarModalAbierto(false);
                      const actividad = userActivities.find(a => a.id == actividadSeleccionada);
                      setActivityToEdit(actividad || { name: "Nueva actividad", id: null });
                      setShowEditPreferences(true);
                    }}
                    className="modal-agendar-button modal-agendar-button-primary"
                  >
                    Ajustar preferencias climáticas
                  </button>
                  <input
                    type="text"
                    value={ciudadActividad}
                    onChange={(e) => setCiudadActividad(e.target.value)}
                    placeholder="Ubicación (opcional)"
                    className="modal-agendar-input"
                  />
                  <div className="flex flex-col gap-2">
                    <label htmlFor="notas-preferencias" className="font-semibold text-left">Notas / Descripción</label>
                    <textarea
                      id="notas-preferencias"
                      value={notasPreferencias}
                      onChange={e => setNotasPreferencias(e.target.value)}
                      placeholder="Agrega una descripción o notas para tus preferencias..."
                      className="modal-agendar-input"
                      rows={2}
                    />
                  </div>
                  
                  <label htmlFor="notas-preferencias" className="font-semibold text-left">Fecha</label>
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
                      onClick={() => {
                        setAgendarModalAbierto(false);
                        limpiarCampos();
                        setPreferenciasClimaticasTemp(null); 
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {usuario?.id && ( // Asegúrate que usuario.id exista antes de renderizar
          <ActivityFormModal
            isOpen={showCreateActivityModal}
            onClose={() => setShowCreateActivityModal(false)}
            userId={usuario.id}
            activityToEdit={null} // Siempre null para "Crear Nueva Actividad" desde este botón
            onSave={handleSaveNewActivity}
          />
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

            <div>
              {/* Activity Recommendations Section */}
              {!showCalendar && !showActivities && !agendarModalAbierto && (
                <div className="activityRecommendationsSection">
                  <h3 className="recommendationsTitle">Recomendaciones de Actividades Agendadas</h3>
                  {loadingRecommendations && <p>Cargando recomendaciones...</p>}
                  {errorRecommendations && <p className="statusBubble error">Error: {errorRecommendations}</p>}
                  
                  {!loadingRecommendations && !errorRecommendations && activityRecommendations.length === 0 && (
                    <p>No hay recomendaciones disponibles o no tienes actividades próximas agendadas.</p>
                  )}

                  {!loadingRecommendations && !errorRecommendations && activityRecommendations.length > 0 && (
                    <div className="recommendationsGrid">
                      {activityRecommendations.map(rec => {

                        return (
                          <div key={rec.id} className={`recommendationCard ${rec.weatherSuitability.isSuitable ? 'suitable' : 'unsuitable'}`}>
                            <div className="recommendationHeader">
                              <h4>{rec.activity_name}</h4> {/* Asegúrate de usar rec.activity_name si así viene del backend */}
                              <span className="recommendationDate">
                                {(() => {
                                  try {
                                    // Asegurarse que rec.fecha es un string o se puede convertir a uno en formato YYYY-MM-DD
                                    let fechaStr;
                                    if (typeof rec.fecha === 'string') {
                                      fechaStr = rec.fecha.split('T')[0]; // Tomar solo la parte de la fecha si es un ISO string completo
                                    } else if (rec.fecha && typeof rec.fecha.toISOString === 'function') {
                                      fechaStr = rec.fecha.toISOString().split('T')[0];
                                    } else {
                                      console.error("Formato de rec.fecha no reconocido:", rec.fecha);
                                      return "Fecha desconocida";
                                    }

                                    if (!rec.hora_inicio || typeof rec.hora_inicio !== 'string') {
                                      console.error("Formato de rec.hora_inicio no reconocido o ausente:", rec.hora_inicio);
                                      return "Hora desconocida";
                                    }

                                    const [year, month, day] = fechaStr.split('-');
                                    const [hours, minutes] = rec.hora_inicio.split(':');

                                    // Validar que todos los componentes son números antes de crear el Date
                                    if ([year, month, day, hours, minutes].some(val => isNaN(parseInt(val)))) {
                                        console.error("Componente de fecha/hora inválido:", {year, month, day, hours, minutes});
                                        return "Componentes de fecha/hora inválidos";
                                    }

                                    const activityDateTime = new Date(
                                      parseInt(year),
                                      parseInt(month) - 1, // Meses son 0-indexados
                                      parseInt(day),
                                      parseInt(hours),
                                      parseInt(minutes)
                                    );
                                    
                                    console.log("Parsed activityDateTime:", activityDateTime);


                                    if (isNaN(activityDateTime.getTime())) {
                                      console.error("activityDateTime resultó en Invalid Date. Componentes:", {year, month, day, hours, minutes});
                                      return "Fecha inválida (construcción)";
                                    }

                                    return activityDateTime.toLocaleString('es-ES', {
                                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    });

                                  } catch (e) {
                                    console.error("Error formateando fecha para recomendación:", e, "Datos originales:", {fecha: rec.fecha, hora: rec.hora_inicio});
                                    return "Error de fecha";
                                  }
                                })()}
                              </span>
                            </div>
                            
                             <>
                              <div className="recommendationStatus">
                                {rec.weatherSuitability.isSuitable ? (
                                  <FiThumbsUp className="statusIcon suitableIcon" />
                                ) : (
                                  <FiThumbsDown className="statusIcon unsuitableIcon" />
                                )}
                                <span>
                                  {rec.weatherSuitability.isSuitable ? "Adecuado para realizar" : "No recomendado"}
                                </span>
                              </div>
                              
                              {/* Solo mostrar razones si no es adecuado O si es adecuado y hay una razón específica (como la genérica) */}
                              {(!rec.weatherSuitability.isSuitable || (rec.weatherSuitability.isSuitable && rec.weatherSuitability.reasons && rec.weatherSuitability.reasons.length > 0)) && (
                                <div className="recommendationReasons">
                                  <FiInfo className="reasonInfoIcon" />
                                  <ul>
                                    {rec.weatherSuitability.reasons && rec.weatherSuitability.reasons.map((reason, index) => (
                                      <li key={index}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            



          </div>
        )}
      </main>
    </div>
  );
}