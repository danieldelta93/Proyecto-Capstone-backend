# Plan de pruebas y resultados — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

## 1. Objetivo y alcance

Comprobar que Vendix funciona correctamente, de forma segura y con buen desempeño, y que resulta fácil de usar para comerciantes sin
conocimientos técnicos. Cubre el backend (API y base de datos), la integración frontend–backend y la experiencia de usuario.

## 2. Estrategia por tipo de prueba

| Tipo | Qué verifica | Herramienta | Dónde |
|---|---|---|---|
| Unitarias (lógica del negocio) | Reglas de usuarios, productos, ventas, estadísticas y asistente | `node:test` sobre los servicios | `Codigo/pruebas/*.test.js` (backend) |
| Integración | Que todas las piezas funcionen juntas: cuenta → producto → venta → panel → anulación | Prueba de humo contra la API encendida | `npm run smoke` |
| Seguridad | Inyección SQL, aislamiento entre cuentas, contraseñas, sesiones, límite de intentos, errores | `node:test` | `pruebas/seguridad.test.js`, `pruebas/token.test.js` |
| Rendimiento | Tiempos de las consultas con 1.000 productos y 5.000 ventas | `node:test` | `pruebas/rendimiento.test.js` |
| Aceptación y usabilidad | Que un comerciante logre sus tareas sin ayuda | Pruebas guiadas con usuarios | Sección 6 |

## 3. Entorno

- **Pruebas automáticas:** Node.js 22.13 o superior; base de datos SQLite en memoria con el mismo `database/schema.sql` que usa MySQL.
- **Prueba de humo:** API real con MySQL 8 (local o con Docker).
- **Aceptación:** celular y computador con la app instalada o abierta en el navegador.

## 4. Criterios

- **Entrada:** historia terminada según la Definition of Done y código subido a GitHub.
- **Salida (para entregar):** 100 % de las pruebas automáticas aprobadas, prueba de humo aprobada y ningún defecto crítico abierto.

## 5. Pruebas automáticas y resultados

| Archivo | Qué prueba | Pruebas |
|---|---|---|
| `usuarios.test.js` | Registro, correo único, contraseña con hash, inicio de sesión | 6 |
| `productos.test.js` | Crear, editar, filtrar, eliminar, stock, aislamiento entre cuentas | 10 |
| `ventas.test.js` | Venta, descuento de stock, "todo o nada", anulación, historial, ganancia | 11 |
| `estadisticas.test.js` | Resumen, tendencia, ventas por día/semana/mes, más y menos vendidos, inversión | 11 |
| `asistente.test.js` | Respuestas con reglas, IA simulada, falla del proveedor | 6 |
| `seguridad.test.js` | Inyección SQL, hashes, límites, errores | 10 |
| `rendimiento.test.js` | Consultas con un negocio grande | 9 |
| `token.test.js` | Sesiones JWT (manipulado, vencido, sin firma) | 6 |
| **Total** | | **69** |

**Resultados**

| Ejecución | Resultado |
|---|---|
| `npm test` con las 44 pruebas iniciales (usuarios, productos, ventas, estadísticas, asistente) | Aprobadas en el computador del equipo |
| `npm run smoke` contra MySQL real | Aprobada en el computador del equipo |
| `npm test` con las 63 pruebas (más seguridad y rendimiento), ejecutado al preparar este documento | 63 de 63 aprobadas |
| Pruebas de sesiones JWT (6) | Se ejecutan al instalar las dependencias (`npm install`); **pendiente de registrar el resultado** |

**Tiempos medidos** (entorno de desarrollo, SQLite en memoria; con MySQL real serán mayores y deben volver a medirse al publicar)

| Consulta | Tiempo | Meta |
|---|---|---|
| Listar 1.000 productos | 5 ms | < 500 ms |
| Resumen del panel a 30 y 90 días (5.000 ventas) | 6 y 9 ms | < 1 s |
| Ventas por día, semana y mes | 7 a 8 ms | < 1 s |
| Más vendidos / más ganancia / menos vendidos | 13 / 8 / 7 ms | < 1 s |
| Asistente (arma todo el contexto del negocio) | 39 ms | < 3 s |
| Registrar una venta (promedio de 200) | 0,3 ms | < 100 ms |

## 6. Pruebas de aceptación y usabilidad (con personas)

**Estado: pendiente de ejecutar con comerciantes reales** (historia HU-32). Procedimiento:

1. Reclutar al menos 5 personas (comerciantes o personas cercanas que usen el celular), sin explicarles la app antes.
2. Darles estas tareas, una por una, y anotar si la logran, cuánto tardan y dónde se confunden:

