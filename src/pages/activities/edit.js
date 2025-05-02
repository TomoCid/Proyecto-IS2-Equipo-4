import styles from "@/styles/editActivities.module.css";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";
import { useState } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function EditActivities() {
  const router = useRouter();
  const [selectedActivities, setSelectedActivities] = useState({
    yoga: false,
    ciclismo: false,
    trekking: false,
    futbol: false,
    trote: false,
  });

  function handleCheckboxChange(event){
    const { id, checked } = event.target;
    setSelectedActivities(prev => ({
      ...prev,
      [id]: checked,
    }));
  }

  function handleNextButton() {
    localStorage.setItem("selectedActivities", JSON.stringify(selectedActivities));
    console.log(selectedActivities)
    router.push("/weather/edit");
  }

  return (
    <div className={`${montserrat.className} ${styles.wrapper}`}>
      <div className={styles.activitiesContainer}>
        <h1 className={styles.title}>Seleccione actividades de su preferencia</h1>

        <div className={styles.activityItem}>
          <div className={styles.activityName}>Yoga</div>
          <input type="checkbox" id="yoga" className={styles.checkbox} onChange={handleCheckboxChange}/>
        </div>

        <div className={styles.activityItem}>
          <div className={styles.activityName}>Ciclismo</div>
          <input type="checkbox" id="ciclismo" className={styles.checkbox}  onChange={handleCheckboxChange}/>
        </div>

        <div className={styles.activityItem}>
          <div className={styles.activityName}>Trekking</div>
          <input type="checkbox" id="trekking" className={styles.checkbox}  onChange={handleCheckboxChange}/>
        </div>

        <div className={styles.activityItem}>
          <div className={styles.activityName}>Fútbol</div>
          <input type="checkbox" id="futbol" className={styles.checkbox}  onChange={handleCheckboxChange}/>
        </div>

        <div className={styles.activityItem}>
          <div className={styles.activityName}>Trote</div>
          <input type="checkbox" id="trote" className={styles.checkbox}  onChange={handleCheckboxChange}/>
        </div>
      </div>

      <button className={styles.nextButton} onClick={handleNextButton}  onChange={handleCheckboxChange}>
        Siguiente
      </button>
    </div>
  );
}