import { useState } from "react";
import { useRouter } from "next/router";

import "@/styles/editWeather.css";

export default function EditWeather() {
  const router = useRouter();
  const [temperature, setTemperature] = useState("");
  const [selectedWeather, setSelectedWeather] = useState("Soleado");
  function handleBackButton() {
    router.push("/activities/edit");
  }
  function handleNextButton(){
    localStorage.setItem("selectedWeather", selectedWeather);
    localStorage.setItem("temperature", temperature);
    console.log("Temperatura y clima guardados: "+ selectedWeather +" " + temperature + "°")
    router.push("/dashboard");
  }
    return (
      <div className="weather-container">
          <div className="weather-page">
          
            <div className="title">
              
              <header>
                <h1>Ingrese el clima de su localidad</h1>
              </header>
            </div>

            <div className="left-label">
              <p>Estado del tiempo</p>
            </div>
            <div className="left">
              <select 
              style={{ color: "black", backgroundColor: "white"}}
                value={selectedWeather}
                onChange={(e) => setSelectedWeather(e.target.value)}
              >
                <option value="Soleado">☀️ Soleado</option>
                <option value="Parcialmente Nublado">⛅ Parcialmente Nublado</option>
                <option value="Nublado">☁️ Nublado</option>
                <option value="Neblina">🌫️ Neblina</option>
                <option value="Lluvioso">🌧️ Lluvioso</option>
                <option value="Tormenta">⛈️ Tormenta</option>
                <option value="Granizo">🌨️ Granizo</option>
                <option value="Nieve">❄️ Nieve</option>
              </select>
            </div>

            <div className="right-label">
              <p>Temperatura</p>
            </div>
            <div className="right">
            <input
              className="temperature-input"
              type="text"
              inputMode="numeric"
              placeholder="22°"
              value={temperature}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/[^\d]/g, "");
                setTemperature(rawValue);
              }}
              onBlur={(e) => {
                if (temperature && !temperature.includes("°")) {
                  setTemperature(temperature + "°");
                }
              }}
            />
          </div>
          </div>
          <button className="next-button" onClick={handleNextButton}>Siguiente</button>
          <button className="back-button" onClick={handleBackButton}>←</button>
        </div>
    );
  }
