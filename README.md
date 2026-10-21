# Proyecto Capstone – Vendix

# Vendix --- Backend (API REST)

Backend del sistema Vendix para la gestión de ventas e inventario,
desarrollado para el Proyecto APT de Ingeniería en Informática de Duoc
UC, sede Valparaíso.

**Tecnologías:** Node.js, Express, MySQL 8, JWT y un proveedor de IA
opcional compatible con la API de chat completions.

## Responsabilidad del backend

La API concentra la lógica de negocio y el acceso a los datos. El código
incluye rutas y servicios para:

-   Registro e inicio de sesión de usuarios.
-   Gestión de productos y existencias.
-   Registro y anulación de ventas, con operaciones de stock.
-   Estadísticas relacionadas con ventas e inventario.
-   Asistente que puede utilizar IA si se configura una clave; sin ella,
    contempla respuestas basadas en reglas.

La presencia de estos módulos en el código no garantiza por sí sola que
el entorno esté configurado o que el frontend esté integrado. La
validación debe realizarse siguiendo los pasos de esta guía.

## Requisitos

-   Node.js 20 o superior.
-   MySQL 8, instalado localmente o levantado mediante Docker.
-   npm.
-   (Opcional) Docker y Docker Compose.
-   Para ejecutar `npm test`, el README existente del proyecto indica
    que se requiere Node.js 22.13 o superior.

## Instalación (Windows / PowerShell)

Abre una terminal en la carpeta `Codigo` del backend:

``` powershell
cd Proyecto-Capstone-backend\Codigo
npm install
Copy-Item .env.example .env
```

Edita `.env` y completa los valores necesarios. Como mínimo, configura
la contraseña de MySQL y un secreto JWT propio.

Puedes generar un secreto JWT con:

``` powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

No subas el archivo `.env` a Git ni compartas sus valores.

## Configuración

Variables definidas en `.env.example`:

  -----------------------------------------------------------------------
  Variable                            Propósito
  ----------------------------------- -----------------------------------
  `PORT`                              Puerto del servidor (por defecto,
                                      `3000`)

  `DB_HOST`                           Host de MySQL

  `DB_PORT`                           Puerto de MySQL

  `DB_USER`                           Usuario de MySQL

  `DB_PASSWORD`                       Contraseña de MySQL

  `DB_NAME`                           Nombre de la base de datos
                                      (`vendix`)

  `JWT_SECRET`                        Secreto para firmar los tokens

  `JWT_EXPIRA`                        Duración de los tokens

  `CORS_ORIGENES`                     Orígenes de frontend permitidos

  `ZONA_HORARIA`                      Zona horaria utilizada para
                                      interpretar fechas de ventas

  `LLM_API_KEY`                       Clave opcional del proveedor de IA

  `LLM_BASE_URL`                      URL base del proveedor de IA

  `LLM_MODELO`                        Modelo que se utilizará para el
                                      asistente
  -----------------------------------------------------------------------

El archivo `.env.example` contiene valores de ejemplo; reemplázalos por
los valores apropiados para tu equipo.

## Preparar la base de datos

### Opción A: Docker

Con Docker disponible y el `.env` configurado:

``` powershell
docker compose up -d
```

El archivo `docker-compose.yml` define el servicio de base de datos.
Revisa su configuración antes de utilizarlo en otro entorno.

### Opción B: MySQL instalado

Con MySQL en ejecución:

``` powershell
npm run db:init
```

Este comando ejecuta el script de inicialización de la base de datos.
**No ejecutes la opción de reinicio si necesitas conservar datos**, ya
que puede eliminar tablas y datos existentes.

## Ejecutar la API

Modo desarrollo:

``` powershell
npm run dev
```

Modo normal:

``` powershell
npm start
```

El proyecto configura por defecto el servidor en
`http://localhost:3000`. La ruta de salud documentada es:

`http://localhost:3000/api/salud`

Comprueba la respuesta y confirma que la base de datos aparezca
conectada antes de probar operaciones que dependan de MySQL.

## Pruebas

### Pruebas automáticas

``` powershell
npm test
```

