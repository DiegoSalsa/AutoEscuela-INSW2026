-- =====================================================
-- ACTUALIZAR TIPOS DE CLASE PARA USUARIOS
-- AutoDrive Academy
--
-- Ejecutar en la base de datos real del proyecto.
-- No modifica reservas ni configuracion de puertos.
--
-- Reglas:
-- - Agrega usuarios.tipo_clase si no existe.
-- - Estudiantes quedan con tipo_clase A, B o C.
-- - Instructores quedan con tipo_clase A, B o C.
-- - Instructores quedan ademas con especialidad = 'Clase A/B/C'.
-- - Respeta valores existentes validos cuando ya sean A/B/C o "Clase A/B/C".
-- - Para usuarios sin dato previo, asigna un patron estable por id:
--   B, B, A, B, C, y repite.
-- =====================================================

BEGIN;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS tipo_clase varchar(10);

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS especialidad varchar;

-- Normalizar valores existentes que ya vienen como A/B/C o "Clase A/B/C".
UPDATE usuarios
SET tipo_clase = CASE
  WHEN UPPER(TRIM(tipo_clase)) IN ('A', 'B', 'C') THEN UPPER(TRIM(tipo_clase))
  WHEN UPPER(COALESCE(tipo_clase, '')) LIKE '%CLASE A%' THEN 'A'
  WHEN UPPER(COALESCE(tipo_clase, '')) LIKE '%CLASE B%' THEN 'B'
  WHEN UPPER(COALESCE(tipo_clase, '')) LIKE '%CLASE C%' THEN 'C'
  WHEN UPPER(COALESCE(especialidad, '')) LIKE '%CLASE A%' THEN 'A'
  WHEN UPPER(COALESCE(especialidad, '')) LIKE '%CLASE B%' THEN 'B'
  WHEN UPPER(COALESCE(especialidad, '')) LIKE '%CLASE C%' THEN 'C'
  ELSE NULL
END
WHERE rol IN ('estudiante', 'instructor');

-- Asignar tipo de clase a estudiantes sin dato valido.
WITH estudiantes_sin_tipo AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY sede_id NULLS LAST, id) AS rn
  FROM usuarios
  WHERE rol = 'estudiante'
    AND (tipo_clase IS NULL OR tipo_clase NOT IN ('A', 'B', 'C'))
)
UPDATE usuarios u
SET
  tipo_clase = CASE
    WHEN (e.rn % 5) = 1 THEN 'B'
    WHEN (e.rn % 5) = 2 THEN 'B'
    WHEN (e.rn % 5) = 3 THEN 'A'
    WHEN (e.rn % 5) = 4 THEN 'B'
    ELSE 'C'
  END,
  updated_at = NOW()
FROM estudiantes_sin_tipo e
WHERE u.id = e.id;

-- Asignar tipo de clase a instructores sin dato valido.
WITH instructores_sin_tipo AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY sede_id NULLS LAST, id) AS rn
  FROM usuarios
  WHERE rol = 'instructor'
    AND (tipo_clase IS NULL OR tipo_clase NOT IN ('A', 'B', 'C'))
)
UPDATE usuarios u
SET
  tipo_clase = CASE
    WHEN (i.rn % 5) = 1 THEN 'B'
    WHEN (i.rn % 5) = 2 THEN 'B'
    WHEN (i.rn % 5) = 3 THEN 'A'
    WHEN (i.rn % 5) = 4 THEN 'B'
    ELSE 'C'
  END,
  updated_at = NOW()
FROM instructores_sin_tipo i
WHERE u.id = i.id;

-- Mantener la especialidad de instructores coherente con el tipo de clase.
UPDATE usuarios
SET
  especialidad = 'Clase ' || tipo_clase,
  updated_at = NOW()
WHERE rol = 'instructor'
  AND tipo_clase IN ('A', 'B', 'C');

COMMIT;

-- =====================================================
-- VERIFICACION
-- =====================================================

-- Resumen esperado: solo A, B y C para estudiantes/instructores.
SELECT
  rol,
  tipo_clase,
  COUNT(*) AS total
FROM usuarios
WHERE rol IN ('estudiante', 'instructor')
GROUP BY rol, tipo_clase
ORDER BY rol, tipo_clase;

-- Debe devolver 0.
SELECT
  COUNT(*) AS usuarios_sin_tipo_clase_valido
FROM usuarios
WHERE rol IN ('estudiante', 'instructor')
  AND (tipo_clase IS NULL OR tipo_clase NOT IN ('A', 'B', 'C'));

-- Muestra rapida para revisar en pantalla.
SELECT
  id,
  nombre,
  rol,
  tipo_clase,
  especialidad
FROM usuarios
WHERE rol IN ('estudiante', 'instructor')
ORDER BY rol, id
LIMIT 30;
