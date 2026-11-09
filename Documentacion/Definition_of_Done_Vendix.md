# Definition of Done (DoD) y criterios de aceptación — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

## 1. Definition of Done

Una historia de usuario se considera **terminada** solo si cumple *todo* lo siguiente:

**Funcionalidad**
- [ ] Cumple los criterios de aceptación de la historia (sección 2).
- [ ] Funciona de punta a punta: pantalla → API → base de datos.
- [ ] Maneja los errores con mensajes claros en español (por ejemplo, "Stock insuficiente de Gorro: quedan 2").

**Calidad**
- [ ] Tiene pruebas automáticas de la lógica nueva y todas las pruebas existentes pasan (`npm test`).
- [ ] La prueba de humo (`npm run smoke`) pasa con la API encendida.
- [ ] Se probó en el celular o en un ancho de pantalla de celular y en al menos dos navegadores.
- [ ] Los datos de una cuenta no se pueden ver ni modificar desde otra.

**Código**
- [ ] Está revisado por la otra persona del equipo (o se explicó en la reunión).
- [ ] Sigue la estructura del proyecto (frontend: un componente por carpeta con su CSS; backend: rutas → servicios → base de datos).
- [ ] No hay claves, contraseñas ni archivos `.env` en el repositorio.
- [ ] Está subido a GitHub con un mensaje de commit que describe el cambio.

**Documentación**
- [ ] Si cambió la API, se actualizó `docs/API.md`.
- [ ] Si cambió la base de datos, se actualizaron `database/schema.sql` y el diagrama entidad-relación.
- [ ] El estado de la historia se actualizó en el Product Backlog y en el Sprint Backlog.

## 2. Criterios de aceptación (ejemplos por historia)

**HU-05 — Registrar un producto con precio de compra y de venta**
- *Dado* que estoy con sesión iniciada, *cuando* guardo un producto con compra $3.000 y venta $5.000, *entonces* aparece en mi inventario con "Ganas $2.000 c/u".
- *Dado* que dejo vacío el precio de compra, *cuando* intento guardar, *entonces* el botón queda desactivado.
- *Dado* que vendo bajo el costo (compra $5.000, venta $3.000), *cuando* escribo los precios, *entonces* se muestra un aviso en rojo.

**HU-11 y HU-12 — Registrar una venta y no vender más de lo que hay**
- *Dado* un producto con 10 unidades, *cuando* vendo 3, *entonces* el stock queda en 7 y la venta aparece en el historial del día.
- *Dado* un producto con 2 unidades, *cuando* intento vender 5, *entonces* el sistema rechaza la venta, muestra cuánto stock queda y no cambia nada.
- *Dado* una venta con varios productos donde uno no alcanza, *cuando* la confirmo, *entonces* no se descuenta el stock de ninguno.

**HU-14 — Anular una venta**
- *Dado* una venta de 3 unidades, *cuando* la anulo, *entonces* el stock vuelve a su valor anterior, la venta se ve tachada y deja de sumar en los totales.
- *Dado* una venta ya anulada, *cuando* intento anularla otra vez, *entonces* el sistema lo rechaza.

**HU-21 — Ver inversión y ganancia**
- *Dado* ventas de productos con precio de compra, *cuando* abro el panel, *entonces* veo lo invertido, la ganancia y el margen, y *invertido + ganancia = total vendido*.
- *Dado* ventas de productos sin precio de compra, *cuando* abro el panel, *entonces* esas ventas no cuentan en la ganancia y el panel lo avisa.

**HU-02 — Iniciar sesión**
- *Dado* un correo y contraseña correctos, *cuando* inicio sesión, *entonces* entro a mi negocio y veo mis datos.
- *Dado* una contraseña incorrecta, *cuando* inicio sesión, *entonces* veo "Correo o contraseña incorrectos" (el mismo mensaje si el correo no existe).
- *Dado* que mi sesión venció, *cuando* uso la app, *entonces* vuelvo a la pantalla de inicio de sesión.

**HU-24 — Preguntar al asistente**
- *Dado* que tengo ventas registradas, *cuando* pregunto "¿Cuánto gané esta semana?", *entonces* la respuesta usa mis cifras reales de los últimos 7 días.
- *Dado* que no tengo ventas, *cuando* pregunto lo mismo, *entonces* me dice que todavía no hay datos y no inventa cifras.
