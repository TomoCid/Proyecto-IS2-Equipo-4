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

  // la mejor alternativa sería mandarle un correo al email asociado para verificar su existencia
  // dado que no podemos hacer eso, dejo esto por ahora.
  function EmailIsValid(mail){
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
    if (emailRegex.test(mail)) {
        return(true)
    }
    return (false)
}

  export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const router = useRouter();
    async function handleSignup(){
        if(!EmailIsValid(email)){
            toast.error("Email inválido");
            return;
        }
        if(username.length < 1){
            toast.error("Debe ingresar un nombre de usuario");
            return;
        }
        if(password.length < 8){
            toast.error("Contraseña debe tener al menos 8 caracteres.");
            return;
        }
        toast.success("Cuenta creada exitosamente");
        setTimeout(() => {
            router.push("/");
        }, 2100);
    }
    return(
        <div className={`${montserrat.className} ${styles.wrapper}`}>
            <div className={styles.loginContainer}>
                    <div className={styles.welcomeText}>
                        <h1>Registrarse</h1>
                    </div>
                    <input
                    className={styles.inputField}
                    type="text"
                    placeholder="email@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                    className={styles.inputField}
                    type="text"
                    placeholder="usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                    className={styles.inputField}
                    type="password"
                    placeholder="contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />

                    <button className={styles.nextButton} onClick={handleSignup}>
                        Confirmar
                    </button>
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
    )
  }