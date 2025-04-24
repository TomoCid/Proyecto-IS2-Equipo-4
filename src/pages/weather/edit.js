export default function EditWeather() {
    return (
      
      <div>
        <h1>Ingrese el clima de su localidad</h1>
        <p>Estado del tiempo</p>
        <select style={{color: "black", backgroundColor: "white"}}>
          <option value="Soleado">Soleado</option>
          <option value="Parcialmente Nublado">Parcialmente Nublado</option>
          <option value="Nublado">Nublado</option>
          <option value="Lluvioso">Lluvioso</option>
        </select>
      </div>
    );
  }