import { useState, useEffect } from 'react';
import { FaSmile } from 'react-icons/fa';

const Dashboard = () => {
  const [user, setUser] = useState({});
  const [agenda, setAgenda] = useState([]);
  const [clima, setClima] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = 1;

  useEffect(() => {
    const obtenerDatosDashboard = async () => {
      try {
        setLoading(true);

        // Cargar usuario
        const userData = {
          username: "Juan Pérez",
          email: "juan.perez@correo.com"
        };
        setUser(userData);

        // Cargar agenda
        const agendaData = [
          { id: 1, actividad_nombre: 'Correr al aire libre', fecha: '2025-04-25', hora_inicio: '08:00', hora_fin: '09:00' },
          { id: 2, actividad_nombre: 'Ir al gimnasio', fecha: '2025-04-25', hora_inicio: '10:00', hora_fin: '11:00' },
          { id: 3, actividad_nombre: 'Leer en el parque', fecha: '2025-04-25', hora_inicio: '12:00', hora_fin: '13:00' }
        ];
        setAgenda(agendaData);

        // Cargar clima desde localStorage
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
  }, [userId]);

  const getWeatherIcon = (description) => {
    switch (description) {
      case "Soleado":
        return "☀️";
      case "Parcialmente Nublado":
        return "⛅";
      case "Nublado":
        return "☁️";
      case "Neblina":
        return "🌫️";
      case "Lluvioso":
        return "🌧️";
      case "Tormenta":
        return "⛈️";
      case "Granizo":
        return "🌨️";
      case "Nieve":
        return "❄️";
      default:
        return "🌈";
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <span className="text-2xl text-blue-600">Cargando...</span>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-red-100">
      <span className="text-2xl text-red-600">Error: {error}</span>
    </div>
  );

  const isActivitySuitableForWeather = (activity) => {
    if (activity === "Correr al aire libre" || activity === "Leer en el parque") {
      return clima.main.temp > 15;
    }
    return true;
  };

  return (
    <div className="bg-gradient-to-r from-indigo-100 via-blue-100 to-indigo-200 min-h-screen py-10">
      <div className="container mx-auto p-8 bg-white rounded-lg shadow-xl max-w-4xl">

        {/* Bienvenida */}
        <div className="text-center p-6">
          <h2 className="text-3xl font-semibold text-indigo-700 mb-2">
            <FaSmile className="inline-block mr-2 text-2xl text-yellow-400" />
            Bienvenido, {user.username}!
          </h2>
          <p className="text-sm text-gray-600 font-bold italic">{user.email}</p>
        </div>

        {/* Clima */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-indigo-800 mb-4">
            Clima en {clima.name}
          </h2>
          <div className="text-lg text-gray-700">
            {clima.main?.temp !== undefined ? (
              <>
                <p className="font-medium text-5xl">{clima.main.temp}°C</p>
                <p className="text-2xl">
                  {getWeatherIcon(clima.weather?.[0]?.description)} {clima.weather?.[0]?.description}
                </p>
              </>
            ) : (
              <p className="text-gray-500">Cargando clima...</p>
            )}
          </div>
        </div>

        {/* Agenda */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Actividades de tu Agenda</h3>
          <div className="space-y-6">
            {agenda.length > 0 ? (
              agenda.map((entry) => (
                <div key={entry.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out">
                  <div className="font-medium text-lg text-indigo-600">{entry.actividad_nombre}</div>
                  <div className="text-sm text-gray-600">{entry.fecha}</div>
                  <div className="text-sm text-gray-600">{entry.hora_inicio} - {entry.hora_fin}</div>
                  <p className={`text-sm ${isActivitySuitableForWeather(entry.actividad_nombre) ? 'text-green-600' : 'text-red-600'}`}>
                    {isActivitySuitableForWeather(entry.actividad_nombre)
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
    </div>
  );
};

export default Dashboard;
