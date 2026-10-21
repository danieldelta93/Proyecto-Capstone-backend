# Arquitectura del backend de Vendix

## Resumen

```
 Celular / navegador                  Servidor                       Datos
┌────────────────────┐   HTTPS    ┌───────────────────────┐      ┌───────────┐
│  Frontend (React   │  ───────►  │  API REST             │ ───► │  MySQL 8  │
│  + PWA)            │  JSON +    │  Node.js + Express    │      └───────────┘
│  repo: ...-frontend│  token JWT │  repo: ...-backend    │ ───► (opcional) proveedor
└────────────────────┘  ◄───────  └───────────────────────┘      de IA (asistente)
```

El frontend nunca habla con la base de datos ni con el proveedor de IA: todo pasa por la API.
Así las contraseñas, la clave de la IA y las reglas del negocio (por ejemplo, "no vender más de lo que hay")
quedan en el servidor y no se pueden saltar desde el navegador.

## Decisiones de tecnología (y por qué)

En el informe de la Fase 1 se plantearon alternativas ("Node.js / Django" y "MySQL / Firebase"). Se eligió:

| Tema | Decisión | Motivo |
|---|---|---|
| Lenguaje y servidor | **Node.js + Express** | El frontend ya es JavaScript (React): el equipo usa un solo lenguaje. Con solo dos integrantes, reduce el esfuerzo de aprendizaje. |
| Base de datos | **MySQL 8 (relacional)** | Las competencias declaradas incluyen *construir modelos de datos* y *programar consultas*. Una base relacional permite claves foráneas, restricciones, transacciones y consultas SQL agregadas para los dashboards. Firebase (NoSQL) habría escondido justo esas competencias. |
| Estilo de API | **REST + JSON** | Es lo que pide el informe y lo más fácil de probar y documentar. |
| Autenticación | **Token JWT** (HS256) firmado con un secreto del servidor | No guarda sesiones en el servidor; el frontend manda `Authorization: Bearer <token>`. |
| Contraseñas | **scrypt** con sal aleatoria (incluido en Node) | Hash lento y estándar; no hay que instalar librerías nativas. Nunca se guardan ni se devuelven en claro. |
| Asistente de IA | **API tipo "chat completions"** (OpenAI o cualquier compatible), opcional | Es la opción del informe ("OpenAI GPT u otra"). Sin clave configurada responde con reglas sobre los datos reales. |

## Capas del código

```
src/
  routes/       Traducen HTTP ↔ funciones (qué URL llama a qué). Casi sin lógica.
  services/     TODA la lógica del negocio y las consultas SQL. No dependen de Express.
  middleware/   Autenticación, límite de intentos y formato de errores.
  db/           Conexión a MySQL (query / execute / transaction).
  utils/        Validaciones, fechas, hash de contraseñas, tokens.
```

Separar así permite probar la lógica del negocio sin levantar el servidor (ver `pruebas/`).

## Reglas de negocio importantes

- **Cada cuenta ve solo sus datos.** Todas las tablas de negocio llevan `usuario_id` y todas las consultas lo filtran.
  Pedir el producto de otra cuenta responde `404`, como si no existiera.
- **El stock nunca queda negativo.** El descuento se hace con un solo `UPDATE ... WHERE stock + delta >= 0`
  dentro de una transacción: si dos ventas llegan a la vez, no pueden vender lo mismo dos veces.
- **Una venta es "todo o nada".** Se guarda la venta, sus ítems y los cambios de stock en una transacción.
  Si un producto no alcanza, se deshace todo.
- **El historial no cambia.** Cada ítem de venta guarda nombre, precio y costo *del momento*. Editar o eliminar
  un producto después no altera ventas pasadas. "Eliminar" un producto solo lo oculta (`activo = 0`).
- **Anular ≠ borrar.** Una venta anulada queda marcada y devuelve el stock; no cuenta en las estadísticas.
- **Todo cambio de stock deja rastro** en `movimientos_stock` (inicial, venta, anulación, reposición, ajuste).
- **Ganancia = precio de venta − precio de compra.** Si un producto no tiene precio de compra (productos antiguos),
  esa venta no se incluye en "invertido" ni "ganancia" y la API lo informa (`ventasSinCosto`); nunca se inventa un valor.
- **Fechas** viajan como `AAAA-MM-DD`. El "hoy" de una venta se calcula en la zona horaria del negocio
  (`ZONA_HORARIA`, por defecto `America/Santiago`).

## Seguridad

- Contraseñas con scrypt; respuestas de login iguales para "correo no existe" y "clave incorrecta".
- Límite de intentos en registro y login (20 por 15 minutos por IP; en memoria, válido para un solo servidor).
- CORS: solo los orígenes de `CORS_ORIGENES`.
- Consultas con parámetros (`?`), no se arma SQL con texto del usuario (excepto números ya validados en `LIMIT`).
- Validación de todos los datos de entrada y tamaño máximo del cuerpo (100 kb).
- `.env` (claves) fuera de GitHub.

## Trazabilidad con el informe de la Fase 1

| Pedido en el informe | Dónde está |
|---|---|
| Objetivo 1: registro de productos (nombre, descripción, precio, stock, categoría) | `POST/GET/PUT/DELETE /api/productos` · `productos.service.js` |
| Objetivo 2: registro de ventas, stock automático, historial, método de pago | `/api/ventas` · `ventas.service.js` · `stock.js` · tabla `movimientos_stock` |
| Validar en todos los casos (ventas, devoluciones) | Stock atómico; **anulación** de ventas (`POST /api/ventas/:id/anular`) |
| Objetivo 3: más/menos vendidos, ventas por día/semana/mes, tendencias, stock bajo | `/api/estadisticas/*` · `estadisticas.service.js` (la tendencia es la variación frente al período anterior) |
| Objetivo 4: asistente de IA que procesa los datos y recomienda | `POST /api/asistente/preguntar` · `asistente.service.js` |
| Objetivo 5: pruebas unitarias del backend e integración | `pruebas/` (`npm test`) y `scripts/smoke.js` (`npm run smoke`) |
| Objetivo 6: documentación técnica (arquitectura, instalación, código comentado) | `README.md` y esta carpeta `docs/` |
| Evidencia: diagrama entidad-relación | `docs/modelo-entidad-relacion.png` (fuente: `docs/er.mmd`) |

## Pendiente / ideas para después

- **Devoluciones parciales** (hoy solo se anula la venta completa).
- **Reportes PDF/Excel generados en el servidor** (hoy el frontend arma el CSV/PDF con los datos que pide a la API).
- **Despliegue** en un servicio en la nube (Render, Railway, etc.) con MySQL administrado y HTTPS.
- Límite de intentos compartido entre varios servidores (por ejemplo con Redis), si algún día se escala.
- Migraciones de base de datos versionadas (hoy `schema.sql` crea todo desde cero).

## Cómo se verificó este código

- `npm test`: **44 pruebas automáticas** de la lógica (usuarios, productos, ventas, estadísticas, asistente).
  Corren sobre **SQLite en memoria** usando el mismo `database/schema.sql` (con dos ajustes de sintaxis).
  Se usa SQLite en las pruebas para no necesitar un servidor MySQL; **la primera vez que se corra contra MySQL real conviene
  ejecutar `npm run smoke`** para confirmar que todo funciona también ahí.
- Las rutas HTTP se revisaron con un flujo completo de punta a punta (registro → productos → ventas → estadísticas →
  asistente → anulación → aislamiento entre cuentas) y `npm run smoke` repite lo esencial contra el servidor real.
