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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Función para manejar el inicio de sesión
  async function handleLogin() {
    if (!email || !password) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al iniciar sesión");
      }

      const data = await response.json();
      console.log("Usuario autenticado:", data);

      toast.success("Inicio de sesión exitoso");
      sessionStorage.setItem("token", data.token);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error en el inicio de sesión:", err.message);
      toast.error(err.message);
    }
  }

  // Función para redirigir al formulario de registro
  async function handleRegisterLink() {
    router.push("/signup");
  }

  return (
    <div className={`${montserrat.className} ${styles.wrapper}`}>
      <div className={styles.loginContainer}>
        <div className={styles.welcomeText}>
          <h1>Bienvenido</h1>
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
          type="password"
          placeholder="contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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