El proyecto incluye pruebas para usuarios, productos, ventas,
estadísticas y asistente. El README previo del backend declara 44
pruebas; este número debe confirmarse ejecutando el comando en el
entorno actual y revisando el resumen que entrega Node.js.

### Prueba de humo

Con la API y la base de datos configuradas, ejecuta en otra terminal:

``` powershell
npm run smoke
```

El script intenta recorrer flujos principales del sistema. Revisa el
resultado de cada comprobación; no asumas que todas pasan hasta ver la
salida.

### Pruebas manuales de endpoints

El archivo `docs/pruebas.http` contiene solicitudes que pueden
ejecutarse con una extensión REST Client compatible en Visual Studio
Code.

## Estructura del código

``` text
Codigo/
├── src/
│   ├── server.js                 # Arranque del servidor
│   ├── app.js                    # Configuración de Express y rutas
│   ├── config.js                 # Configuración y variables de entorno
│   ├── routes/                   # Rutas de autenticación y módulos
│   ├── services/                 # Lógica de negocio y acceso a datos
│   ├── middleware/               # Autenticación, límites y errores
│   ├── db/mysql.js               # Conexión a MySQL
│   └── utils/                    # Utilidades compartidas
├── database/schema.sql           # Esquema de la base de datos
├── scripts/
│   ├── init-bd.js                # Inicialización de la base de datos
│   └── smoke.js                  # Prueba de humo
├── pruebas/                      # Pruebas automáticas
├── docs/
│   ├── API.md                    # Documentación de endpoints
│   ├── ARQUITECTURA.md            # Arquitectura del backend
│   ├── MODELO_DE_DATOS.md         # Descripción del modelo
│   ├── er.mmd                    # Fuente del diagrama entidad-relación
│   ├── modelo-entidad-relacion.png
│   └── pruebas.http              # Pruebas manuales
├── .env.example
├── docker-compose.yml
└── package.json
```

## Documentación técnica

-   [API REST](docs/API.md)
-   [Arquitectura](docs/ARQUITECTURA.md)
-   [Modelo de datos](docs/MODELO_DE_DATOS.md)
-   [Diagrama entidad-relación, fuente Mermaid](docs/er.mmd)
-   [Pruebas manuales](docs/pruebas.http)

## Integración con el frontend

El backend permite llamadas desde los orígenes definidos en
`CORS_ORIGENES`. El ejemplo incluido permite `http://localhost:5173`,
que es el puerto de desarrollo habitual de Vite.

Para confirmar la integración: 1. Inicia MySQL y el backend. 2.
Comprueba `/api/salud`. 3. Configura el frontend para llamar a la URL de
la API. 4. Prueba inicio de sesión y una operación de producto o venta.
5. Comprueba que la respuesta de la API y los datos almacenados
coincidan con lo mostrado en la interfaz.

No almacenes secretos de servidor en el frontend.

## Seguridad y buenas prácticas

-   Mantén `.env` fuera del control de versiones.
-   Usa un `JWT_SECRET` fuerte y privado.
-   No uses credenciales de ejemplo en producción.
-   Valida autorización y aislamiento de datos entre cuentas.
-   Ejecuta pruebas después de modificar rutas, servicios o el esquema
    de datos.

## Scripts npm disponibles

  -----------------------------------------------------------------------
  Comando                             Uso
  ----------------------------------- -----------------------------------
  `npm start`                         Inicia el servidor

  `npm run dev`                       Inicia el servidor en modo
                                      desarrollo con reinicio al cambiar
                                      archivos

  `npm run db:init`                   Inicializa la base de datos

  `npm test`                          Ejecuta pruebas automáticas

  `npm run smoke`                     Ejecuta el script de prueba de humo
  -----------------------------------------------------------------------

## Equipo

-   **Esteban Guajardo:** frontend,backend y UX/UI.
-   **Daniel Troncoso:** liderazgo técnico,bases de datos y componente de IA.

## Estado y alcance

Este README describe los archivos y scripts encontrados en el ZIP
revisado. La ejecución correcta, el resultado actual de las pruebas y la
integración efectiva con el frontend deben validarse en el entorno del
equipo antes de declarar el sistema como completamente operativo.

