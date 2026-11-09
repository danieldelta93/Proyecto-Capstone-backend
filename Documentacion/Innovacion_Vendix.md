# Innovación del proyecto — Vendix

**Versión 2.0 · Actualizado: noviembre de 2026**

## 1. Qué problema nuevo o poco atendido aborda

La mayoría de las herramientas de gestión están pensadas para negocios formales con computador, caja y facturación. El comercio
ambulante y las pymes pequeñas trabajan desde el celular, sin conocimientos técnicos y con poco tiempo: hoy se apoyan en cuadernos,
planillas o la memoria. Vendix lleva el control de ventas e inventario a ese contexto.

## 2. En qué consiste la innovación (innovación aplicada)

Vendix no inventa una tecnología nueva: combina tecnologías actuales de una forma pensada para un usuario que normalmente queda fuera.

| Elemento | Qué aporta |
|---|---|
| **Ganancia visible desde el primer registro** | Cada producto tiene precio de compra y de venta, y se ve "Ganas $2.000 c/u". Cada venta muestra su ganancia, y el panel muestra cuánto se invirtió y cuánto se ganó, en lenguaje simple |
| **Asistente en lenguaje cotidiano con datos reales** | El comerciante pregunta "¿qué debo reponer?" o "¿cuánto gané esta semana?" y recibe una respuesta con *sus* cifras; no tiene que interpretar gráficos |
| **Aplicación instalable sin tienda de aplicaciones** | Es una PWA: se instala desde el navegador, ocupa poco y se actualiza sola |
| **Diseño mobile-first para no técnicos** | Pocas pantallas, botones grandes, mensajes que explican qué hacer, avisos celebratorios y estados vacíos guiados |
| **Inteligencia artificial opcional y con control** | El asistente funciona con reglas y, si se configura una clave, usa un modelo de IA; la clave vive solo en el servidor y a la IA solo se le envían cifras agregadas del negocio |
| **Integridad de datos pensada para el comercio real** | El stock nunca queda negativo, las ventas son "todo o nada", el historial no cambia si se edita un producto y las ventas se pueden anular |

## 3. Comparación con lo que existe

| Alternativa | Limitación frente a Vendix |
|---|---|
| Cuaderno o memoria | No calcula nada, se pierde, no alerta |
| Planilla (Excel o Google Sheets) | Exige armar fórmulas; incómoda en el celular; no valida el stock |
| Sistemas de punto de venta para tiendas formales | Complejos, pensados para caja, boleta y computador; más costosos |
| Aplicaciones genéricas de inventario | Rara vez muestran la ganancia ni responden preguntas en lenguaje simple |

*(Comparación general de tipos de herramientas, no de productos específicos.)*

## 4. Impacto esperado

- **Social:** ayudar a personas con recursos limitados a formalizar su control y a tomar mejores decisiones con sus propios datos.
- **Económico:** reducir quiebres de stock y compras innecesarias, y saber cuánto se gana realmente.
- **Para el aprendizaje del equipo:** aplicar de punta a punta el diseño de una solución real (frontend, API, base de datos, seguridad, pruebas, documentación).

## 5. Qué se podría hacer a futuro

- Modo sin conexión con sincronización cuando vuelva internet.
- Recomendaciones de reposición con modelos de IA sobre el historial de ventas.
- Lectura de códigos de barras con la cámara del celular.
- Varios usuarios por negocio y control de proveedores.
- Integración con medios de pago y facturación electrónica.
