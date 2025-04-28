import { useState } from "react";
import styles from "@/styles/login.module.css";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "700"],
  });

  export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const router = useRouter();
    async function handleSignup(){
        router.push("/");
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
                    />
                    <input
                        className={styles.inputField}
                        type="text"
                        placeholder="usuario"
                    />
                    <input
                        className={styles.inputField}
                        type="password"
                        placeholder="contraseña"
                    />
                    <button className={styles.nextButton} onClick={handleSignup}>
                        Confirmar
                    </button>
                </div>

        </div>
    )
  }