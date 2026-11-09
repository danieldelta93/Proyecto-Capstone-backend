# Product Backlog — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

Lista priorizada de historias de usuario. **Prioridad** según MoSCoW: *Debe* (M), *Debería* (S), *Podría* (C), *No por ahora* (W).
**Puntos**: estimación relativa del esfuerzo (referencial; se ajusta en cada planificación).
**Estado**: Hecho · Parcial (falta una parte, indicada) · Pendiente.

## Épica A — Cuentas

| ID | Historia de usuario | Prio. | Pts | Sprint | Estado |
|---|---|---|---|---|---|
| HU-01 | Como comerciante, quiero crear mi cuenta con correo y contraseña para tener mis datos en un lugar propio | M | 3 | 3 | Hecho |
| HU-02 | Como comerciante, quiero iniciar y cerrar sesión para proteger mi información | M | 3 | 3 | Hecho |
| HU-03 | Como comerciante, quiero que mi sesión se mantenga al recargar la página para no ingresar a cada rato | S | 2 | 3 | Hecho |
| HU-04 | Como comerciante, quiero entrar desde otro dispositivo y ver mis mismos datos | S | 2 | 3 | Hecho (datos en el servidor) |

## Épica B — Inventario

| ID | Historia de usuario | Prio. | Pts | Sprint | Estado |
|---|---|---|---|---|---|
| HU-05 | Quiero registrar un producto con su precio de compra y de venta, stock y categoría para conocer mi ganancia por unidad | M | 5 | 1 | Hecho |
| HU-06 | Quiero ver, buscar, filtrar por categoría y ordenar mis productos para encontrar rápido lo que necesito | M | 5 | 1 | Hecho |
| HU-07 | Quiero editar un producto para corregir precios o datos | M | 2 | 1 | Hecho |
| HU-08 | Quiero eliminar un producto sin perder el historial de ventas pasadas | S | 3 | 3 | Hecho |
| HU-09 | Quiero recibir alertas cuando un producto tiene poco stock para reponer a tiempo | M | 3 | 1 | Hecho |
| HU-10 | Quiero reponer o ajustar el stock y ver el historial de movimientos | S | 5 | 3 | Parcial (la API lo tiene; falta la pantalla en la app) |

## Épica C — Ventas

| ID | Historia de usuario | Prio. | Pts | Sprint | Estado |
|---|---|---|---|---|---|
| HU-11 | Quiero registrar una venta con varios productos y el método de pago, y que el stock baje solo | M | 8 | 2 | Hecho |
| HU-12 | Quiero que no me deje vender más de lo que tengo | M | 3 | 3 | Hecho |
| HU-13 | Quiero ver mi historial de ventas agrupado por día, con filtros por período y método de pago | M | 5 | 2 | Hecho |
| HU-14 | Quiero anular una venta equivocada y que el stock vuelva al inventario | S | 5 | 3 | Hecho |
| HU-15 | Quiero ver cuánto gané en cada venta | S | 3 | 3 | Hecho |
| HU-16 | Quiero registrar devoluciones parciales de una venta | C | 8 | — | Pendiente |

## Épica D — Panel de análisis

| ID | Historia de usuario | Prio. | Pts | Sprint | Estado |
|---|---|---|---|---|---|
| HU-17 | Quiero ver mis ventas del período y si suben o bajan frente al período anterior | M | 5 | 3 | Hecho |
| HU-18 | Quiero ver un gráfico de mis ventas por día | M | 3 | 3 | Hecho |
| HU-19 | Quiero ver mis productos más vendidos | M | 3 | 3 | Hecho |
| HU-20 | Quiero ver los productos que menos se venden | S | 3 | 3 | Parcial (la API lo entrega; falta mostrarlo en pantalla) |
| HU-21 | Quiero ver cuánto invertí y cuánto gané en un gráfico | M | 5 | 3 | Hecho |
| HU-22 | Quiero ver mis ventas por semana o por mes | C | 3 | 3 | Parcial (la API lo entrega; falta la pantalla) |
| HU-23 | Quiero saber cuánto dinero tengo en mercadería y cuánto ganaría si la vendo | C | 3 | 3 | Hecho |

## Épica E — Asistente

| ID | Historia de usuario | Prio. | Pts | Sprint | Estado |
|---|---|---|---|---|---|
| HU-24 | Quiero preguntar en palabras simples (qué reponer, mi mejor día, cuánto gané) y recibir una respuesta con mis datos | M | 8 | 4 | Hecho (con reglas) |
| HU-25 | Quiero que el asistente use inteligencia artificial para entender más preguntas | S | 8 | 4 | Parcial (listo para activar con una clave; falta probarlo con un proveedor) |

## Épica F — Reportes y plataforma

| ID | Historia de usuario | Prio. | Pts | Sprint | Estado |
|---|---|---|---|---|---|
| HU-26 | Quiero exportar mi inventario y mis ventas a Excel (CSV) | S | 3 | 3 | Hecho |
| HU-27 | Quiero imprimir o guardar mis reportes en PDF | C | 2 | 3 | Hecho |
| HU-28 | Quiero instalar la app en mi celular y usarla como una aplicación | S | 5 | 3 | Hecho |
| HU-29 | Quiero que la app esté publicada en internet para usarla desde cualquier lugar | M | 8 | 5 | Pendiente |
| HU-30 | Quiero que la app avise con claridad cuando no hay conexión y guarde mis ventas para enviarlas después | C | 13 | — | Pendiente |

## Épica G — Calidad

| ID | Historia (del equipo) | Prio. | Pts | Sprint | Estado |
|---|---|---|---|---|---|
| HU-31 | Como equipo, queremos pruebas automáticas de la lógica del negocio, de seguridad y de rendimiento | M | 8 | 3 | Hecho |
| HU-32 | Como equipo, queremos probar la app con al menos 5 comerciantes reales | M | 8 | 4–5 | Pendiente |
| HU-33 | Como equipo, queremos documentación técnica y de producto completa | M | 8 | 3–6 | En curso |

## Resumen

| Estado | Historias |
|---|---|
| Hecho | 24 |
| Parcial | 4 |
| En curso | 1 |
| Pendiente | 4 |

Total: 33 historias. Las pendientes más importantes para la entrega final son **HU-29 (publicar)** y **HU-32 (pruebas con usuarios)**.
