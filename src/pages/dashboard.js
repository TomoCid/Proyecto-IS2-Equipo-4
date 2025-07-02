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
  
  // User states
  const [usuario, setUsuario] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Weather states
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

  // Activity states
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
  
  // States for the schedule modal
  const [actividadSeleccionada, setActividadSeleccionada] = useState("");
  const [ciudadActividad, setCiudadActividad] = useState("");
  const [fechaActividad, setFechaActividad] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [notasPreferencias, setNotasPreferencias] = useState('');

  // States for the edit preferences modal
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

  const [showMainWeatherView, setShowMainWeatherView] = useState(false); 
  const [showScheduledActivitiesTab, setShowScheduledActivitiesTab] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [dailyRecommendations, setDailyRecommendations] = useState([]);
  const [loadingDailyRecs, setLoadingDailyRecs] = useState(false);
  
  const [isReloading, setIsReloading] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('forceDashboardReload') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isReloading) {
      // Removemos la bandera para no crear un bucle
      sessionStorage.removeItem('forceDashboardReload');
      // Forzamos la recarga
      window.location.reload();
    }
  }, [isReloading]);

  // StarIcon for the schedule modal
  const StarIcon = () => (
    <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 1.66669L12.575 6.88335L18.3334 7.72502L14.1667 11.7834L15.15 17.5167L10 14.8084L4.85002 17.5167L5.83335 11.7834L1.66669 7.72502L7.42502 6.88335L10 1.66669Z" 
            stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  useEffect(() => {
    // Este efecto se ejecuta solo una vez cuando la página carga.
    if (sessionStorage.getItem('forceDashboardReload') === 'true') {
      sessionStorage.removeItem('forceDashboardReload');
      window.location.reload();
    }
  }, []);

  // Check authentication on load
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

  useEffect(() => {
    if (!checkingAuth && usuario && usuario.id) { 
      console.log("[USER_ACTIVITIES_EFFECT] Triggering fetchUserActivities due to auth check complete and user ID present.");
      fetchUserActivities();
      fetchScheduledActivities(); 
    }
  }, [checkingAuth, usuario?.id]);
  
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
  }, [agendarModalAbierto, preferenciasClimaticasTemp]);

  useEffect(() => {
    console.log("[PREFERENCES_EFFECT] activityToEdit changed:", activityToEdit);
    if (activityToEdit) {
      console.log("[PREFERENCES_EFFECT] Activity to edit exists. Checking preferences:", activityToEdit.preferences);
      if (activityToEdit.preferences && Object.keys(activityToEdit.preferences).length > 0) {
        console.log("[PREFERENCES_EFFECT] Preferences found and not empty. Loading values.");
        setTempMinima(activityToEdit.preferences.min_temp ?? null);
        setTempMaxima(activityToEdit.preferences.max_temp ?? null);
        setPermiteLluvia(activityToEdit.preferences.permite_lluvia ?? false);
        setlluviaProbMaxima(activityToEdit.preferences.max_precipitation_probability ?? null);
        setlluviaMaxima(activityToEdit.preferences.max_precipitation_intensity ?? null);
        setVientoMaximo(activityToEdit.preferences.max_wind_speed ?? null);
        setMaxUV(activityToEdit.preferences.max_uv ?? '');
      } else {
        console.log("[PREFERENCES_EFFECT] No preferences found or empty object. Cleaning fields.");
        limpiarCampos();
      }
    } else {
      console.log("[PREFERENCES_EFFECT] No activity selected (modal closed or reset). Cleaning fields.");
      limpiarCampos();
    }
  }, [activityToEdit]);

  useEffect(() => {
    if (!checkingAuth && usuario && !initialLocationAttempted && !detectedLocation && !currentCiudad) {
      handleDetectLocation(); 
      setInitialLocationAttempted(true); 
    }
  }, [checkingAuth, usuario, initialLocationAttempted, detectedLocation, currentCiudad]);

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
    setPermiteLluvia(false);
  };

  const limpiarCamposDeAgenda = () => {
    setActividadSeleccionada("");
    setCiudadActividad("");
    setFechaActividad("");
    setHoraInicio("");
    setHoraTermino("");
    setNotasPreferencias('');
    setPreferenciasClimaticasTemp(null); 
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

    let finalPreferences;

    if (preferenciasClimaticasTemp) {
        finalPreferences = {
            minTemp: preferenciasClimaticasTemp.tempMinima,
            maxTemp: preferenciasClimaticasTemp.tempMaxima,
            maxWindSpeed: preferenciasClimaticasTemp.vientoMaximo,
            maxPrecipitationProbability: preferenciasClimaticasTemp.lluviaProbMaxima,
            maxPrecipitationIntensity: preferenciasClimaticasTemp.lluviaMaxima,
            requiresNoPrecipitation: !!preferenciasClimaticasTemp.permiteLluvia,
            maxUv: preferenciasClimaticasTemp.maxUV,
        };
    } else {
        const selectedActivityData = userActivities.find(
            act => String(act.id) === String(actividadSeleccionada)
        );

        if (selectedActivityData && selectedActivityData.preferences) {
            const storedPrefs = selectedActivityData.preferences;
            finalPreferences = {
                minTemp: storedPrefs.min_temp,
                maxTemp: storedPrefs.max_temp,
                maxWindSpeed: storedPrefs.max_wind_speed,
                maxPrecipitationProbability: storedPrefs.max_precipitation_probability,
                maxPrecipitationIntensity: storedPrefs.max_precipitation_intensity,
                requiresNoPrecipitation: !!storedPrefs.requires_no_precipitation,
                maxUv: storedPrefs.max_uv,
            };
        } else {
            finalPreferences = { minTemp: null, maxTemp: null, maxWindSpeed: null, maxPrecipitationProbability: null, maxPrecipitationIntensity: null, requiresNoPrecipitation: false, maxUv: null };
        }
    }

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
      minTemp: finalPreferences.minTemp !== null && finalPreferences.minTemp !== '' ? Number(finalPreferences.minTemp) : null,
      maxTemp: finalPreferences.maxTemp !== null && finalPreferences.maxTemp !== '' ? Number(finalPreferences.maxTemp) : null,
      maxWindSpeed: finalPreferences.maxWindSpeed !== null && finalPreferences.maxWindSpeed !== '' ? Number(finalPreferences.maxWindSpeed) : null,
      maxPrecipitationProbability: finalPreferences.maxPrecipitationProbability !== null && finalPreferences.maxPrecipitationProbability !== '' ? Number(finalPreferences.maxPrecipitationProbability) : null,
      maxPrecipitationIntensity: finalPreferences.maxPrecipitationIntensity !== null && finalPreferences.maxPrecipitationIntensity !== '' ? Number(finalPreferences.maxPrecipitationIntensity) : null,
      requiresNoPrecipitation: !!finalPreferences.requiresNoPrecipitation,
      maxUv: finalPreferences.maxUv !== null && finalPreferences.maxUv !== '' ? Number(finalPreferences.maxUv) : null
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
      setPreferenciasClimaticasTemp(null); 
      
      setForceRefreshRecommendations(prev => prev + 1); 
    } catch (err) {
      showNotification('error', err.message);
    }
  }
  
  const fetchDailyRecommendations = async (date) => {
    if (!usuario || !weatherData?.location) return;

    setLoadingDailyRecs(true);
    setDailyRecommendations([]); // Limpiar recomendaciones anteriores

    const formattedDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const { lat, lon } = weatherData.location;
    const token = sessionStorage.getItem('token');

    try {
      const res = await fetch(
        `/api/users/${usuario.id}/daily-recommendations/${formattedDate}?lat=${lat}&lon=${lon}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!res.ok) {
        throw new Error('No se pudieron cargar las recomendaciones.');
      }

      const data = await res.json();
      setDailyRecommendations(data);

    } catch (error) {
      console.error("Error fetching daily recommendations:", error);
      showNotification('error', error.message);
    } finally {
      setLoadingDailyRecs(false);
    }
  };

  async function fetchScheduledActivities() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.user_id;

      const res = await fetch(`/api/agenda/${userId}`);
      if (!res.ok) {
        let errorMsg = 'No se pudieron cargar las actividades agendadas';
        try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorMsg;
        } catch (jsonError) {
            console.warn("Failed to parse error response for scheduled activities:", jsonError);
        }
        throw new Error(errorMsg);
      }
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
    const currentUserId = usuario?.id;

    if (currentUserId) {
      const controller = new AbortController();
      const signal = controller.signal;

      const fetchRecommendations = async () => {
        setLoadingRecommendations(true);
        setErrorRecommendations(null);
        try {
          const token = sessionStorage.getItem('token');
          if (!token) {
            setErrorRecommendations("Token de autenticación no encontrado.");
            setActivityRecommendations([]);
            return;
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
          setErrorRecommendations(null);

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
      setIsLoading(false);
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
    showNotification('loading', 'Detectando tu ubicación...');

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
        setIsLoading(false);
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
      console.log("[USER_ACTIVITIES] Data received from API:", data);
      setUserActivities(data.activities || []);
    } catch (err) {
      console.error("[USER_ACTIVITIES] Error:", err);
      showNotification('error', err.message);
    }
  };

  const handleAgendarActividad = () => {
    if (!actividadSeleccionada || !fechaActividad || !horaInicio || !horaTermino) {
      showNotification('error', 'Completa los campos obligatorios');
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

    const actividadesKey = `actividades_${usuario?.email}`;

    const actividadesActualizadas = [...scheduledActivities, nuevaActividad];
    setScheduledActivities(actividadesActualizadas);
    localStorage.setItem(actividadesKey, JSON.stringify(actividadesActualizadas));
    
    setAgendarModalAbierto(false);
    showNotification('success', 'Actividad agendada correctamente');
    setForceRefreshRecommendations(prev => prev + 1);
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

const handleForecastClick = (day, event) => {
  setSelectedForecast(day);
  setShowForecastTooltip(true);

  const cardRect = event.currentTarget.getBoundingClientRect();
  setTooltipPosition({
    top: cardRect.top + window.scrollY + cardRect.height / 2,
    left: cardRect.right + window.scrollX + 16, 
    align: 'right'
  });
};

  const handleSaveNewActivity = () => {
    fetchUserActivities(); 
    setForceRefreshRecommendations(prev => prev + 1);
  };

  if (isReloading) {
    return (
      <div>
        <div className="spinner"></div> 
      </div>
    );
  }
  
  if (checkingAuth) {
    return ( 
      <div className="flex justify-center items-center min-h-screen">
        <p>Verificando sesión...</p>
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

      <aside className="sidebar">
        <div className="sidebar-content">
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

          <div className="sidebar-item">
            <button 
              className="sidebar-button"
              onClick={() => {
                setShowActivities(!showActivities);
                setShowAddActivity(false); 
              }}
            >
              <FiBookmark className="sidebar-icon" />
              <span>Mis actividades</span>
            </button>
          </div>
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

      <main className="dashboardContainer">
        <header className="userHeader">

          <div className="userInfoContainer">
            <h1 className="title">👋 ¡Bienvenido, {usuario.username}!</h1>
            <p className="userEmail">📧 {usuario.email}</p>
          </div>

          {weatherData?.location && (
            <p className="cityInfo">
              🌍 <strong>{weatherData.location.name}, {weatherData.location.region}</strong>
            </p>
          )}

          <div className="view-toggle-switch">
            <div className="toggle-switch-container">
              <button
                className={`toggle-switch-button ${
                  showMainWeatherView ? 'active' : ''
                }`}
                onClick={() => {
                  setShowMainWeatherView(true);
                  setShowActivities(false);
                  setAgendarModalAbierto(false);
                  setShowCalendar(false); 
                }}
              >
                Clima
              </button>
              <button
                className={`toggle-switch-button ${
                  !showMainWeatherView ? 'active' : ''
                }`}
                onClick={async () => {
                  setShowMainWeatherView(false);
                  setShowActivities(false);
                  setAgendarModalAbierto(false);
                  setShowCalendar(false); 
                  setShowScheduledActivitiesTab(true); 
                }}
              >
                Calendario
              </button>
            </div>
          </div>
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
              <button
                onClick={() => setShowCreateActivityModal(true)}
                className="create-activity-button" 
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
                        onClick={() => handleEditPreferences(activity)}
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

        {showEditPreferences && (
          <div className="fixed modal-overlay z-50">
            <div className="modal-content flex flex-col gap-y-4 z-50">
              <h2>{activityToEdit ? activityToEdit.name : "Preferencias climáticas"}</h2>
              <h1 className='text-center'>Rango de temperatura (°C)</h1>
              <div className='flex gap-4'>
                <input
                  type="number"
                  value={tempMinima || ''}
                  onChange={(e) => setTempMinima(e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Temperatura Mínima"
                  className="modal-agendar-input"
                  min="-100"
                  max="100"
                />
                <input
                  type="number"
                  value={tempMaxima || ''}
                  onChange={(e) => setTempMaxima(e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Temperatura Máxima"
                  className="modal-agendar-input"
                  min="-100"
                  max="100"
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
                    value={lluviaProbMaxima || ''} 
                    placeholder="Probabilidad máx. de lluvia"
                    onChange={(e) => setlluviaProbMaxima(e.target.value === '' ? null : Number(e.target.value))}
                    className="modal-agendar-input"
                    min="0"
                    max="100"
                  />
                  <input
                    type="number"
                    value={lluviaMaxima || ''} 
                    placeholder="Precipitación máxima (mm)"
                    onChange={(e) => setlluviaMaxima(e.target.value === '' ? null : Number(e.target.value))}
                    className="modal-agendar-input"
                    min="0"
                    max="500"
                  />
                </div>
              ) : (
                <p></p>
              )}
              <h1 className='text-center'>Intensidad del Viento (km/h)</h1>
              <div className="flex gap-4">
                  <input
                    type="number"
                    value={vientoMaximo || ''} 
                    placeholder="Intensidad máxima de viento"
                    onChange={(e) => setVientoMaximo(e.target.value === '' ? null : Number(e.target.value))}
                    className="modal-agendar-input"
                    min="0"
                    max="300"
                  />

              </div>

              <h1 className='text-center'>Nivel UV máximo (Opcional)</h1>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={maxUV || ''} 
                  placeholder="Nivel UV máximo"
                  onChange={(e) => setMaxUV(e.target.value === '' ? null : Number(e.target.value))}
                  className="modal-agendar-input"
                  min="0"
                  max="20"
                />
              </div>

              <div className='flex gap-4'>
              <button
                className="modal-agendar-button modal-agendar-button-primary flex-1"
                onClick={async () => {
                  console.log("Intentando guardar preferencias para la actividad:", activityToEdit);

                  if (!activityToEdit || !activityToEdit.id) {
                    showNotification('error', 'Error: ID de actividad no encontrado. Por favor, cierra y vuelve a intentarlo.');
                    console.error("Error al guardar preferencias: el objeto activityToEdit es inválido.", activityToEdit);
                    return;
                  }

                  const parsedMinTemp = tempMinima === null || tempMinima === '' ? null : Number(tempMinima);
                  const parsedMaxTemp = tempMaxima === null || tempMaxima === '' ? null : Number(tempMaxima);
                  const parsedProbMaxLluvia = lluviaProbMaxima === null || lluviaProbMaxima === '' ? null : Number(lluviaProbMaxima);
                  const parsedMaxLluvia = lluviaMaxima === null || lluviaMaxima === '' ? null : Number(lluviaMaxima);
                  const parsedMaxViento = vientoMaximo === null || vientoMaximo === '' ? null : Number(vientoMaximo);
                  const parsedMaxUV = maxUV === null || maxUV === '' ? null : Number(maxUV);

                  if (parsedMinTemp !== null && parsedMaxTemp !== null && parsedMaxTemp < parsedMinTemp) {
                    showNotification('error', "Temperatura máxima no puede ser inferior a temperatura mínima");
                    return;
                  }
                  if (permiteLluvia && (parsedProbMaxLluvia === null || isNaN(parsedProbMaxLluvia) || parsedProbMaxLluvia < 0 || parsedMaxLluvia === null || isNaN(parsedMaxLluvia) || parsedMaxLluvia < 0 )) {
                    showNotification('error', "Valores de precipitación inválidos o incompletos");
                    return;
                  }
                  if (parsedMaxViento === null || isNaN(parsedMaxViento) || parsedMaxViento < 0) {
                    showNotification('error', "Valores de intensidad del viento inválida o incompleta");
                    return;
                  }
                  if (parsedMaxUV !== null && parsedMaxUV < 0) {
                    showNotification('error', "Índice UV no puede tomar valores negativos");
                    return;
                  }

                  if (activityToEdit) {
                    const url = `/api/preference/${usuario.id}/${activityToEdit.id}`;
                    const isUpdate = activityToEdit.preferences && Object.keys(activityToEdit.preferences).length > 0;
                    const method = isUpdate ? 'PUT' : 'POST';

                    const bodyData = {
                      min_temp: parsedMinTemp,
                      max_temp: parsedMaxTemp,
                      max_wind_speed: parsedMaxViento,
                      max_precipitation_probability: parsedProbMaxLluvia,
                      max_precipitation_intensity: parsedMaxLluvia,
                      requires_no_precipitation: !permiteLluvia,
                      max_uv: parsedMaxUV
                    };

                    try {
                      const token = sessionStorage.getItem('token');
                      const res = await fetch(url, {
                        method: method,
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(bodyData)
                      });
                      const contentType = res.headers.get('content-type');
                      if (!res.ok) {
                        let errorMsg = 'Error al guardar preferencias';
                        if (contentType && contentType.includes('application/json')) {
                          const errorData = await res.json();
                          errorMsg = errorData.error || errorMsg;
                        } else {
                          const errorText = await res.text();
                          console.error("Non-JSON error response:", errorText);
                          errorMsg = `Error del servidor: ${res.status}. Intenta de nuevo.`;
                        }
                        showNotification('error', errorMsg);
                        return;
                      }
                      const tempPrefs = {
                        tempMinima: parsedMinTemp,
                        tempMaxima: parsedMaxTemp,
                        permiteLluvia: permiteLluvia,
                        lluviaProbMaxima: parsedProbMaxLluvia,
                        lluviaMaxima: parsedMaxLluvia,
                        vientoMaximo: parsedMaxViento,
                        maxUV: parsedMaxUV
                      };
                      setPreferenciasClimaticasTemp(tempPrefs);

                      showNotification('success', `Preferencias ${isUpdate ? 'actualizadas' : 'guardadas'} correctamente`);
                      fetchUserActivities();

                      setShowEditPreferences(false);
                      setActivityToEdit(null);
                      if (vieneDeAgendar) {
                        setAgendarModalAbierto(true);
                        setVieneDeAgendar(false);
                      }
                    } catch (err) {
                      showNotification('error', err.message || 'Error de conexión');
                    }
                  }
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
        {agendarModalAbierto && (
            <div
              className="modal-overlay"
              onClick={() => {
                setAgendarModalAbierto(false);
                limpiarCamposDeAgenda();
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
                      className="modal-agendar-button C"
                      onClick={handleRegistrarAgenda}
                    >
                      Guardar
                    </button>
                    <button
                      className="modal-agendar-button modal-agendar-button-secondary"
                      onClick={() => {
                        setAgendarModalAbierto(false);
                        limpiarCamposDeAgenda(); 
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

        {usuario?.id && (
          <ActivityFormModal
            isOpen={showCreateActivityModal}
            onClose={() => setShowCreateActivityModal(false)}
            userId={usuario.id}
            activityToEdit={null}
            onSave={handleSaveNewActivity}
          />
        )}

        {showMainWeatherView ? (
          <>
            {!weatherData && !loading && !error && !showCalendar && !showActivities && !agendarModalAbierto && detectStatus === 'idle' && (
                <div className="welcome-message">
                  <h2>Consulta el clima de cualquier ciudad</h2>
                  <p>Intentando obtener tu ubicación actual o usa el buscador...</p>
                </div>
              )}
              {!weatherData && !loading && !currentCiudad && detectStatus === 'error' && initialLocationAttempted && (
                <div className="welcome-message">
                  <h2>No se pudo obtener tu ubicación automáticamente</h2>
                  <p>Por favor, usa el buscador para consultar el clima de una ciudad, o intenta detectar tu ubicación de nuevo.</p>
                  {detectError && <p className="text-red-500 mt-2">{detectError}</p>}
                </div>
              )}

            {weatherData && (
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
          </>
        ) : (
          <div className="calendar-main-view">
            <h2 className="title text-center mb-8">Mi Calendario de Actividades</h2>
            <div className="calendar-container grid grid-cols-1 md:grid-cols-2 gap-8">
              <Calendar
                onChange={(date) => {
                  setCalendarDate(date);
                  fetchDailyRecommendations(date);
                }}
                value={calendarDate}
                locale="es"
                className="react-calendar-custom mx-auto max-w-full"
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const hasScheduled = scheduledActivities.some(
                      activity => new Date(activity.fecha).toDateString() === date.toDateString()
                    );
                    const hasRecommendationForDay = activityRecommendations.some(
                      rec => new Date(rec.fecha).toDateString() === date.toDateString()
                    );
                    const hasActivity = hasScheduled || hasRecommendationForDay;
                    return hasActivity ? <div className="calendar-activity-dot" /> : null;
                  }
                }}
              />
              
              <div className="calendar-activities-container">
                <h3 className="calendar-selected-date">
                  {formatDate(calendarDate)}
                </h3>

                <div className="view-toggle-switch mb-4">
                  <div className="toggle-switch-container">
                    <button
                      className={`toggle-switch-button ${showScheduledActivitiesTab ? 'active' : ''}`}
                      onClick={() => setShowScheduledActivitiesTab(true)}
                    >
                      Agendadas
                    </button>
                    <button
                      className={`toggle-switch-button ${!showScheduledActivitiesTab ? 'active' : ''}`}
                      onClick={() => setShowScheduledActivitiesTab(false)}
                    >
                      Recomendadas
                    </button>
                  </div>
                </div>
                
              {showScheduledActivitiesTab ? (
                <>
                  {/* Este bloque mostrará directamente la evaluación de actividades para el día */}
                  <div className="activityRecommendationsSection mt-8">
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
                                <h4>{rec.activity_name}</h4>
                                <span className="recommendationDate">
                                  {(() => {
                                    try {
                                      let fechaStr;
                                      if (typeof rec.fecha === 'string') {
                                        fechaStr = rec.fecha.split('T')[0];
                                      } else if (rec.fecha && typeof rec.fecha.toISOString === 'function') {
                                        fechaStr = rec.fecha.toISOString().split('T')[0];
                                      } else {
                                        console.error("Unrecognized rec.fecha format:", rec.fecha);
                                        return "Fecha desconocida";
                                      }

                                      if (!rec.hora_inicio || typeof rec.hora_inicio !== 'string') {
                                        console.error("Unrecognized or missing rec.hora_inicio format:", rec.hora_inicio);
                                        return "Hora desconocida";
                                      }

                                      const [year, month, day] = fechaStr.split('-');
                                      const [hours, minutes] = rec.hora_inicio.split(':');

                                      if ([year, month, day, hours, minutes].some(val => isNaN(parseInt(val)))) {
                                          console.error("Invalid date/time component:", {year, month, day, hours, minutes});
                                          return "Invalid date/time components";
                                      }

                                      const activityDateTime = new Date(
                                        parseInt(year),
                                        parseInt(month) - 1,
                                        parseInt(day),
                                        parseInt(hours),
                                        parseInt(minutes)
                                      );
                                      
                                      console.log("Parsed activityDateTime:", activityDateTime);

                                      if (isNaN(activityDateTime.getTime())) {
                                        console.error("activityDateTime resulted in Invalid Date. Components:", {year, month, day, hours, minutes});
                                        return "Invalid date (construction)";
                                      }

                                      return activityDateTime.toLocaleString('es-ES', {
                                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                      });

                                    } catch (e) {
                                      console.error("Error formatting date for recommendation:", e, "Original data:", {fecha: rec.fecha, hora: rec.hora_inicio});
                                      return "Date error";
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
                </>
                ) : (

                  <div className="daily-recommendations-list">
                    {loadingDailyRecs ? (
                      <p>Buscando recomendaciones para este día...</p>
                    ) : dailyRecommendations.length > 0 ? (
                      dailyRecommendations.map(activity => (
                        <div key={activity.id} className="activity-card suitable">
                          <div className="activity-content">
                            <h4>{activity.name}</h4>
                            {activity.description && (
                              <p className="activity-description">{activity.description}</p>
                            )}
                            <div className="recommendationStatus mt-2 suitable">
                              <FiThumbsUp className="statusIcon suitableIcon" />
                              <span>{activity.weather_summary}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-activities">
                        <p>No hay actividades recomendadas para las condiciones climáticas de este día.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
