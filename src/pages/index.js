import { useState } from "react";
import styles from "@/styles/login.module.css";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";
import { toast } from "react-toastify";
import { ToastContainer } from 'react-toastify';

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    async function handleLogin(){
        if (!email || !password) {
            toast.error("Por favor, completa todos los campos.");
            return;
          }
    }
    async function handleRegisterLink(){
        router.push("/signup");
    }
    return(
        <div className={`${montserrat.className} ${styles.wrapper}`}>
            <div className={styles.loginContainer}>
                <div className={styles.welcomeText}>
                    <h1>Bienvenido</h1>
                </div>
                <input
                    className={styles.inputField}
                    type="text"
                    placeholder="email@dominio.com"
                />
                <input
                    className={styles.inputField}
                    type="contraseña"
                    placeholder="contraseña"
                />
                <button className={styles.nextButton} onClick={handleLogin}>
                    Siguiente
                </button>
                <p className={styles.registerText}>
                ¿No tienes una cuenta?{" "}
                <span 
                    className={styles.registerLink}
                    onClick={handleRegisterLink}
                >
                Regístrate ahora
                </span>
                </p>
                <ToastContainer 
                    position="top-right"
                    autoClose={1500}
                    hideProgressBar={false}
                    closeOnClick
                    pauseOnHover
                    draggable
                    theme="light"
                />
            </div>
        </div>
    );
}