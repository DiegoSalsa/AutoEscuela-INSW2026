const pool = require('../db/db');

const crearReservaTransaccional = async (reservaData) => {
  const { estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin } = reservaData;
  const client = await pool.connect();

  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    // 1. Validar estudiante
    const estudianteCheck = await client.query(
      `SELECT id FROM usuarios WHERE id = $1 AND rol = 'estudiante' AND estado = 'activo' AND sede_id = $2`,
      [estudianteId, sedeId]
    );
    if (estudianteCheck.rows.length === 0) {
      const error = new Error('El estudiante no existe, no está activo o no pertenece a esta sede.');
      error.status = 404;
      throw error;
    }

    // 2. Validar instructor (activo y misma sede)
    const instructorCheck = await client.query(
      `SELECT id FROM usuarios WHERE id = $1 AND rol = 'instructor' AND estado = 'activo' AND sede_id = $2`,
      [instructorId, sedeId]
    );
    if (instructorCheck.rows.length === 0) {
      const error = new Error('El instructor no existe, no está activo o no pertenece a esta sede.');
      error.status = 404;
      throw error;
    }

    // 3. Validar vehículo (debe estar disponible y pertenecer a la sede)
    const vehiculoCheck = await client.query(
      `SELECT id FROM vehiculos WHERE id = $1 AND sede_id = $2 AND estado = 'disponible'`,
      [vehiculoId, sedeId]
    );
    if (vehiculoCheck.rows.length === 0) {
      const error = new Error('El vehículo no existe, no está disponible o no pertenece a esta sede.');
      error.status = 404;
      throw error;
    }

    // 4. Verificar conflictos con OVERLAPS
    const conflictQuery = `
      SELECT id FROM reservas
      WHERE estado IN ('confirmada', 'en_progreso', 'proxima')
        AND (
          instructor_id = $1
          OR vehiculo_id = $2
          OR estudiante_id = $5
        )
        AND (fecha_inicio, fecha_fin) OVERLAPS ($3::timestamp, $4::timestamp)
    `;
    const conflictParams = [instructorId, vehiculoId, fechaInicio, fechaFin, estudianteId];
    const conflictResult = await client.query(conflictQuery, conflictParams);

    if (conflictResult.rows.length > 0) {
      const error = new Error('Conflicto de horario: el instructor, vehículo o estudiante ya tiene una reserva en ese lapso.');
      error.status = 409;
      throw error;
    }

    // 5. Insertar reserva
    const insertQuery = `
      INSERT INTO reservas (estudiante_id, instructor_id, vehiculo_id, sede_id, fecha_inicio, fecha_fin, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')
      RETURNING *
    `;
    const result = await client.query(insertQuery, [estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin]);

    await client.query('COMMIT');
    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '40001') {
      const concError = new Error('Alta concurrencia: El recurso fue tomado por otra operación. Intenta de nuevo.');
      concError.status = 409;
      throw concError;
    }
    throw error;
  } finally {
    client.release();
  }
};

// Obtener reservas con filtros (para el calendario)
const obtenerReservas = async (filtros) => {
  const { fechaInicio, fechaFin, sedeId, instructorId, vehiculoId, estudianteId } = filtros;
  let query = `
    SELECT
      r.id,
      r.fecha_inicio,
      r.fecha_fin,
      r.estado,
      r.sede_id,
      s.nombre AS sede_nombre,
      e.id AS estudiante_id,
      e.nombre AS estudiante_nombre,
      i.id AS instructor_id,
      i.nombre AS instructor_nombre,
      v.id AS vehiculo_id,
      v.patente,
      v.modelo
    FROM reservas r
    JOIN sedes s ON r.sede_id = s.id
    JOIN usuarios e ON r.estudiante_id = e.id
    JOIN usuarios i ON r.instructor_id = i.id
    JOIN vehiculos v ON r.vehiculo_id = v.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (fechaInicio) {
    query += ` AND r.fecha_inicio >= $${idx++}`;
    params.push(fechaInicio);
  }
  if (fechaFin) {
    query += ` AND r.fecha_fin <= $${idx++}`;
    params.push(fechaFin);
  }
  if (sedeId) {
    query += ` AND r.sede_id = $${idx++}`;
    params.push(sedeId);
  }
  if (instructorId) {
    query += ` AND r.instructor_id = $${idx++}`;
    params.push(instructorId);
  }
  if (vehiculoId) {
    query += ` AND r.vehiculo_id = $${idx++}`;
    params.push(vehiculoId);
  }
  if (estudianteId) {
    query += ` AND r.estudiante_id = $${idx++}`;
    params.push(estudianteId);
  }

  query += ` ORDER BY r.fecha_inicio ASC`;

  const result = await pool.query(query, params);
  return result.rows;
};

// Obtener horarios ocupados
const obtenerHorariosOcupados = async (filtros) => {
  const { fechaInicio, fechaFin, sedeId, instructorId, vehiculoId } = filtros;
  let query = `
    SELECT fecha_inicio, fecha_fin, instructor_id, vehiculo_id, estudiante_id
    FROM reservas
    WHERE estado IN ('confirmada', 'en_progreso', 'proxima')
  `;
  const params = [];
  let idx = 1;

  if (fechaInicio) {
    query += ` AND fecha_inicio >= $${idx++}`;
    params.push(fechaInicio);
  }
  if (fechaFin) {
    query += ` AND fecha_fin <= $${idx++}`;
    params.push(fechaFin);
  }
  if (sedeId) {
    query += ` AND sede_id = $${idx++}`;
    params.push(sedeId);
  }
  if (instructorId) {
    query += ` AND instructor_id = $${idx++}`;
    params.push(instructorId);
  }
  if (vehiculoId) {
    query += ` AND vehiculo_id = $${idx++}`;
    params.push(vehiculoId);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

module.exports = { crearReservaTransaccional, obtenerReservas, obtenerHorariosOcupados };