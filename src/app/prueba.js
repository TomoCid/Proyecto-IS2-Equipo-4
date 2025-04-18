import { getData } from './actions';



export default async function Home() {
  const data = await getData();

  if (!data) {
    return <div>No se pudieron cargar los datos.</div>;
  }

  const renderLista = () => (
    <ul>
      {}
      {data.map((item) => (
        <li key={item.id}>
          ID: {item.id} - Nombre: {item.name}
          {}
        </li>
      ))}
    </ul>
  );

  const renderDetalle = () => (
    <div>
      <p>User ID: {data.userId}</p>
      <p>Email: {data.email}</p>
      <p>Nombre: {data.profile?.firstName}</p> {}
    </div>
  );

  const renderValorSimple = () => (
      <p>El valor obtenido es: {data}</p>
  );

  return (
    <div>
      <h1>Datos Obtenidos:</h1>

      {}
      {Array.isArray(data) ? renderLista() : renderDetalle()}
      {}
      {}
    </div>
  );
}