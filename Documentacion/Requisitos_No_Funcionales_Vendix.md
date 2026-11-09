# Requisitos no funcionales — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

Los requisitos no funcionales describen **qué tan bien** debe funcionar el sistema (rendimiento, seguridad, usabilidad, etc.), no *qué* hace.
Cada uno tiene una meta medible y una forma de verificarlo.

**Estados:** Cumple (verificado) · Por verificar · Pendiente.

## Rendimiento

| ID | Requisito | Meta | Cómo se verifica | Estado |
|---|---|---|---|---|
| RNF-01 | Listar los productos de un negocio grande | Menos de 500 ms con 1.000 productos | `pruebas/rendimiento.test.js` | Cumple (medido: unos 5 ms en el entorno de desarrollo) |
| RNF-02 | Cálculos del panel | Menos de 1 s con 5.000 ventas en los últimos 90 días | `pruebas/rendimiento.test.js` | Cumple (medido: de 7 a 13 ms en el entorno de desarrollo) |
| RNF-03 | Registrar una venta | Menos de 100 ms en promedio en el servidor | `pruebas/rendimiento.test.js` | Cumple (medido: menos de 1 ms en el entorno de desarrollo) |
| RNF-04 | Carga inicial de la app en celular con 4G | Menos de 3 s | Lighthouse / prueba manual en el celular | Por verificar |

*Nota:* las mediciones se hicieron con base SQLite en memoria; con MySQL y red real serán mayores. La meta se mantiene y debe volver a medirse al publicar.

## Seguridad

| ID | Requisito | Meta | Cómo se verifica | Estado |
|---|---|---|---|---|
| RNF-05 | Contraseñas protegidas | Guardadas con hash scrypt con sal; nunca en claro ni devueltas por la API | `pruebas/seguridad.test.js`, `pruebas/usuarios.test.js` | Cumple |
| RNF-06 | Sesiones seguras | Token JWT firmado con clave de al menos 32 caracteres; vence en 7 días; se rechaza si está manipulado, vencido o sin firma | `pruebas/token.test.js` | Cumple |
| RNF-07 | Aislamiento de datos | Una cuenta nunca ve ni modifica datos de otra | `pruebas/productos.test.js`, `ventas.test.js`, `seguridad.test.js` | Cumple |
| RNF-08 | Protección contra inyección SQL | Todas las consultas usan parámetros; el texto del usuario nunca se ejecuta | `pruebas/seguridad.test.js` | Cumple |
| RNF-09 | Protección contra fuerza bruta | Máximo 20 intentos de inicio de sesión o registro por IP cada 15 minutos | `pruebas/seguridad.test.js` | Cumple |
| RNF-10 | Validación de entradas | Se rechazan datos con tipo o tamaño inesperado | `pruebas/seguridad.test.js` | Cumple |
| RNF-11 | Errores sin filtrar información interna | El cliente solo recibe un mensaje genérico en errores inesperados | `pruebas/seguridad.test.js` | Cumple |
| RNF-12 | Secretos fuera del repositorio | `.env` ignorado por Git; plantilla `.env.example` sin claves | Revisión del repositorio | Cumple |
| RNF-13 | Comunicación cifrada | Toda la comunicación por HTTPS en producción | Al publicar | Pendiente (se hará al publicar) |

## Integridad de los datos

| ID | Requisito | Meta | Cómo se verifica | Estado |
|---|---|---|---|---|
| RNF-14 | Stock nunca negativo | Ninguna venta ni ajuste puede dejar el stock bajo 0, ni siquiera dos al mismo tiempo | Pruebas de ventas y productos; restricción `CHECK` en la base | Cumple |
| RNF-15 | Operaciones "todo o nada" | Si falla una parte de una venta, no queda nada guardado | `pruebas/ventas.test.js` | Cumple |
| RNF-16 | Historial inalterable | Editar o eliminar un producto no cambia las ventas pasadas | `pruebas/ventas.test.js` | Cumple |
| RNF-17 | Respaldo de la base de datos | Respaldo semanal con `mysqldump` (ver Manual técnico) | Revisión del procedimiento | Pendiente (programarlo al publicar) |

## Usabilidad

| ID | Requisito | Meta | Cómo se verifica | Estado |
|---|---|---|---|---|
| RNF-18 | Pensado para celular | Se usa bien con un ancho de pantalla de 360 px | Pruebas visuales a 390 px | Cumple |
| RNF-19 | Registrar una venta es rápido | 4 pasos o menos y menos de 30 segundos | Prueba de usabilidad con usuarios | Por verificar |
| RNF-20 | Lenguaje simple | Sin términos técnicos en pantalla; mensajes de error que explican qué hacer | Revisión del equipo y pruebas con usuarios | Por verificar |
| RNF-21 | Instalable | Se puede instalar en el celular como una aplicación | Prueba manual (Android/Chrome e iPhone/Safari) | Cumple |
| RNF-22 | Legibilidad | Contraste de texto suficiente (AA) y botones de tamaño táctil | Revisión con herramienta de accesibilidad | Por verificar |

## Compatibilidad, disponibilidad y mantenibilidad

| ID | Requisito | Meta | Cómo se verifica | Estado |
|---|---|---|---|---|
| RNF-23 | Navegadores | Funciona en Chrome y Edge actuales; también en Firefox y Safari | Prueba manual | Cumple en Chrome y en otro navegador; Safari por verificar |
| RNF-24 | Disponibilidad | 95 % o más durante los horarios de demostración | Monitoreo al publicar | Pendiente |
| RNF-25 | Código mantenible | Backend en capas (rutas, servicios, base de datos); frontend un componente por carpeta; más de 60 pruebas automáticas | Revisión del código y `npm test` | Cumple |
| RNF-26 | Instalación reproducible | Se levanta todo siguiendo el README o con Docker | `npm run smoke` y `docker compose` | Cumple (Docker por probar en el equipo) |
| RNF-27 | Documentación | Arquitectura, modelo de datos, API, manual técnico y pruebas documentados | Carpeta `Documentacion/` y `docs/` | Cumple |
