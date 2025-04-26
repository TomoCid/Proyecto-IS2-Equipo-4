import { useState } from "react";
import "@/styles/editWeather.css";
export default function EditWeather() {
  const [temperature, setTemperature] = useState("30");
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
              <select style={{ color: "black", backgroundColor: "white" }}>
                <option value="Soleado">Soleado</option>
                <option value="Parcialmente Nublado">Parcialmente Nublado</option>
                <option value="Nublado">Nublado</option>
                <option value="Lluvioso">Lluvioso</option>
              </select>
            </div>

            <div className="right-label">
              <p>Temperatura</p>
            </div>
            <div className="right">
              <input
                type="number"
                style={{ height: 40, padding: 5, color: "black", backgroundColor: "white" }}
                placeholder="22°"
                onChange={(e) => setTemperature(e.target.value)}
                value={temperature}
              />
            </div>
          </div>
          <button className="next-button">Siguiente</button>
        </div>
    );
  }