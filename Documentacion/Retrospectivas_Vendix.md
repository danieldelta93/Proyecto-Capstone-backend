# Retrospectivas de sprint — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

En cada retrospectiva el equipo revisa qué salió bien, qué se puede mejorar y qué acuerdos toma para el siguiente sprint.
Las de los sprints ya cerrados se redactaron a partir de lo que ocurrió durante el proyecto; el equipo puede ajustarlas o completarlas
con su propia opinión.

---

## Retrospectiva del Sprint 0 · Planificación y diseño (S1–S4)

**Qué salió bien**
- El problema, los objetivos y los módulos quedaron claros desde la Fase 1.
- Los roles del equipo se repartieron según los intereses de cada uno.
- Se definió una identidad visual simple, pensada para personas sin conocimientos técnicos.

**Qué se puede mejorar**
- No se definió un plan B por si alguien dejaba el equipo.
- El backlog no estaba priorizado formalmente (todo parecía igual de importante).

**Acuerdos**
- Priorizar siempre lo que da valor visible al usuario primero.
- Mantener la documentación al día mientras se avanza, no al final.

---

## Retrospectiva del Sprint 1 y 2 · Inventario y ventas (S5–S8)

**Qué salió bien**
- El frontend de inventario y ventas quedó funcionando rápido, con datos locales, y permitió ver y ajustar los flujos temprano.
- La interfaz móvil funcionó bien desde el primer momento.

**Qué se puede mejorar**
- Un integrante dejó el equipo y el backend y la base de datos quedaron sin responsable: el backend se atrasó respecto del plan.
- Los datos solo existían en el navegador de cada persona.

**Acuerdos**
- Daniel asume el backend y la base de datos; Esteban se concentra en el frontend y las pruebas de usabilidad.
- Diseñar el modelo de datos antes de seguir construyendo funciones.
- Mantener el frontend modular para poder conectarlo a la API sin rehacerlo.

---

## Retrospectiva del Sprint 3 · Panel, cuentas, ganancia e integración (S9–S10)

**Qué salió bien**
- Se logró un producto completo: cuentas, panel con inversión y ganancia, reportes, app instalable, API REST y MySQL.
- Las pruebas automáticas encontraron errores reales antes de que los viera un usuario (por ejemplo, una verificación de contraseña que aceptaba un hash dañado).
- La reorganización del código (una carpeta y un CSS por componente) facilitó cambiar cosas sin romper otras.

**Qué se puede mejorar**
- La aplicación instalable guardaba versiones viejas en la caché del navegador y mostraba una versión anterior (y hasta guardaba datos de la API); se corrigió.
- Una cuenta guardada por una versión anterior hacía fallar el inicio de sesión de todos (error de "toLowerCase"); se corrigió ignorando datos antiguos.
- La fecha de "hoy" se calculaba en hora UTC y de noche daba el día siguiente; se corrigió.
- Aparecía un error intermitente del servidor de desarrollo al registrarse; se dejó la configuración más robusta.
- La documentación pedida por el docente (backlog propio, retrospectivas, requisitos no funcionales, UML, manual técnico) quedó atrasada respecto del código.
- Un integrante no tenía commits en el repositorio que revisó el docente.

**Acuerdos**
- No guardar nunca en caché las respuestas de la API y probar en dos navegadores antes de dar algo por terminado.
- Validar los datos que vienen de versiones anteriores en vez de suponer que están bien.
- Cada integrante sube sus cambios con su propia cuenta de GitHub, al menos una vez por semana.
- Los artefactos Scrum se actualizan al terminar cada sprint, no al final del semestre.

---

## Retrospectiva del Sprint 4 · Asistente de IA y pruebas con usuarios (S11–S13)

*Pendiente: se completará al cerrar el sprint.*

| Qué salió bien | Qué se puede mejorar | Acuerdos |
|---|---|---|
| | | |

## Retrospectiva del Sprint 5 · Ajustes y publicación (S14–S16)

*Pendiente: se completará al cerrar el sprint.*

## Retrospectiva del Sprint 6 · Cierre (S17–S18)

*Pendiente: se completará al cerrar el sprint.*
