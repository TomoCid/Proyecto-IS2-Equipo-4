import { useState, useEffect } from 'react';
import { FaSmile } from 'react-icons/fa';  // Icono de sonrisa

/**
 * Dashboard es el componente principal que muestra la información de usuario,
 * el clima actual y las actividades en la agenda del usuario. Realiza llamadas 
 * a varias APIs para obtener los datos necesarios.
 */
const Dashboard = () => {
  const [user, setUser] = useState({});
  const [agenda, setAgenda] = useState([]);
  const [clima, setClima] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = 1;  // Asumimos un userId estático para esta prueba.

  useEffect(() => {
    /**
     * Función asincrónica que obtiene los datos necesarios para mostrar
     * en el Dashboard: usuario, agenda y clima.
     */
    const obtenerDatosDashboard = async () => {
      try {
        setLoading(true); // Inicia el estado de carga

        // Comentamos la obtención de datos desde la API por ahora

        // Obtener datos del usuario
        // const userResponse = await fetch(`/api/users/usuario.controller?userId=${userId}`);
        // if (!userResponse.ok) {
        //   throw new Error(`Error al obtener usuario: ${userResponse.statusText}`);
        // }
        // const userData = await userResponse.json();
        const userData = {
          username: "Juan Pérez",
          email: "juan.perez@correo.com"
        };  // Datos manuales de usuario
        setUser(userData);

        // Obtener la agenda
        // const agendaResponse = await fetch(`/api/agenda?userId=${userId}`);
        // if (!agendaResponse.ok) {
        //   throw new Error(`Error al obtener agenda: ${agendaResponse.statusText}`);
        // }
        // const agendaData = await agendaResponse.json();
        const agendaData = [
          { id: 1, actividad_nombre: 'Correr al aire libre', fecha: '2025-04-25', hora_inicio: '08:00', hora_fin: '09:00' },
          { id: 2, actividad_nombre: 'Ir al gimnasio', fecha: '2025-04-25', hora_inicio: '10:00', hora_fin: '11:00' },
          { id: 3, actividad_nombre: 'Leer en el parque', fecha: '2025-04-25', hora_inicio: '12:00', hora_fin: '13:00' }
        ];  // Datos manuales de agenda
        setAgenda(agendaData);

        // Obtener el clima
        // const ciudad = "Concepcion,cl";  // Usamos una ciudad de prueba
        // const climaResponse = await fetch(`/api/clima?ciudad=${ciudad}`);
        // if (!climaResponse.ok) {
        //   throw new Error(`Error al obtener clima: ${climaResponse.statusText}`);
        // }
        // const climaData = await climaResponse.json();
        const climaData = {
          name: "Concepción",
          main: { temp: 20 },
          weather: [{ description: 'Despejado' }]
        };  // Datos manuales de clima
        setClima(climaData);

        setError(null); // Limpiar el error si todo sale bien
      } catch (err) {
        setError(err.message); // Establece el error si ocurre alguno
        setUser({});
        setAgenda([]);
        setClima({});
      } finally {
        setLoading(false); // Finaliza el estado de carga
      }
    };

    obtenerDatosDashboard();
  }, [userId]);  // El useEffect se ejecutará cuando el userId cambie.

  // Si los datos están cargando, mostrar el estado de carga.
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <span className="text-2xl text-blue-600">Cargando...</span>
    </div>
  );

  // Si ocurre un error, mostrar el mensaje de error.
  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-red-100">
      <span className="text-2xl text-red-600">Error: {error}</span>
    </div>
  );

  // Función para verificar si la actividad puede realizarse con el clima actual
  const isActivitySuitableForWeather = (activity) => {
    if (activity === "Correr al aire libre" || activity === "Leer en el parque") {
      return clima.main.temp > 15; // Actividades al aire libre solo si hace más de 15°C
    }
    return true; // Otras actividades son siempre adecuadas
  };

  return (
    <div className="bg-gradient-to-r from-indigo-100 via-blue-100 to-indigo-200 min-h-screen py-10">
      <div className="container mx-auto p-8 bg-white rounded-lg shadow-xl max-w-4xl">
        
        {/* 
          Sección de Bienvenida:
          Muestra el nombre de usuario y el correo del usuario.
        */}
        <div className="text-center p-6">
          <h2 className="text-3xl font-semibold text-indigo-700 mb-2">
            <FaSmile className="inline-block mr-2 text-2xl text-yellow-400" />
            Bienvenido, {user.username}!
          </h2>
          <p className="text-sm text-gray-600 font-bold italic">{user.email}</p>
        </div>

        {/* 
          Sección de Clima:
          Muestra la información del clima actual para una ciudad especificada.
        */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-indigo-800 mb-4">
            Clima en {clima.name || 'tu ciudad'}
          </h2>
          <div className="text-lg text-gray-700">
            {clima.main?.temp ? (
              <>
                <p className="font-medium text-5xl">{clima.main.temp}°C</p>
                <p className="text-sm text-gray-500">{clima.weather?.[0]?.description}</p>
              </>
            ) : (
              <p className="text-gray-500">Cargando clima...</p>
            )}
          </div>
        </div>

        {/* 
          Sección de Actividades:
          Muestra las actividades de la agenda del usuario.
        */}
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