| Tarea | Éxito esperado | Tiempo meta |
|---|---|---|
| T1. Crear una cuenta y entrar | Lo logra sin ayuda | 1 min |
| T2. Agregar un producto con su precio de compra y de venta | Entiende cuál es cada precio | 1 min |
| T3. Registrar una venta de 2 productos | Lo logra en 4 pasos o menos | 30 s |
| T4. Averiguar cuánto ganó esta semana | Encuentra el dato en el panel | 30 s |
| T5. Anular una venta equivocada | Encuentra el botón | 30 s |
| T6. Preguntarle algo al asistente | Obtiene una respuesta útil | 30 s |

3. Al final, preguntarles de 1 a 5: qué tan fácil fue, qué tan claro el lenguaje, y si la usarían en su negocio.
4. Registrar los resultados en una tabla (persona, tarea, éxito, tiempo, comentarios) y convertir los problemas en historias del Product Backlog.

## 7. Casos de prueba manuales de la interfaz

| ID | Caso | Resultado esperado |
|---|---|---|
| M-01 | Crear cuenta con un correo nuevo | Entra a la app con el inventario vacío |
| M-02 | Iniciar sesión con contraseña incorrecta | Mensaje "Correo o contraseña incorrectos" |
| M-03 | Agregar producto con compra $3.000 y venta $5.000 | Se ve "Ganas $2.000 c/u" |
| M-04 | Vender 3 unidades de un producto con 10 | Stock queda en 7; aviso con la ganancia |
| M-05 | Intentar vender más de lo que hay (con el stock desactualizado desde otra pestaña) | Mensaje de stock insuficiente; la pantalla se actualiza |
| M-06 | Anular la venta | Se ve tachada, no suma y el stock vuelve |
| M-07 | Recargar la página y entrar desde otro navegador | Se ven los mismos datos |
| M-08 | Abrir el panel | Se dibujan los 3 gráficos y las alertas de stock |
| M-09 | Preguntar "¿Cuánto gané esta semana?" | Respuesta con las cifras reales |
| M-10 | Instalar la app en el celular | Aparece el ícono y abre como aplicación |

*Estado: ejecutados durante el desarrollo; el equipo debe registrar la fecha y el resultado final antes de la entrega.*

## 8. Matriz de trazabilidad (historias → pruebas)

| Historia | Pruebas |
|---|---|
| HU-01, HU-02 (cuentas) | `usuarios.test.js`, `token.test.js`, `seguridad.test.js`, M-01, M-02 |
| HU-05 a HU-09 (inventario) | `productos.test.js`, M-03 |
| HU-11 a HU-15 (ventas) | `ventas.test.js`, M-04, M-05, M-06 |
| HU-17 a HU-23 (panel) | `estadisticas.test.js`, `rendimiento.test.js`, M-08 |
| HU-24, HU-25 (asistente) | `asistente.test.js`, M-09 |
| HU-31 (calidad) | todas las pruebas automáticas |

## 9. Defectos encontrados y corregidos

| N.º | Defecto | Cómo se encontró | Corrección |
|---|---|---|---|
| D1 | El inicio de sesión fallaba para todos si había una cuenta guardada por una versión anterior ("toLowerCase de undefined") | Prueba manual en Chrome | Se ignoran los registros inválidos |
| D2 | La app instalable mostraba una versión vieja guardada en la caché | Prueba manual | La página se pide siempre al servidor primero |
| D3 | Los datos de la API podían quedar en la caché del navegador | Revisión al conectar con el backend | Las respuestas de la API nunca se guardan en caché |
| D4 | La fecha de "hoy" usaba la hora UTC y de noche daba el día siguiente | Revisión del código | Se usa la hora local / la zona horaria de Chile |
| D5 | Un hash de contraseña dañado (`scrypt$zz$zz`) se aceptaba como contraseña correcta | **Prueba automática de seguridad** | Se valida el formato y el largo del hash |
| D6 | El asistente no entendía "¿Qué producto se vende menos?" | Prueba automática del asistente | Se ampliaron las frases reconocidas |
| D7 | Error intermitente `ECONNRESET` del servidor de desarrollo al registrarse | Prueba manual | Configuración del proxy más robusta |
| D8 | Tras un rechazo por falta de stock la pantalla seguía mostrando datos viejos | Prueba de punta a punta con dos pestañas | Se actualiza automáticamente tras el rechazo |

## 10. Pendientes

- Pruebas de usabilidad con comerciantes reales (sección 6).
- Medir el rendimiento y el tiempo de carga de la app con MySQL y red reales, una vez publicada.
- Pruebas en iPhone/Safari.
- Registrar el resultado de las pruebas de sesiones JWT.
