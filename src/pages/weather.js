import WeatherDisplay from '@/components/WeatherDisplay/WeatherDisplay'; 
import Head from 'next/head';

export default function WeatherPage() {
    const city = "Concepcion, Bio-Bio"; 

    return (
        <>
            <Head>
                <title>Clima en {city}</title>
            </Head>
            <div>
                <h1>Pronóstico del Tiempo</h1>
                <WeatherDisplay ciudad={city} />
            </div>
        </>
    );
}