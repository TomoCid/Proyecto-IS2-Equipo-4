import React from "react";

function CrearAgenda() {
  async function probarCrearAgenda() {
    const entryData = {
      userId: 1,
      activityId: 2,
      periodicidad: 1,
      fecha: "2025-05-23",
      horaInicio: "10:00:00",
      horaFin: "11:00:00",
      notes: "Clase de yoga",
      latitude: -34.6037,
      longitude: -58.3816,
      reminderEnabled: true,
      reminderOffsetMinutes: 15
    };

    const res = await fetch('/api/agenda/agenda.controller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData)
    });
    const data = await res.json();
    console.log(data);
    alert(data.success ? "Entrada creada correctamente" : "Error: " + data.error);
  }

  return (
    <div>
      <button onClick={probarCrearAgenda}>Crear entrada de agenda</button>
    </div>
  );
}

export default CrearAgenda;