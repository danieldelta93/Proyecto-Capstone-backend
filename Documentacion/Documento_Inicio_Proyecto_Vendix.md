# Documento de inicio del proyecto — Vendix

**Proyecto APT (Capstone) · Ingeniería en Informática · Duoc UC Valparaíso**
**Versión 2.0 · Actualizado: noviembre de 2026**

## 1. Contexto y problema

Los vendedores ambulantes y los dueños de pequeños negocios (ferias, almacenes de barrio, puestos) suelen llevar sus ventas y su
inventario en cuadernos, planillas o de memoria. Eso provoca:

- **Quiebres de stock**: se acaba un producto que se vende bien y no se alcanza a reponer.
- **Compras innecesarias**: se compra de más lo que no rota.
- **Falta de claridad sobre la ganancia**: no se sabe cuánto se invierte ni cuánto se gana realmente.
- **Decisiones a ojo**, sin datos (qué reponer, qué día se vende más).

Las herramientas existentes (planillas, sistemas de punto de venta para tiendas formales) son complejas o no están pensadas para
personas sin conocimientos técnicos que trabajan desde el celular.

## 2. Objetivos

**Objetivo general.** Desarrollar una aplicación web instalable en el celular (PWA) para gestionar ventas e inventario de vendedores
ambulantes y pymes, con paneles de análisis y un asistente de recomendaciones, que les permita tomar decisiones con sus propios datos.

**Objetivos específicos y cómo se mide su logro**

| N.º | Objetivo específico | Indicador de logro | Estado |
|---|---|---|---|
| OE1 | Registrar y gestionar productos (nombre, categoría, precio de compra y de venta, stock) | El producto se crea, edita y elimina desde la app y queda guardado en MySQL | Logrado |
| OE2 | Registrar ventas con actualización automática del inventario e historial | Al vender baja el stock; el stock nunca queda negativo; se puede anular una venta y el stock vuelve | Logrado |
| OE3 | Mostrar paneles de análisis | El panel muestra al menos 5 indicadores calculados por el servidor (ventas por día, más vendidos, tendencia, inversión y ganancia, stock bajo) | Logrado (faltan en pantalla "menos vendidos" y agrupación por semana/mes, que el servidor ya calcula) |
| OE4 | Asistente que responda en lenguaje simple con datos reales | Responde al menos 8 tipos de preguntas sobre el negocio; puede usar un proveedor de IA si se configura | Logrado con reglas; IA externa lista para activar con una clave |
| OE5 | Verificar con pruebas | Más de 60 pruebas automáticas aprobadas y pruebas de usabilidad con al menos 5 usuarios | Parcial (pruebas automáticas hechas; faltan las pruebas con usuarios reales) |
| OE6 | Documentar | Documentación técnica, de producto y manual de usuario | En curso (ver carpeta `Documentacion/`) |

## 3. Alcance del MVP (producto mínimo viable)

**Incluye**

- Cuentas de usuario con correo y contraseña; cada cuenta ve solo sus datos.
- Inventario: crear, editar, eliminar, buscar, filtrar y ordenar productos; precio de compra, precio de venta y ganancia por unidad;
  alertas de stock bajo; reposición y ajuste de stock con historial.
- Ventas: carrito, método de pago (efectivo, transferencia, tarjeta), descuento automático de stock, historial agrupado por día y
  anulación de ventas.
- Panel: resumen y tendencia frente al período anterior, ventas por día, productos más vendidos, inversión y ganancia, alertas.
- Asistente de recomendaciones (con reglas sobre los datos reales; IA externa opcional).
- Exportación de reportes (CSV y PDF).
- Aplicación instalable en el celular (PWA).
- API REST con base de datos MySQL, seguridad básica, pruebas automáticas y documentación.

**No incluye (versiones futuras)**

- Facturación electrónica o integración con el SII.
- Cobro con tarjeta integrado (el método de pago es solo un registro).
- Varios usuarios o sucursales por negocio.
- Proveedores y órdenes de compra.
- Modo sin conexión con sincronización posterior; notificaciones push.
- Devoluciones parciales y reportes generados en el servidor.

