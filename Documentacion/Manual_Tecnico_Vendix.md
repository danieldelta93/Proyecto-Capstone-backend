# Manual técnico — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

Este manual explica cómo instalar, configurar, ejecutar, probar, publicar y mantener Vendix. Está pensado para que cualquier persona
con conocimientos básicos de informática pueda levantar el sistema siguiendo los pasos.

## 1. Visión general

| Parte | Tecnología | Repositorio |
|---|---|---|
| Frontend (la app) | React 18, Vite 5, Chart.js 4, PWA | `Proyecto-Capstone-frontend` (carpeta `Codigo/`) |
| Backend (API REST) | Node.js, Express 4, JWT, scrypt | `Proyecto-Capstone-backend` (carpeta `Codigo/`) |
| Base de datos | MySQL 8 (6 tablas) | `Codigo/database/schema.sql` en el backend |
| Contenedores | Docker (MySQL y API) | `Codigo/docker-compose.yml` y `Codigo/Dockerfile` |

Arquitectura y diagramas: `Diagramas_UML_Vendix.md`.

## 2. Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (22.13 o superior para ejecutar `npm test`).
- Git.
- MySQL 8 instalado, **o** Docker Desktop.
- Un navegador moderno (Chrome o Edge).

## 3. Instalación y ejecución local

### 3.1 Backend

```bash
git clone https://github.com/danieldelta93/Proyecto-Capstone-backend.git
cd Proyecto-Capstone-backend/Codigo
npm install
cp .env.example .env        # en Windows PowerShell: Copy-Item .env.example .env
```

Edita `.env` y completa `DB_PASSWORD` y `JWT_SECRET` (ver sección 4). Luego prepara la base de datos con **una** de estas opciones:

- **Con Docker:** `docker compose up -d` (levanta MySQL y crea las tablas).
- **Con MySQL instalado:** `npm run db:init` (crea la base `vendix` y las 6 tablas).

Enciende la API:

```bash
npm run dev      # se reinicia sola al guardar cambios (o: npm start)
```

Comprueba en el navegador `http://localhost:3000/api/salud`: debe decir `"baseDeDatos":"conectada"`.

### 3.2 Frontend

```bash
git clone https://github.com/danieldelta93/Proyecto-Capstone-frontend.git
cd Proyecto-Capstone-frontend/Codigo
npm install
npm run dev
```

Abre `http://localhost:5173`. En desarrollo, Vite reenvía las llamadas `/api` a `http://localhost:3000` (ver `vite.config.js`), así que no hay
nada más que configurar. **El backend debe estar encendido.**

### 3.3 Todo con Docker (opcional)

Con `JWT_SECRET` definido en `.env`:

```bash
docker compose --profile completo up -d --build
```

Levanta MySQL y la API (`http://localhost:3000`). El frontend se sigue ejecutando con `npm run dev`.

## 4. Configuración (archivo `.env` del backend)

| Variable | Para qué sirve | Valor por defecto |
|---|---|---|
| `PORT` | Puerto de la API | 3000 |
| `DB_HOST`, `DB_PORT` | Dirección de MySQL | `localhost`, 3306 |
| `DB_USER`, `DB_PASSWORD` | Usuario y contraseña de MySQL | `root`, (vacía) |
| `DB_NAME` | Nombre de la base | `vendix` |
| `JWT_SECRET` | Clave para firmar las sesiones (**obligatoria, mínimo 32 caracteres**) | — |
| `JWT_EXPIRA` | Duración de la sesión | `7d` |
| `CORS_ORIGENES` | Direcciones del frontend que pueden usar la API (separadas por coma) | `http://localhost:5173` |
| `ZONA_HORARIA` | Zona horaria para decidir "hoy" | `America/Santiago` |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODELO` | Asistente con IA (opcional) | sin clave: responde con reglas |

Para generar una clave segura: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
**El archivo `.env` no se sube a GitHub.**

Variable del frontend (solo al publicar): `VITE_API_URL` con la dirección de la API publicada (ver `.env.example` del frontend).

## 5. Pruebas

```bash
# Backend
npm test          # 63 pruebas automáticas (69 con las de sesiones JWT) - necesita Node 22.13 o superior
npm run smoke     # prueba de humo contra la API encendida (necesita MySQL)
```

Detalle de las pruebas y sus resultados: `Plan_Pruebas_Vendix.md`.

## 6. Publicación en internet (guía sugerida)

*Aún no se ha desplegado; estos son los pasos previstos.* Los nombres de los servicios son ejemplos; conviene revisar los planes y costos vigentes.

1. **Base de datos:** crear un MySQL administrado (por ejemplo, el que ofrecen Railway o Aiven) y anotar host, puerto, usuario, contraseña y nombre de la base.
2. **Crear las tablas:** en tu computador, apunta `.env` a esa base y ejecuta `npm run db:init`.
3. **Publicar la API** (con el `Dockerfile` del backend o como servicio Node, por ejemplo en Render o Railway) y definir las variables de la sección 4:
   `DB_*`, `JWT_SECRET` (una clave nueva, distinta a la de desarrollo), `CORS_ORIGENES` (la dirección donde estará el frontend) y `ZONA_HORARIA`.
4. **Probar la API:** abrir `https://<tu-api>/api/salud`.
5. **Publicar el frontend:** crear `.env.production` con `VITE_API_URL=https://<tu-api>/api`, ejecutar `npm run build` y subir la carpeta `dist/` a un hosting
   estático (por ejemplo Netlify, Vercel o GitHub Pages).
