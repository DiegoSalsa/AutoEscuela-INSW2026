const pool = require('../db/db');

// horas por defecto 
const HORAS_REQUERIDAS = 40;

// GET /api/estudiantes/:id - perfil estudiante + hora practica
async function getPerfilEstudiante(estudianteId) {
  try {
    // 1. obtener datos del estudiante
    const estudianteResult = await pool.query(
      `SELECT 
        id,
        nombre,
        email,
        telefono,
        rut,
        sede_id,
        estado,
        created_at,
        rol
      FROM usuarios
      WHERE id = $1 AND rol = 'estudiante'`,
      [estudianteId]
    );

    if (estudianteResult.rows.length === 0) {
      const error = new Error('Estudiante no encontrado');
      error.status = 404;
      throw error;
    }

    const estudiante = estudianteResult.rows[0];

    // 2 obtener sede del estudiante
    const sedeResult = await pool.query(
      `SELECT id, nombre FROM sedes WHERE id = $1`,
      [estudiante.sede_id]
    );
    const sede = sedeResult.rows[0] || { id: estudiante.sede_id, nombre: 'Sede desconocida' };

    // 3. calcular horas practicas completadas 
    const horasResult = await pool.query(
      `SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) / 3600), 0) AS horas_completadas,
        COUNT(*) AS total_clases
      FROM reservas
      WHERE estudiante_id = $1 AND estado = 'completada'`,
      [estudianteId]
    );

    const { horas_completadas, total_clases } = horasResult.rows[0];
    const horasCompletadas = parseFloat(horas_completadas.toFixed(2));

    // 4. obtener ultimas 3 clases 
    const clasesResult = await pool.query(
      `SELECT 
        r.id,
        r.fecha_inicio,
        r.fecha_fin,
        r.estado,
        i.nombre AS instructor_nombre,
        v.marca AS vehiculo_marca,
        v.modelo AS vehiculo_modelo,
        v.patente AS vehiculo_patente
      FROM reservas r
      LEFT JOIN usuarios i ON r.instructor_id = i.id
      LEFT JOIN vehiculos v ON r.vehiculo_id = v.id
      WHERE r.estudiante_id = $1
      ORDER BY r.fecha_inicio DESC
      LIMIT 3`,
      [estudianteId]
    );

    return {
      id: estudiante.id,
      nombre: estudiante.nombre,
      email: estudiante.email,
      telefono: estudiante.telefono,
      rut: estudiante.rut,
      estado: estudiante.estado,
      created_at: estudiante.created_at,
      sede: sede,
      horasPracticas: {
        completadas: horasCompletadas,
        requeridas: HORAS_REQUERIDAS,
        falta: Math.max(0, HORAS_REQUERIDAS - horasCompletadas),
        porcentaje: Math.round((horasCompletadas / HORAS_REQUERIDAS) * 100)
      },
      totalClases: parseInt(total_clases),
      ultimasClases: clasesResult.rows
    };

  } catch (error) {
    throw error;
  }
}

// GET /api/estudiantes?sedeId=&q=busqueda  busqueda global de estudiante
async function buscarEstudiantes(sedeId, q) {
  try {
    let query = `
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.rut,
        u.sede_id,
        u.estado,
        s.nombre AS sede_nombre,
        COUNT(r.id) AS total_clases,
        COALESCE(SUM(EXTRACT(EPOCH FROM (r.fecha_fin - r.fecha_inicio)) / 3600), 0) AS horas_totales
      FROM usuarios u
      LEFT JOIN sedes s ON u.sede_id = s.id
      LEFT JOIN reservas r ON u.id = r.estudiante_id AND r.estado = 'completada'
      WHERE u.rol = 'estudiante'
    `;

    const params = [];
    let paramCount = 1;

    // filtro por sede
    if (sedeId) {
      query += ` AND u.sede_id = $${paramCount}`;
      params.push(sedeId);
      paramCount++;
    }

    // filtro por busqueda (nombre, email, rut)
    if (q) {
      query += ` AND (u.nombre ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.rut ILIKE $${paramCount})`;
      params.push(`%${q}%`);
      paramCount++;
    }

    query += ` GROUP BY u.id, s.id ORDER BY u.nombre ASC LIMIT 50`;

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      rut: row.rut,
      estado: row.estado,
      sede: {
        id: row.sede_id,
        nombre: row.sede_nombre
      },
      totalClases: parseInt(row.total_clases),
      horasTotales: parseFloat(row.horas_totales.toFixed(2))
    }));

  } catch (error) {
    throw error;
  }
}

// POST /api/estudiantes - crear estudiante
async function crearEstudiante(estudianteData) {
  const { nombre, email, telefono, rut, sedeId } = estudianteData;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. validar que la sede exista
    const sedeCheck = await client.query(
      `SELECT id FROM sedes WHERE id = $1`,
      [sedeId]
    );

    if (sedeCheck.rows.length === 0) {
      const error = new Error('La sede no existe');
      error.status = 404;
      throw error;
    }

    // 2. validar que el email no exista
    const emailCheck = await client.query(
      `SELECT id FROM usuarios WHERE email = $1`,
      [email]
    );

    if (emailCheck.rows.length > 0) {
      const error = new Error('El email ya está registrado');
      error.status = 409;
      throw error;
    }

    // 3. validar que el rut no exista
    const rutCheck = await client.query(
      `SELECT id FROM usuarios WHERE rut = $1`,
      [rut]
    );

    if (rutCheck.rows.length > 0) {
      const error = new Error('El RUT ya está registrado');
      error.status = 409;
      throw error;
    }

    // 4. insertar el nuevo estudiante
    const insertResult = await client.query(
      `INSERT INTO usuarios (nombre, email, telefono, rut, sede_id, rol, estado)
       VALUES ($1, $2, $3, $4, $5, 'estudiante', 'activo')
       RETURNING id, nombre, email, telefono, rut, sede_id, estado, created_at, rol`,
      [nombre, email, telefono, rut, sedeId]
    );

    await client.query('COMMIT');

    const nuevoEstudiante = insertResult.rows[0];

    return {
      id: nuevoEstudiante.id,
      nombre: nuevoEstudiante.nombre,
      email: nuevoEstudiante.email,
      telefono: nuevoEstudiante.telefono,
      rut: nuevoEstudiante.rut,
      estado: nuevoEstudiante.estado,
      sede_id: nuevoEstudiante.sede_id,
      created_at: nuevoEstudiante.created_at,
      mensaje: 'Estudiante registrado exitosamente'
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getPerfilEstudiante, buscarEstudiantes, crearEstudiante };
