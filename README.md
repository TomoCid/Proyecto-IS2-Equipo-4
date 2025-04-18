Proyecto-IS2-Equipo-4

## Como iniciar
Primero es necesario que instalen npm con 
```bash
winget install Schniz.fnm
fnm install 22
node -v
```
Ahora si tienen problemas con permisos de windows
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
``` 
Luego deben clonar el repositorio desde github

para levantar el proyecto, deben ejecutar el comando y podran verlo en el navegador en el localhost
```bash
npm run dev
http://localhost:3000
```
en la carpeta en la que clonaron el repositorio.

En caso de que usemos Neon.tech ejecuten el siguiente comando 
```bash
npm i -g neonctl
```
Desde aquí comenzamos a trabajar :D
