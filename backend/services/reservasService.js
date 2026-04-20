const pool = require('../db/db');

const crearReservaTransaccional = async (reservaData) => {
  const { estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin } = reservaData;
  const client = await pool.connect();

  try {
    // 1. Iniciamos la transacción con el máximo nivel de aislamiento
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    // 2. Buscamos solapamientos (condición de carrera)
    const checkQuery = `
      SELECT id FROM reservas
      WHERE (instructor_id = $1 OR vehiculo_id = $2)
        AND estado IN ('confirmada', 'en_progreso', 'proxima')
        AND (fecha_inicio < $4 AND fecha_fin > $3)
    `;
    const checkParams = [instructorId, vehiculoId, fechaInicio, fechaFin];
    const { rows } = await client.query(checkQuery, checkParams);

    if (rows.length > 0) {
      await client.query('ROLLBACK');
      const error = new Error('Solapamiento: Instructor o vehículo ocupados en este horario.');
      error.status = 409; // Conflicto
      throw error;
    }

    // 3. Insertamos la reserva
    const insertQuery = `
      INSERT INTO reservas (estudiante_id, instructor_id, vehiculo_id, sede_id, fecha_inicio, fecha_fin, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')
      RETURNING *;
    `;
    const insertParams = [estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin];
    const result = await client.query(insertQuery, insertParams);

    // 4. Confir mamos los cambios
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