# Vendix — Backend (API REST)

API del sistema de gestión de ventas e inventario **Vendix** para vendedores ambulantes y pymes
(Proyecto APT, Ingeniería en Informática, Duoc UC Valparaíso).

**Tecnologías:** Node.js · Express · MySQL 8 · JWT · API de IA opcional (cualquier proveedor compatible con OpenAI).

## Qué hace

- **Cuentas:** registro e inicio de sesión con correo. Cada cuenta ve solo sus datos.
- **Productos:** crear, listar, editar y eliminar, con precio de compra, precio de venta y ganancia por unidad; reposición y ajustes de stock con historial.
- **Ventas:** descuentan el stock automáticamente (o se rechazan si no alcanza), guardan el historial y se pueden anular (el stock vuelve).
- **Panel:** resumen y tendencia, ventas por día/semana/mes, más y menos vendidos, inversión y ganancia, alertas de stock bajo, valor del inventario.
- **Asistente:** responde preguntas sobre el negocio (con IA si configuras una clave; si no, con reglas sobre los datos reales).

Documentación completa en la carpeta [`docs/`](docs): [arquitectura](docs/ARQUITECTURA.md), [modelo de datos](docs/MODELO_DE_DATOS.md) (con el diagrama entidad-relación) y [API](docs/API.md).

## Requisitos

- [Node.js](https://nodejs.org/) **20 o superior** (para correr `npm test` hace falta Node **22.13 o superior**).
- **MySQL 8**: con Docker (opción A, la más simple) o instalado en tu computador (opción B).

## Instalación paso a paso (Windows / PowerShell)

```powershell
# 1. Entra a la carpeta del backend e instala las dependencias
cd Proyecto-Capstone-backend\Codigo
npm install

# 2. Crea tu archivo de configuración y edítalo
Copy-Item .env.example .env
notepad .env
```

En `.env` completa al menos `DB_PASSWORD` (la contraseña de tu MySQL) y `JWT_SECRET` (una clave larga y secreta; puedes generar una con
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). **El archivo `.env` no se sube a GitHub.**

### Base de datos — opción A: Docker

```powershell
docker compose up -d      # levanta MySQL y crea las tablas solo la primera vez
```

Usa la contraseña `DB_PASSWORD` de tu `.env` (si la dejas vacía, queda `vendix123`).

### Base de datos — opción B: MySQL instalado

Con MySQL 8 ya instalado y encendido (por ejemplo con MySQL Installer o XAMPP):

```powershell
npm run db:init           # crea la base "vendix" y todas las tablas
```

(`npm run db:init -- --reiniciar` borra las tablas y las vuelve a crear, perdiendo los datos.)

### Encender la API

```powershell
npm run dev               # se reinicia sola al guardar cambios
# o:  npm start
```

Debe aparecer `Vendix API lista en http://localhost:3000/api`. Comprueba en el navegador: <http://localhost:3000/api/salud>
(debe decir `"baseDeDatos":"conectada"`).

### Comprobar que todo funciona

Con la API encendida, en otra terminal:

```powershell
npm run smoke
```

Recorre las funciones principales (cuenta, producto, venta, stock, panel, asistente, anulación, aislamiento entre cuentas) y muestra ✔ o ✘.
También puedes probar a mano con [`docs/pruebas.http`](docs/pruebas.http) (extensión *REST Client* de VS Code).

## Pruebas automáticas

```powershell
npm test
```

Son 44 pruebas de la lógica del negocio (stock, ventas, anulaciones, estadísticas, aislamiento entre cuentas, asistente).
Usan una base SQLite en memoria con el mismo `database/schema.sql`, así que no necesitan MySQL.

## Estructura

```
Codigo/
  src/
    server.js, app.js, config.js    arranque y configuración
    routes/                         qué URL llama a qué (auth, productos, ventas, estadísticas, asistente)
    services/                       lógica del negocio y consultas SQL
    middleware/                     autenticación, límite de intentos, errores
    db/mysql.js                     conexión a MySQL (consultas y transacciones)
    utils/                          validaciones, fechas, contraseñas, tokens
  database/schema.sql               tablas, restricciones e índices
  pruebas/                          pruebas automáticas
  scripts/                          init-bd.js (crea la base) y smoke.js (prueba de humo)
  docs/                             arquitectura, modelo de datos (+ diagrama), API, pruebas.http
  docker-compose.yml                MySQL para desarrollo
```

## Conexión con el frontend

El frontend (repo `Proyecto-Capstone-frontend`) corre en `http://localhost:5173` y la API en `http://localhost:3000`.
`CORS_ORIGENES` en `.env` indica qué direcciones pueden llamar a la API (por defecto, la del frontend en desarrollo).
Si el frontend se publica en otra dirección, agrégala ahí (separadas por coma).

## Asistente con IA (opcional)

Sin configurar nada, el asistente responde con reglas. Para usar un modelo de IA, completa en `.env`:

```
LLM_API_KEY=tu_clave
LLM_BASE_URL=https://api.openai.com/v1      # o la de otro proveedor compatible
LLM_MODELO=gpt-4o-mini
```

La clave se guarda solo en el servidor. Si el proveedor falla, la API responde igual con las reglas.

## Subir cambios a GitHub

```powershell
git add .
git commit -m "Describe aquí el cambio"
git push
```
