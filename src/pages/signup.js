import { useState } from "react";
import styles from "@/styles/login.module.css";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Función para validar el formato del correo electrónico
function EmailIsValid(mail) {
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  return emailRegex.test(mail);
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter();

  // Función para manejar el registro
  async function handleSignup() {
    if (!EmailIsValid(email)) {
      toast.error("Email inválido");
      return;
    }
    if (username.length < 1) {
      toast.error("Debe ingresar un nombre de usuario");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar usuario");
      }

      const data = await response.json();
      console.log("Usuario registrado:", data);

      toast.success("Cuenta creada exitosamente");
      setTimeout(() => {
        router.push("/"); // Redirige al usuario después del registro
      }, 2100);
    } catch (err) {
      console.error("Error en el registro:", err.message);
      toast.error(err.message);
    }
  }

  return (
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
  );
}