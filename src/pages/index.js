import { useState } from "react";
import "@/styles/login.css";
import { useRouter } from "next/router";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    async function handleLogin(){
        //pass
    }
    return(
        <div className="login-container">
            <div className="welcome-text">
                <h1>Bienvenido</h1>
            </div>
            <input
                className="input-field"
                type="text"
                placeholder="email@dominio.com"
              />
            <input
                className="input-field"
                type="contraseña"
                placeholder="contraseña"
              />
            <button className="next-button" onClick={handleLogin}>
                Siguiente
            </button>
        </div>
    );
}