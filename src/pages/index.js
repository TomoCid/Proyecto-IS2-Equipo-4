import { useState } from "react";
import { useRouter } from "next/router";
import { Montserrat } from "next/font/google";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import styles from "@/styles/Auth.module.css"; 
import Image from "next/image";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Función para validar el formato del correo electrónico
function EmailIsValid(mail) {
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  return emailRegex.test(mail);
}

export default function AuthPage() {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const router = useRouter();

  // Estados para los campos de ambos formularios
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // --- LÓGICA DE REGISTRO (copiada de singup_js.txt) ---
  async function handleSignup(e) {
    e.preventDefault(); // Prevenir el envío por defecto del formulario
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

      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión.");
      setTimeout(() => {
        handleSignInClick(); 
      }, 2000); 
    } catch (err) {
      console.error("Error en el registro:", err.message);
      toast.error(err.message);
    }
  }

  // --- LÓGICA DE INICIO DE SESIÓN (copiada de index_js.txt) ---
  async function handleLogin(e) {
    e.preventDefault(); // Prevenir el envío por defecto del formulario
    if (!email || !password) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        router.push("/dashboard"); // Asegúrate de que esta ruta exista
      }, 1500);
    } catch (err) {
      console.error("Error en el inicio de sesión:", err.message);
      toast.error(err.message);
    }
  }

  const handleSignUpClick = () => {
    setIsSignUpActive(true);
    // Limpiar campos al cambiar de formulario
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirm("");
  };
  
  const handleSignInClick = () => {
    setIsSignUpActive(false);
    // Limpiar campos al cambiar de formulario
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirm("");
  };

  return (
    <div className={`${montserrat.className} ${styles.body}`}>
      <div
        className={`${styles.container} ${
          isSignUpActive ? styles.rightPanelActive : ""
        }`}
        id="container"
      >
        {/* FORMULARIO DE REGISTRO */}
        <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
          <form onSubmit={handleSignup}>
            
            <div className={styles.welcomeText}>
              <h1>Crear cuenta</h1>
            </div>
            <br></br>
            
            <input
              className={styles.inputField}
              type="text"
              placeholder="Nombre"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className={styles.inputField}
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={styles.inputField}
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              className={styles.inputField}
              type="password"
              placeholder="Confirmar Contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <br></br>
            <button className={styles.nextButton} type="submit">Registrarme</button>
          </form>
        </div>

        {/* FORMULARIO DE INICIO DE SESIÓN */}
        <div className={`${styles.formContainer} ${styles.signInContainer}`}>
          <form onSubmit={handleLogin}>

            <div className={styles.welcomeText}>
              <h1>Iniciar Sesión</h1>
            </div>
            <br></br>
            
            <input
              className={styles.inputField}
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={styles.inputField}
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <br></br>
            {/*<a href="#">¿Olvidaste tu contraseña?</a>*/}
            <button className={styles.nextButton} type="submit">Ingresar</button>
          </form>
        </div>

        {/* PANELES DESLIZANTES (OVERLAY) */}
        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={`${styles.overlayPanel} ${styles.overlayLeft}`} >
              <h2>Creando tu cuenta, podremos ayudarte con respecto al</h2>
              <br></br>
              <h1> Clima y tus Actividades favoritas</h1>
              <br></br>
              <br></br>  
              <h3>¿Ya tienes una cuenta?</h3>
              <br></br>
              <button className={styles.nextButtonGhost} onClick={handleSignInClick}>
                Iniciar Sesión
              </button>
            </div>
            <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
              <h1>¡Hola de nuevo!</h1><br></br>
              <h2>Ingresa tus datos y </h2>
              <h1>¡veamos que podemos hacer hoy!</h1>
              <br></br>
              <br></br>
              <h3>¿No tienes cuenta?</h3><br></br>
              <button className={styles.nextButtonGhost} onClick={handleSignUpClick}>
                Registrarme
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>
  );
}