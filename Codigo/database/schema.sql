-- ============================================================
-- Vendix — esquema de la base de datos (MySQL 8)
--
-- Todas las tablas "de negocio" llevan usuario_id: cada cuenta solo ve
-- sus propios datos (un usuario = un negocio).
-- Los precios están en pesos chilenos (CLP), por eso son enteros.
-- ============================================================

CREATE TABLE usuarios (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  correo         VARCHAR(190) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,          -- nunca se guarda la contraseña en claro
  nombre_dueno   VARCHAR(100) NOT NULL,
  nombre_negocio VARCHAR(120) NOT NULL,
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_correo UNIQUE (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre     VARCHAR(80) NOT NULL,
  CONSTRAINT uq_categorias_usuario_nombre UNIQUE (usuario_id, nombre),
  CONSTRAINT fk_categorias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE productos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT NOT NULL,
  categoria_id  INT NULL,
  nombre        VARCHAR(120) NOT NULL,
  descripcion   VARCHAR(500) NULL,
  precio_compra INT NULL CHECK (precio_compra >= 0),   -- lo que te cuesta; NULL = aún no se conoce
  precio_venta  INT NOT NULL CHECK (precio_venta >= 0), -- lo que cobras
  stock         INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo  INT NOT NULL DEFAULT 3 CHECK (stock_minimo >= 0),
  activo        TINYINT(1) NOT NULL DEFAULT 1,          -- 0 = eliminado (se conserva el historial de ventas)
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios (id)   ON DELETE CASCADE,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ventas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  fecha       DATE NOT NULL,
  total       INT NOT NULL CHECK (total >= 0),
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Transferencia', 'Tarjeta')),
  estado      VARCHAR(12) NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada')),
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  anulada_en  TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detalle de cada venta. Guarda una "foto" del nombre, el precio y el costo
-- del momento, para que el historial no cambie si después editas el producto.
CREATE TABLE venta_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  venta_id        INT NOT NULL,
  producto_id     INT NULL,
  nombre_producto VARCHAR(120) NOT NULL,
  cantidad        INT NOT NULL CHECK (cantidad > 0),
  precio_unitario INT NOT NULL CHECK (precio_unitario >= 0),
  costo_unitario  INT NULL CHECK (costo_unitario >= 0),
  CONSTRAINT fk_items_venta    FOREIGN KEY (venta_id)    REFERENCES ventas (id)    ON DELETE CASCADE,
  CONSTRAINT fk_items_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de cada cambio de stock (ventas, anulaciones, reposiciones, ajustes).
-- cantidad > 0 entra mercadería, cantidad < 0 sale.
CREATE TABLE movimientos_stock (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT NOT NULL,
  producto_id      INT NOT NULL,
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('inicial', 'venta', 'anulacion', 'reposicion', 'ajuste')),
  cantidad         INT NOT NULL,
  stock_resultante INT NOT NULL,
  venta_id         INT NULL,
  nota             VARCHAR(200) NULL,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios (id)  ON DELETE CASCADE,
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_venta    FOREIGN KEY (venta_id)    REFERENCES ventas (id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para las consultas más usadas (listados y dashboards)
CREATE INDEX idx_productos_usuario ON productos (usuario_id, activo);
CREATE INDEX idx_ventas_usuario_fecha ON ventas (usuario_id, fecha);
CREATE INDEX idx_items_venta ON venta_items (venta_id);
CREATE INDEX idx_items_producto ON venta_items (producto_id);
CREATE INDEX idx_mov_producto ON movimientos_stock (producto_id, creado_en);
