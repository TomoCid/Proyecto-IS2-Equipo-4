import { useState } from "react";
import styles from "@/styles/login.module.css";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";
import { toast, ToastContainer } from "react-toastify";

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  // Función para manejar el registro
  async function handleSignup() {
    if (!username || !email || !password || !confirm) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }
    if (!EmailIsValid(email)) {
      toast.error("El correo electrónico no es válido.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar");
      }
      toast.success("Registro exitoso");
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      console.error("Error en el registro:", err.message);
      toast.error(err.message);
    }
  }

  return (
    <div className={`${montserrat.className} ${styles.background}`}>
      <div className={styles.centerContainer}>
        <div className={styles.loginCard}>
          <div className={styles.welcomeText}>
            <h1>Crear cuenta</h1>
            <p className={styles.subtitle}>Regístrate para comenzar</p>
          </div>
          <input
            className={styles.inputField}
            type="text"
            placeholder="Nombre"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className={styles.inputField}
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={styles.inputField}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className={styles.inputField}
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button className={styles.nextButton} onClick={handleSignup}>
            Registrarme
          </button>
          <p className={styles.registerText}>
            ¿Ya tienes una cuenta?{" "}
            <span
              className={styles.registerLink}
              onClick={() => router.push("/")}
            >
              Inicia sesión
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
    </div>
  );
}