6. **HTTPS:** es obligatorio para que la app se pueda instalar en el celular; estos servicios lo incluyen.
7. **Verificar:** crear una cuenta, vender, abrir el panel e instalar la app desde el celular.

## 7. Respaldos y mantenimiento

```bash
# Respaldo (reemplaza los datos entre < >)
mysqldump -h <host> -u <usuario> -p --single-transaction vendix > respaldo_AAAA-MM-DD.sql

# Restaurar
mysql -h <host> -u <usuario> -p vendix < respaldo_AAAA-MM-DD.sql
```

- Hacer un respaldo semanal y guardar los archivos fuera del servidor.
- Revisar dependencias con `npm outdated` y `npm audit` cada cierto tiempo.
- Si se cambia el modelo de datos: actualizar `database/schema.sql`, el diagrama entidad-relación y `docs/MODELO_DE_DATOS.md`.

## 8. Estructura de los proyectos

**Backend (`Codigo/`)**

```
src/routes/        qué URL llama a qué
src/services/      lógica del negocio y consultas SQL
src/middleware/    autenticación, límite de intentos, errores
src/db/            conexión a MySQL (consultas y transacciones)
src/utils/         validaciones, fechas, contraseñas, tokens
database/          schema.sql (tablas, restricciones, índices)
pruebas/           pruebas automáticas
scripts/           init-bd.js (crea la base) y smoke.js (prueba de humo)
docs/              arquitectura, modelo de datos, API
```

**Frontend (`Codigo/`)**

```
src/api/           comunicación con el backend
src/components/    un componente por carpeta, con su propio CSS
src/hooks/         sesión (useAuth), avisos (useToast), instalación (useInstallPrompt)
src/styles/        paleta de colores y piezas de interfaz compartidas
public/            íconos, manifest y service worker (PWA)
```

## 9. Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| `Falta JWT_SECRET en el archivo .env` | No se creó `.env` o la clave tiene menos de 32 caracteres |
| `No pude conectarme a MySQL` / `ECONNREFUSED` | MySQL está apagado o `DB_HOST`/`DB_PORT` están mal |
| `Access denied for user` | `DB_USER` o `DB_PASSWORD` incorrectos |
| `Unknown database 'vendix'` | Falta ejecutar `npm run db:init` |
| `EADDRINUSE ... 3000` | El puerto 3000 está ocupado: cambiar `PORT` en `.env` (y el proxy de `vite.config.js`) |
| El frontend dice "No se pudo conectar con el servidor" | El backend está apagado o `VITE_API_URL` es incorrecto |
| Error de CORS en el navegador | Agregar la dirección del frontend a `CORS_ORIGENES` |
| Se ve una versión vieja de la app | Service worker antiguo: en el navegador, F12 → Application → Service Workers → Unregister, y recargar con Ctrl + Shift + R |
| `npm test` falla al importar `node:sqlite` | Actualizar Node a 22.13 o superior |
