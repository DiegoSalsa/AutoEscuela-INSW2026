const pool = require('../db/db');

const crearReservaTransaccional = async (reservaData) => {
  const { estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin } = reservaData;
  const client = await pool.connect();

  try {
    // 1. Iniciamos la transacción con el máximo nivel de aislamiento
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    // 2. Verificar que los recursos existen y pertenecen a la sede
    const checkEstudianteExiste = await client.query(
      `SELECT id FROM usuarios WHERE id = $1 AND rol = 'estudiante' AND estado = 'activo'`,
      [estudianteId]
    );
    if (checkEstudianteExiste.rows.length === 0) {
      const error = new Error('El estudiante no existe o no está activo.');
      error.status = 404;
      throw error;
    }

    const checkInstructorExiste = await client.query(
      `SELECT id FROM usuarios WHERE id = $1 AND rol = 'instructor' AND estado = 'activo' AND sede_id = $2`,
      [instructorId, sedeId]
    );
    if (checkInstructorExiste.rows.length === 0) {
      const error = new Error('El instructor no existe, no está activo o no pertenece a la sede indicada.');
      error.status = 404;
      throw error;
    }

    const checkVehiculoExiste = await client.query(
      `SELECT id FROM vehiculos WHERE id = $1 AND sede_id = $2`,
      [vehiculoId, sedeId]
    );
    if (checkVehiculoExiste.rows.length === 0) {
      const error = new Error('El vehículo no existe o no pertenece a la sede indicada.');
      error.status = 404;
      throw error;
    }

    // 3. Buscamos solapamientos de instructor, vehículo Y estudiante (condición de carrera)
    const checkQuery = `
      SELECT id FROM reservas
      WHERE (instructor_id = $1 OR vehiculo_id = $2 OR estudiante_id = $5)
        AND estado IN ('confirmada', 'en_progreso', 'proxima')
        AND (fecha_inicio < $4 AND fecha_fin > $3)
    `;
    const checkParams = [instructorId, vehiculoId, fechaInicio, fechaFin, estudianteId];
    const { rows } = await client.query(checkQuery, checkParams);

    if (rows.length > 0) {
      const error = new Error('Solapamiento: El instructor, vehículo o estudiante ya tienen una reserva en este horario.');
      error.status = 409; // Conflicto
      throw error;
    }

    // 4. Insertamos la reserva
    const insertQuery = `
      INSERT INTO reservas (estudiante_id, instructor_id, vehiculo_id, sede_id, fecha_inicio, fecha_fin, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')
      RETURNING *;
    `;
    const insertParams = [estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin];
    const result = await client.query(insertQuery, insertParams);

    // 5. Confirmamos los cambios
    await client.query('COMMIT');
    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    
    // Capturamos la excepción específica de concurrencia de PostgreSQL (Serialization Failure)
    if (error.code === '40001') {
      const concError = new Error('Alta concurrencia: El recurso fue tomado por otra operación. Intenta de nuevo.');
      concError.status = 409;
      throw concError;
    }
    throw error;
  } finally {
    // Liberar la conexión es sagrado
    client.release();
  }
};

module.exports = { crearReservaTransaccional };