## 4. Restricciones

| Tipo | Restricción |
|---|---|
| Tiempo | 18 semanas del semestre; entrega final en la semana 18 |
| Equipo | 2 integrantes (el equipo era de 3; un integrante salió durante la Fase 2) |
| Presupuesto | Prácticamente cero: se usan herramientas libres o gratuitas; la clave de IA es opcional |
| Tecnología | Stack definido: React, Node.js/Express, MySQL; navegadores modernos en celular y computador |
| Datos | Montos en pesos chilenos (enteros); zona horaria America/Santiago |
| Legales y éticas | Solo se guardan correo, nombre y datos del negocio; contraseñas con hash; no se guardan datos de pago; a la IA externa solo se le envían cifras agregadas del negocio (nunca contraseñas ni correos) |
| Académicas | Entregables según las guías de cada fase; evidencias en GitHub |

## 5. Supuestos

- Los usuarios tienen un celular con navegador moderno y datos móviles.
- Registran sus ventas durante el día o al cierre.
- Una conexión intermitente es aceptable: la app instalada abre sin conexión, pero necesita internet para guardar y mostrar datos.

## 6. Riesgos y mitigación

| N.º | Riesgo | Prob. | Impacto | Mitigación | Situación |
|---|---|---|---|---|---|
| R1 | Un integrante deja el equipo | Media | Alto | Priorizar el backlog, concentrar el trabajo en lo esencial, documentar para que cualquiera pueda continuar | **Ocurrió** (backend/BD pasó a Daniel; se logró cumplir) |
| R2 | La integración de IA toma más tiempo del disponible | Media | Medio | Partir con un asistente basado en reglas; IA opcional por configuración | Mitigado |
| R3 | Conexión inestable en terreno | Alta | Medio | App instalable (PWA); mensajes claros cuando no hay conexión; cola sin conexión a futuro | Parcial |
| R4 | No conseguir usuarios reales para pruebas | Media | Medio | Pruebas guiadas con conocidos y compañeros usando escenarios reales; pedir apoyo al docente | Abierto |
| R5 | Pérdida de datos | Baja | Alto | Respaldos con `mysqldump`; transacciones; restricciones en la base | Parcial (falta programar respaldos) |
| R6 | Falta de tiempo para publicar en la nube | Media | Medio | Docker y guía de despliegue listos; publicar en Sprint 5 | Abierto |
| R7 | Fallos de seguridad | Baja | Alto | Hash de contraseñas, tokens, validación, límite de intentos, pruebas de seguridad | Mitigado |

## 7. Equipo y roles

| Integrante | Rol |
|---|---|
| Daniel Troncoso | Líder técnico; backend, base de datos, asistente de IA y despliegue |
| Esteban Guajardo | Frontend, diseño de interfaz (UX/UI) y pruebas de usabilidad |
| Kevin Godoy (hasta su salida) | Backend y base de datos según el plan de la Fase 1 |

La documentación y las pruebas son responsabilidad de ambos.

## 8. Cronograma resumido

| Sprint | Semanas | Foco |
|---|---|---|
| 0 | S1–S4 | Planificación, requerimientos y diseño |
| 1 | S5–S6 | Inventario |
| 2 | S7–S8 | Ventas |
| 3 | S9–S10 | Panel, cuentas, PWA e integración con el backend |
| 4 | S11–S13 | Asistente de IA y pruebas con usuarios |
| 5 | S14–S16 | Pruebas finales, ajustes y publicación |
| 6 | S17–S18 | Documentación final y presentación |

Detalle en `Sprint_Backlog_Vendix.md`.

## 9. Criterios de éxito

- Un comerciante puede crear su cuenta, cargar sus productos, registrar una venta y ver su ganancia sin ayuda.
- Todas las historias "Debe tener" del Product Backlog cumplen la Definition of Done.
- Las pruebas automáticas y la prueba de humo (`npm run smoke`) pasan.
- Al menos 5 usuarios prueban la aplicación y la califican con satisfacción media de 4 sobre 5 o más (meta).
