# Sprint Backlog — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

Cada sprint dura dos semanas (los de mayor tamaño, tres). Los números S1–S18 son las semanas del semestre.
Las historias (HU-xx) están descritas en `Product_Backlog_Vendix.md`. Los responsables reflejan los roles del equipo
(Daniel: backend, base de datos, IA y despliegue; Esteban: frontend, diseño y pruebas de usabilidad) y se pueden ajustar.

Estados: **Hecho** · **En curso** · **Pendiente**.

---

## Sprint 0 · S1–S4 · Planificación y diseño

**Objetivo:** entender el problema, definir el alcance y diseñar la solución.

| Tarea | Responsable | Estado |
|---|---|---|
| Definir problema, objetivos y alcance (informe de la Fase 1) | Equipo | Hecho |
| Levantar requerimientos y módulos | Equipo | Hecho |
| Elegir tecnologías | Equipo | Hecho |
| Diseñar la interfaz móvil (paleta, navegación, flujos) | Esteban | Hecho |
| Presentación de la Fase 1 | Equipo | Hecho |

---

## Sprint 1 · S5–S6 · Inventario

**Objetivo:** que el comerciante pueda gestionar sus productos. **Historias:** HU-05, HU-06, HU-07, HU-09.

| Tarea | Responsable | Estado |
|---|---|---|
| Pantalla de inventario y formulario de producto (frontend) | Esteban / Daniel | Hecho |
| Búsqueda, filtros por categoría y alertas de stock bajo | Esteban / Daniel | Hecho |
| API y tablas de productos (backend) | Daniel | Hecho (se completó en el Sprint 3, con retraso respecto del plan) |

**Resultado:** el frontend se terminó a tiempo con datos locales; el backend se retrasó por la salida de un integrante (ver retrospectiva).

---

## Sprint 2 · S7–S8 · Ventas

**Objetivo:** registrar ventas con descuento automático de stock. **Historias:** HU-11, HU-13.

| Tarea | Responsable | Estado |
|---|---|---|
| Carrito de venta, método de pago e historial (frontend) | Esteban / Daniel | Hecho |
| API de ventas con transacciones y control de stock (backend) | Daniel | Hecho (se completó en el Sprint 3) |
| Reordenar prioridades tras la salida de un integrante | Equipo | Hecho |

---

## Sprint 3 · S9–S10 (extendido) · Panel, cuentas, ganancia e integración

**Objetivo:** pasar de un prototipo local a un sistema conectado: cuentas, panel, ganancia, API y base de datos.
**Historias:** HU-01 a HU-04, HU-08, HU-12, HU-14, HU-15, HU-17 a HU-23, HU-26 a HU-28, HU-31.

| Tarea | Responsable | Estado |
|---|---|---|
| Cuentas con correo y contraseña; sesión con token | Daniel / Esteban | Hecho |
| Precio de compra, precio de venta y ganancia por unidad | Esteban / Daniel | Hecho |
| Panel: ventas por día, más vendidos, inversión y ganancia, alertas | Esteban / Daniel | Hecho |
| Reportes CSV y PDF; app instalable (PWA) | Esteban | Hecho |
| Reorganizar el código (una carpeta y un CSS por componente) | Esteban / Daniel | Hecho |
| Diseño de la base de datos (6 tablas) y diagrama entidad-relación | Daniel | Hecho |
| API REST completa (cuentas, productos, ventas, estadísticas, asistente) | Daniel | Hecho |
| Pruebas automáticas (lógica, seguridad y rendimiento) y prueba de humo | Daniel | Hecho |
| Conectar el frontend a la API (sin datos locales) | Daniel / Esteban | Hecho |
| Docker para MySQL y la API | Daniel | Hecho |

---

## Sprint 4 · S11–S13 · Asistente de IA y pruebas con usuarios

**Objetivo:** que el asistente use datos reales (y, si es posible, IA) y validar con comerciantes. **Historias:** HU-24, HU-25, HU-32.

| Tarea | Responsable | Estado |
|---|---|---|
| Asistente con reglas sobre los datos reales | Daniel | Hecho (adelantado) |
| Probar el asistente con un proveedor de IA (clave en `.env`) | Daniel | Pendiente |
| Guion de pruebas de usabilidad y formulario de retroalimentación | Esteban | Pendiente |
| Pruebas guiadas con al menos 5 personas | Esteban / Daniel | Pendiente |
| Documentación técnica y de producto | Equipo | En curso (este conjunto de documentos) |

---

## Sprint 5 · S14–S16 · Ajustes y publicación

**Objetivo:** corregir lo que salga de las pruebas y publicar la aplicación. **Historias:** HU-10, HU-20, HU-22, HU-29.

| Tarea | Responsable | Estado |
|---|---|---|
| Pantalla de reposición y ajuste de stock (HU-10) | Esteban | Pendiente |
| Mostrar "menos vendidos" y ventas por semana/mes en el panel (HU-20, HU-22) | Esteban | Pendiente |
| Correcciones según las pruebas con usuarios | Equipo | Pendiente |
| Publicar la API, MySQL y el frontend con HTTPS (HU-29) | Daniel | Pendiente |
| Programar respaldos de la base de datos | Daniel | Pendiente |

---

## Sprint 6 · S17–S18 · Cierre

**Objetivo:** entregar el proyecto final. **Historias:** HU-33.

| Tarea | Responsable | Estado |
|---|---|---|
| Manual de usuario | Esteban | Pendiente |
| Informe y evidencias de la Fase 3 | Equipo | Pendiente |
| Presentación final y demostración | Equipo | Pendiente |
