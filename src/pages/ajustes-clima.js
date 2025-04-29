import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

import "../styles/ajustesClima.css";

export default function AjustesClima() {
  const router = useRouter();
  const [temperature, setTemperature] = useState("22°");
  const [selectedWeather, setSelectedWeather] = useState("Soleado");

  const [initialTemperature, setInitialTemperature] = useState("22°");
  const [initialWeather, setInitialWeather] = useState("Soleado");

  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWeather = localStorage.getItem("selectedWeather");
      const savedTemperature = localStorage.getItem("temperature");

      if (savedWeather) {
        setSelectedWeather(savedWeather);
        setInitialWeather(savedWeather);
      }
      if (savedTemperature) {
        setTemperature(savedTemperature);
        setInitialTemperature(savedTemperature);
      }
    }
  }, []);

  function handleSaveButton() {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedWeather", selectedWeather);
      localStorage.setItem("temperature", temperature);
    }
  
    setShowModal(false);
  
    router.reload();

  }
  
  function handleResetButton() {
    setSelectedWeather(initialWeather);
    setTemperature(initialTemperature);
  }

  function closeModal() {
    setShowModal(false);
  }

  if (!showModal) return null;

  return (
    <div
      className={`${montserrat.className} wrapper`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "none",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
      }}
    >
      {/* Fondo difuminado */}
      <div className="background-blur" />

      <div className="modalContent">
        <button className="closeButton" onClick={closeModal}>
          ✖
        </button>
        <h3 className="modalTitle">Ajustes de Clima</h3>
        <div className="weatherContainer">
          <div className="weatherPage">
            <div className="rightLabel">
              <p>Temperatura</p>
            </div>
            <div className="right">
              <input
                className="temperatureInput"
                type="text"
                inputMode="numeric"
                placeholder="22°"
                value={temperature}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^\d]/g, "");
                  setTemperature(rawValue);
                }}
                onBlur={() => {
                  if (temperature && !temperature.includes("°")) {
                    setTemperature(temperature + "°");
                  }
                }}
              />
            </div>

            <div className="leftLabel">
              <p>Estado del tiempo</p>
            </div>
            <div className="left">
              <select
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
          </div>
        </div>

        <div className="buttonContainer">
          <button className="nextButton" onClick={handleSaveButton}>
            Guardar
          </button>
          <button className="backButton" onClick={handleResetButton}>
            Reestablecer
          </button>
        </div>
      </div>
    </div>
  );
}
