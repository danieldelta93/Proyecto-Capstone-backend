# API de Vendix

Base: `http://localhost:3000/api` · Formato: JSON · Prueba manual: `pruebas.http` (extensión *REST Client* de VS Code).

## Autenticación

Todas las rutas, salvo `/salud`, `/auth/registro` y `/auth/login`, exigen el token en el encabezado:

```
Authorization: Bearer <token>
```

## Formato de errores

```json
{ "error": { "codigo": "STOCK_INSUFICIENTE", "mensaje": "Stock insuficiente de \"Gorro\": quedan 2 y se necesitan 5", "detalles": { "productoId": 1, "disponible": 2, "solicitado": 5 } } }
```

| Estado | Cuándo | Códigos |
|---|---|---|
| 400 | Datos inválidos | `DATOS_INVALIDOS`, `JSON_INVALIDO` |
| 401 | Falta sesión, token inválido o credenciales incorrectas | `NO_AUTORIZADO` |
| 404 | No existe (o es de otra cuenta) | `NO_ENCONTRADO`, `RUTA_NO_ENCONTRADA` |
| 409 | Conflicto con el estado actual | `CORREO_EXISTENTE`, `STOCK_INSUFICIENTE`, `VENTA_YA_ANULADA` |
| 429 | Demasiados intentos de login/registro | `DEMASIADOS_INTENTOS` |
| 500 | Error del servidor | `ERROR_INTERNO` |

## Estado

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/salud` | `{ ok: true, baseDeDatos: "conectada" }` (503 si la base no responde) |

## Cuenta

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/registro` | `{ correo, password (mín. 6), nombreNegocio, nombreDueno }` | 201 `{ token, usuario }` |
| POST | `/auth/login` | `{ correo, password }` | `{ token, usuario }` |
| GET | `/auth/yo` | — | `{ usuario: { id, correo, nombreNegocio, nombreDueno } }` |

## Productos

Un producto: `{ id, nombre, descripcion, categoria, precioCompra, precioVenta, stock, stockMinimo, gananciaUnitaria }`
(`gananciaUnitaria` es `null` si el producto no tiene precio de compra).

| Método | Ruta | Detalle |
|---|---|---|
| GET | `/productos` | Filtros opcionales: `buscar` (nombre o categoría), `categoria`, `stockBajo=1`. Ordenados por nombre. |
| POST | `/productos` | `{ nombre, categoria?, descripcion?, precioCompra, precioVenta, stock?, stockMinimo? }` → 201 |
| GET | `/productos/categorias` | Lista de nombres de categorías en uso |
| GET | `/productos/:id` | Un producto |
| PUT | `/productos/:id` | Cualquier campo del producto (parcial). Si cambia `stock`, queda un "ajuste" en el historial. |
| DELETE | `/productos/:id` | 204. El producto se oculta; sus ventas pasadas se conservan. |
| POST | `/productos/:id/stock` | `{ tipo: "reposicion" \| "ajuste", cantidad, precioCompra?, nota? }`. La reposición es positiva; el ajuste puede ser negativo pero no deja el stock bajo 0. |
| GET | `/productos/:id/movimientos` | Historial de stock (`?limite=50`) |

## Ventas

Una venta: `{ id, fecha, total, metodoPago, estado, creadoEn, items: [{ productoId, nombre, cantidad, precioUnitario, costoUnitario, subtotal }], invertido, ganancia }`
(`invertido` y `ganancia` son `null` si algún ítem no tiene costo conocido).

| Método | Ruta | Detalle |
|---|---|---|
| POST | `/ventas` | `{ metodoPago: "Efectivo" \| "Transferencia" \| "Tarjeta", fecha?: "AAAA-MM-DD", items: [{ productoId, cantidad, precioUnitario? }] }` → 201. El precio y el costo salen de la base (`precioUnitario` solo si se vendió a otro precio). Descuenta el stock; si no alcanza → 409 y no se guarda nada. |
| GET | `/ventas` | Filtros: `desde`, `hasta`, `metodoPago`, `estado` (completada/anulada), `limite` (máx. 500, por defecto 200). Más recientes primero. |
| GET | `/ventas/:id` | Una venta |
| POST | `/ventas/:id/anular` | La marca como anulada y devuelve el stock. |

## Estadísticas (panel)

Solo cuentan ventas completadas. `dias` va de 1 a 366.

| Método | Ruta | Parámetros | Respuesta |
|---|---|---|---|
| GET | `/estadisticas/resumen` | `dias` (7) | `{ desde, hasta, ventas, ingresos, ticketPromedio, invertido, ganancia, margenPct, ventasSinCosto, periodoAnterior, variacionIngresosPct }` |
| GET | `/estadisticas/ventas-por-dia` | `dias` (7) | `[{ fecha, ventas, total, invertido, ganancia }]`, un elemento por día (los días sin ventas en 0) |
| GET | `/estadisticas/ventas-por-periodo` | `agrupar` = dia/semana/mes (dia), `dias` (30) | `[{ periodo, ventas, total, invertido, ganancia }]` (semana desde el lunes) |
| GET | `/estadisticas/productos-mas-vendidos` | `dias` (30), `limite` (5), `orden` = mas/ganancia | `[{ productoId, nombre, cantidad, ingresos, ganancia }]` |
| GET | `/estadisticas/productos-menos-vendidos` | `dias` (30), `limite` (5) | Igual, incluye los que vendieron 0 |
| GET | `/estadisticas/stock-bajo` | — | `[{ productoId, nombre, stock, stockMinimo }]` |
| GET | `/estadisticas/valor-inventario` | — | `{ productos, productosConCosto, productosSinCosto, costo, gananciaPotencial }` |

## Asistente

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/asistente/preguntar` | `{ pregunta }` (máx. 500 caracteres) | `{ respuesta, origen: "ia" \| "reglas" }` |

Con `LLM_API_KEY` configurada usa el proveedor de IA; si no está o si falla, responde con reglas sobre los datos reales
(más vendido, menos vendido, qué reponer, mejor día, cuánto vendí/gané, stock bajo, valor del inventario).
