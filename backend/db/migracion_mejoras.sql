-- =============================================================
-- Migración: Mejoras al sistema de reservas
-- Ejecutar en orden contra la base de datos PostgreSQL
-- =============================================================

-- 1. Agregar columna 'direccion' a la tabla sedes
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);

-- 2. Actualizar las direcciones de las sedes existentes
UPDATE sedes SET nombre = 'Sede Concepción', direccion = 'Av. O''Higgins 1234, Concepción, Región del Biobío' WHERE id = 1;
UPDATE sedes SET nombre = 'Sede Chillán', direccion = 'Calle Constitución 567, Chillán, Región de Ñuble' WHERE id = 2;

-- 3. Crear tabla de tipos de clase
CREATE TABLE IF NOT EXISTS tipos_clase (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  duracion_min INT NOT NULL DEFAULT 60,
  color VARCHAR(7) NOT NULL DEFAULT '#2563eb'
);

-- 4. Insertar tipos de clase iniciales
INSERT INTO tipos_clase (nombre, descripcion, duracion_min, color) VALUES
  ('Clase Teórica',          'Clase en sala sobre normativas de tránsito y señalética vial',     60, '#6366f1'),
  ('Clase Práctica',         'Clase de conducción en vehículo con instructor',                   60, '#2563eb'),
  ('Examen Práctico',        'Evaluación práctica de conducción para certificación',             45, '#f59e0b'),
  ('Clase de Estacionamiento','Práctica especializada en maniobras de estacionamiento',          60, '#10b981')
ON CONFLICT DO NOTHING;

-- 5. Agregar columna tipo_clase_id a la tabla reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tipo_clase_id INT;

-- 6. Crear la relación (foreign key) con la tabla tipos_clase
ALTER TABLE reservas 
  ADD CONSTRAINT fk_reserva_tipo_clase 
  FOREIGN KEY (tipo_clase_id) 
  REFERENCES tipos_clase(id)
  ON DELETE SET NULL;

-- 7. Asignar tipo por defecto ('Clase Práctica', id=2) a reservas existentes
UPDATE reservas SET tipo_clase_id = 2 WHERE tipo_clase_id IS NULL;
