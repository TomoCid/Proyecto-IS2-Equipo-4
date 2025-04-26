import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [agenda, setAgenda] = useState([]);
  const [clima, setClima] = useState({});
  const [recordatorios, setRecordatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  const userId = 1;

  useEffect(() => {
    const obtenerDatosDashboard = async () => {
      try {
        // Obtener los datos del usuario (username y email)
        const userResponse = await axios.get(`/api/users/${userId}`);
        setUser(userResponse.data); // Almacena el usuario

        // Obtener la agenda con clima asociado
        const agendaResponse = await axios.get(`/api/agenda?userId=${userId}`);
        setAgenda(agendaResponse.data);

        // Obtener el clima basado en la ciudad
        const ciudad = "Concepcion,cl";
        const climaResponse = await axios.get(`/api/clima`, { params: { ciudad } });
        setClima(climaResponse.data);

        // Obtener recordatorios pendientes
        const recordatoriosResponse = await axios.get(`/api/recordatorios?userId=${userId}`);
        setRecordatorios(recordatoriosResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
        setLoading(false);
      }
    };

    obtenerDatosDashboard();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <span className="text-2xl text-blue-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-100 via-blue-100 to-indigo-200 min-h-screen py-10">
      <div className="container mx-auto p-8 bg-white rounded-lg shadow-lg">
        {/* Username y correo en la esquina superior izquierda */}
        <div className="flex flex-col items-start mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Bienvenido, {user.username}!</h2>
          <p className="text-sm text-gray-600 font-bold italic">{user.email}</p> {/* Correo en negrita y cursiva */}
        </div>

        {/* Clima en el centro de la pantalla */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-indigo-700 mb-2">Clima en tu ciudad</h2>
          <div className="text-lg text-gray-700">
            {clima.main?.temp ? (
              <>
                <p className="font-medium">{clima.main.temp}°C</p>
                <p className="text-sm text-gray-500">{clima.weather?.[0]?.description}</p>
              </>
            ) : (
              <p className="text-gray-500">Cargando clima...</p>
            )}
          </div>
        </div>

        {/* Sección de Actividades */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Actividades de tu Agenda</h3>
          <div className="space-y-6">
            {agenda.length > 0 ? (
              agenda.map((entry) => (
                <div key={entry.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out">
                  <div className="font-medium text-lg text-indigo-600">{entry.actividad_nombre}</div>
                  <div className="text-sm text-gray-600">{entry.fecha}</div>
                  <div className="text-sm text-gray-600">{entry.hora_inicio} - {entry.hora_fin}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No tienes actividades en tu agenda.</p>
            )}
          </div>
        </div>

        {/* Sección de Recordatorios */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Recordatorios Pendientes</h3>
          <div className="space-y-6">
            {recordatorios.length > 0 ? (
              recordatorios.map((reminder) => (
                <div key={reminder.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out">
                  <div className="font-medium text-lg text-green-600">{reminder.descripcion}</div>
                  <div className="text-sm text-gray-600">Fecha: {reminder.fecha}</div>
                  <div className="text-sm text-gray-600">Hora: {reminder.hora}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No tienes recordatorios pendientes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
