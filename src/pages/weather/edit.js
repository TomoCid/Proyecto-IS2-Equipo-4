import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

import styles from "@/styles/editWeather.module.css";

export default function EditWeather() {
  const router = useRouter();
  const [temperature, setTemperature] = useState("22°");
  const [selectedWeather, setSelectedWeather] = useState("Soleado");
  const [activities, setActivities] = useState(null);
  useEffect(() => {
    const savedActivities = localStorage.getItem("selectedActivities");
    if (savedActivities) {
      const parsedActivities = JSON.parse(savedActivities);
      setActivities(parsedActivities);
    }
  }, []);

  useEffect(() => {
    // puedes obtener todas las actividades cargada asi:
    console.log("Actividades cargadas:", activities);
    // o una en especifico asi:
    console.log("Ciclismo:", activities?.ciclismo);
  }, [activities]);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedWeather", selectedWeather);
      localStorage.setItem("temperature", temperature);
      console.log("Temperatura y clima guardados:", selectedWeather, temperature);
    }
  }, [selectedWeather, temperature]);

  function handleBackButton() {
    router.push("/activities/edit");
  }

  function handleNextButton() {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedWeather", selectedWeather);
      localStorage.setItem("temperature", temperature);
      console.log("Temperatura y clima guardados: " + selectedWeather + " " + temperature + "°");
    }
    router.push("/dashboard");
  }

  return (
    <div className={`${montserrat.className} ${styles.wrapper}`}>
      <div className={styles.weatherContainer}>
        <div className={styles.weatherPage}>
          <div className={styles.title}>
            <header>
              <h1>Ingrese el clima de su localidad</h1>
            </header>
          </div>

          <div className={styles.leftLabel}>
            <p>Estado del tiempo</p>
          </div>
          <div className={styles.left}>
            <select
              style={{ color: "black", backgroundColor: "white" }}
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

          <div className={styles.rightLabel}>
            <p>Temperatura</p>
          </div>
          <div className={styles.right}>
            <input
              className={styles.temperatureInput}
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
        <button className={styles.nextButton} onClick={handleNextButton}>Siguiente</button>
        <button className={styles.backButton} onClick={handleBackButton}>←</button>
      </div>
    </div>
  );
}