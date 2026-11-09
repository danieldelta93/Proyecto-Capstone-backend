# Metodología de trabajo: Scrum — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

## 1. Metodología elegida

El proyecto se desarrolla con **Scrum**, un marco de trabajo ágil que organiza el trabajo en **sprints** (ciclos cortos, de dos
semanas) al final de los cuales hay un incremento del producto que funciona y se puede revisar.

## 2. Por qué Scrum (justificación)

| Necesidad del proyecto | Cómo la cubre Scrum |
|---|---|
| Los requerimientos de usuarios no técnicos se entienden mejor viendo el producto que leyendo documentos | Cada sprint entrega algo que se puede probar y comentar; el Product Backlog se ajusta con lo aprendido |
| Equipo muy pequeño | Pocos roles, pocas ceremonias y mucha comunicación directa; no exige estructura pesada |
| Plazo fijo de un semestre con entregas parciales por fase | Los sprints encajan con las fases: cada fase termina con evidencias de lo construido |
| Riesgo de que cambie el equipo o el alcance | Priorizar el backlog permite concentrarse en lo más valioso (ocurrió: la salida de un integrante obligó a reordenar y se mantuvo un producto funcional) |
| Se necesita demostrar el avance | Los artefactos (backlog, sprint backlog, retrospectivas) y el historial de GitHub dejan evidencia |

**Alternativas descartadas**

- **Cascada (en V o en cascada clásica):** exige definir todo al inicio; no sirve cuando los requerimientos se descubren probando con usuarios, y un cambio tardío es muy costoso.
- **Kanban puro:** ordena el flujo, pero no fija plazos ni objetivos por ciclo; el curso necesita metas por fase y fechas de revisión.

## 3. Cómo se aplica en este equipo

**Roles** (propuesta del equipo, a confirmar)

| Rol Scrum | Responsable | Qué hace |
|---|---|---|
| Product Owner | Daniel Troncoso | Prioriza el Product Backlog según el valor para el comerciante |
| Scrum Master | Esteban Guajardo | Facilita las reuniones y cuida que se cumpla el proceso |
| Equipo de desarrollo | Daniel y Esteban | Diseñan, programan, prueban y documentan |

Con solo dos integrantes, ambos participan en todo; los roles ordenan las decisiones, no dividen a las personas.

**Eventos**

| Evento | Frecuencia | Adaptación al equipo |
|---|---|---|
| Planificación del sprint | Inicio de cada sprint | Se eligen las historias del Product Backlog y se registran en el Sprint Backlog |
| Sincronización breve (daily) | Varias veces por semana | Mensajes o llamadas cortas: qué hice, qué haré, qué me bloquea |
| Revisión del sprint | Fin de cada sprint / fase | Se muestra el incremento (en las presentaciones de cada fase) |
| Retrospectiva | Fin de cada sprint | Se registra en `Retrospectivas_Vendix.md` |

**Artefactos**

- **Product Backlog:** `Product_Backlog_Vendix.md` (lista priorizada de historias de usuario).
- **Sprint Backlog:** `Sprint_Backlog_Vendix.md` (lo que se hace en cada sprint).
- **Incremento:** la aplicación funcionando (repos de frontend y backend).
- **Definition of Done:** `Definition_of_Done_Vendix.md`.
- **Visión del producto:** `Product_Vision_Vendix.md`.

## 4. Ejemplo de adaptación al cambio

Al salir un integrante del equipo (Fase 2), el backend y la base de datos quedaron sin responsable. En vez de repartir
el trabajo a medias, se aplicó la inspección y adaptación de Scrum: se priorizó el frontend (valor visible para el usuario), se
validaron los flujos con datos locales y, con el producto ya probado, Daniel construyó el backend y se conectaron ambos. Esa decisión
quedó registrada en la retrospectiva del Sprint 2 y en el Sprint Backlog.

## 5. Evidencia en el repositorio

- Commits de ambos integrantes en los repositorios de frontend y backend.
- Carpeta `Documentacion/` con los artefactos.
- Carpetas `FASE 1`, `FASE 2` y `FASE 3` con las evidencias de cada etapa.
