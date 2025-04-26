import { useState } from "react";
import "@/styles/login.css";

export default function Login() {
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
            <button className="next-button">
                Siguiente
            </button>
        </div>
    );
}