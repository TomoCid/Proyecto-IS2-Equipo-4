import { useState, useEffect } from 'react';
import styles from 'src/styles/WeatherDisplay.module.css';

// Helper para formatear la fecha completa usando epoch y timeZone
const formatDateFull = (epochTime, timeZone, lang = 'es-CL') => {
    if (!epochTime || !timeZone) return "Fecha no disponible";
    const date = new Date(epochTime * 1000);
    return date.toLocaleDateString(lang, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timeZone,
    });
};

// Helper para obtener solo la hora HH:MM usando epoch y timeZone
const formatTimeShort = (epochTime, timeZone, lang = 'es-CL') => {
    if (!epochTime || !timeZone) return "--:--";
    const date = new Date(epochTime * 1000);
    return date.toLocaleTimeString(lang, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timeZone,
    });
};

// Helper para obtener el nombre del día usando epoch y timeZone
const getDayName = (epochTime, timeZone, lang = 'es-CL') => {
    if (!epochTime || !timeZone) return "Día no disponible";
    const date = new Date(epochTime * 1000);
    return date.toLocaleDateString(lang, {
        weekday: 'long',
        timeZone: timeZone,
    });
};

const SearchIconSVG = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18" 
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.searchIconSvg} 
    >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);


export default function WeatherDisplay({ ciudad: initialCiudad }) {
    const [currentCiudad, setCurrentCiudad] = useState(initialCiudad);
    const [inputCiudad, setInputCiudad] = useState(initialCiudad || '');
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('hourly');

    useEffect(() => {
        if (!currentCiudad) {
            setLoading(false);
            return;
        }

        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/weather/${encodeURIComponent(currentCiudad)}?lang=es&days=7`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error ${response.status} al buscar ${currentCiudad}`);
                }
                const data = await response.json();
                setWeatherData(data);
            } catch (err) {
                console.error("Error fetching weather data:", err);
                setError(err.message || `No se pudieron cargar los datos del clima para ${currentCiudad}.`);
                setWeatherData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [currentCiudad]);

    const handleCityChange = (event) => {
        setInputCiudad(event.target.value);
    };

    const handleCitySubmit = (event) => {
        event.preventDefault();
        if (inputCiudad.trim() === "") {
            setError("Por favor, ingresa un nombre de ciudad.");
            return;
        }
        if (inputCiudad.trim() !== currentCiudad) {
            setCurrentCiudad(inputCiudad.trim());
        }
    };
    
    let mainContent;
    if (!currentCiudad && !loading && !error) {
        mainContent = <p className={styles.message}>Ingresa una ciudad para ver el pronóstico.</p>;
    } else if (loading) {
        mainContent = <p className={styles.message}>Cargando datos del clima para {currentCiudad}...</p>;
    } else if (error) {
        mainContent = <p className={styles.errorMessage}>Error: {error}</p>;
    } else if (!weatherData || !weatherData.location || !weatherData.current || !weatherData.forecast) {
        mainContent = <p className={styles.message}>No hay datos de clima disponibles para {currentCiudad}. Intenta con otra ciudad.</p>;
    } else {
        const { current, location, forecast } = weatherData;
        const todayForecast = forecast.forecastday[0];
        const todayEpochStartAtLocation = todayForecast.date_epoch;
        const currentHourInLocation = new Date(location.localtime_epoch * 1000).getHours();
        const hourlyForecastsToShow = todayForecast.hour
            .filter(hourData => {
                const hourString = hourData.time.split(' ')[1];
                const forecastHour = parseInt(hourString.split(':')[0]);
                return forecastHour >= currentHourInLocation;
            })
            .slice(0, 8);

        mainContent = (
            <div className={styles.weatherMainLayout}>
                <div className={styles.currentWeather}>
                    {/* ... contenido del clima actual ... */}
                    <div className={styles.location}>
                        <span className={styles.pinIcon}>📍</span>
                        {location.name}, {location.region}
                    </div>
                    <div className={styles.date}>{formatDateFull(location.localtime_epoch, location.tz_id)}</div>
                    <img
                        src={current.condition.icon.startsWith('//') ? `https:${current.condition.icon}` : current.condition.icon}
                        alt={current.condition.text}
                        className={styles.weatherIconLarge}
                    />
                    <div className={styles.temperature}>
                        {Math.round(current.temp_c)}<span className={styles.degree}>°C</span>
                    </div>
                    <div className={styles.conditionText}>{current.condition.text}</div>
                </div>

                <div className={styles.forecastSection}>
                    <form onSubmit={handleCitySubmit} className={styles.citySearchForm}>
                        <div className={styles.searchInputWrapper}>
                            <span className={styles.searchIconSpan}> {/* Cambiado de searchIcon a searchIconSpan */}
                                <SearchIconSVG /> {/* Usamos el componente SVG */}
                            </span>
                            <input
                                type="text"
                                value={inputCiudad}
                                onChange={handleCityChange}
                                placeholder="Ciudad..."
                                className={styles.cityInput}
                            />
                        </div>
                        <button type="submit" className={styles.searchButton}>Buscar</button>
                    </form>
                    {/* ... resto de la sección de pronóstico ... */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'daily' ? styles.active : ''}`}
                            onClick={() => setActiveTab('daily')}
                        >
                            Próximos 7 días
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'hourly' ? styles.active : ''}`}
                            onClick={() => setActiveTab('hourly')}
                        >
                            Hoy (por horas)
                        </button>
                    </div>

                    {activeTab === 'hourly' && todayForecast && (
                        <div className={styles.hourlyForecast}>
                            {hourlyForecastsToShow.length > 0 ? hourlyForecastsToShow.map((hourData) => (
                                <div key={hourData.time_epoch} className={styles.hourCard}>
                                    <div className={styles.hourTime}>{formatTimeShort(hourData.time_epoch, location.tz_id)}</div>
                                    <img
                                        src={hourData.condition.icon.startsWith('//') ? `https:${hourData.condition.icon}` : hourData.condition.icon}
                                        alt={hourData.condition.text}
                                        className={styles.weatherIconSmall}
                                    />
                                    <div className={styles.hourTemp}>{Math.round(hourData.temp_c)}°C</div>
                                    <div className={styles.precipitation}>{hourData.chance_of_rain}%</div>
                                </div>
                            )) : <p className={styles.messageNoMoreForecasts}>No hay más pronósticos por hora para hoy.</p>}
                        </div>
                    )}

                    {activeTab === 'daily' && forecast && (
                        <div className={styles.dailyForecast}>
                            {forecast.forecastday.map((dayData) => {
                                const isToday = dayData.date_epoch === todayEpochStartAtLocation;
                                return (
                                    <div key={dayData.date_epoch} className={styles.dayCard}>
                                        <div className={styles.dayName}>{isToday ? 'Hoy' : getDayName(dayData.date_epoch, location.tz_id)}</div>
                                        <img
                                            src={dayData.day.condition.icon.startsWith('//') ? `https:${dayData.day.condition.icon}` : dayData.day.condition.icon}
                                            alt={dayData.day.condition.text}
                                            className={styles.weatherIconMedium}
                                        />
                                        <div className={styles.dayTemp}>
                                            {Math.round(dayData.day.maxtemp_c)}° / {Math.round(dayData.day.mintemp_c)}°
                                        </div>
                                        <div className={styles.dayCondition}>{dayData.day.condition.text}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }


    return (
        <div className={styles.weatherContainer}>
            {mainContent}
        </div>
    );
}