// src/pages/mi-vista.js
import { useEffect, useState } from 'react';

export default function MiVista() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/get-prueba-data'); // Llama a la API route
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); 

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Datos desde /pages (via API Route y Client Fetching):</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}