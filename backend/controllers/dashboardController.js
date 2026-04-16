const pool = require('../db/db');

// Mapa de traducción de días inglés → español
const DIAS_ES = {
  'Monday': 'Lunes',
  'Tuesday': 'Martes',
  'Wednesday': 'Miércoles',
  'Thursday': 'Jueves',
  'Friday': 'Viernes',
  'Saturday': 'Sábado',
  'Sunday': 'Domingo',
};

// ─────────────────────────────────────────────
// GET /api/dashboard/kpis?sedeId=
// ─────────────────────────────────────────────
const getKPIs = async (req, res) => {
  try {
    const sedeId = req.query.sedeId;

    // 1) Estudiantes activos
    const estudiantesQuery = sedeId
      ? `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'estudiante' AND estado = 'activo' AND sede_id = $1`
      : `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'estudiante' AND estado = 'activo'`;
    const estudiantesResult = await pool.query(estudiantesQuery, sedeId ? [sedeId] : []);

    // 2) Total de clases completadas
    const clasesQuery = sedeId
      ? `SELECT COUNT(*) AS total FROM reservas WHERE estado = 'completada' AND sede_id = $1`
      : `SELECT COUNT(*) AS total FROM reservas WHERE estado = 'completada'`;
    const clasesResult = await pool.query(clasesQuery, sedeId ? [sedeId] : []);

    // 3) Vehículos disponibles / flota total
    const disponiblesQuery = sedeId
      ? `SELECT COUNT(*) AS total FROM vehiculos WHERE estado = 'disponible' AND sede_id = $1`
      : `SELECT COUNT(*) AS total FROM vehiculos WHERE estado = 'disponible'`;
    const disponiblesResult = await pool.query(disponiblesQuery, sedeId ? [sedeId] : []);

    const flotaQuery = sedeId
      ? `SELECT COUNT(*) AS total FROM vehiculos WHERE sede_id = $1`
      : `SELECT COUNT(*) AS total FROM vehiculos`;
    const flotaResult = await pool.query(flotaQuery, sedeId ? [sedeId] : []);

    const disponibles = parseInt(disponiblesResult.rows[0].total, 10);
    const flota = parseInt(flotaResult.rows[0].total, 10);

    res.json({
      estudiantesActivos: parseInt(estudiantesResult.rows[0].total, 10),
      clasesCompletadas: parseInt(clasesResult.rows[0].total, 10),
      vehiculosDisponibles: `${disponibles}/${flota}`,
    });
  } catch (error) {
    console.error('Error en getKPIs:', error.message);
    res.status(500).json({ error: 'Error al obtener los KPIs' });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/clases-hoy?sedeId=
// ─────────────────────────────────────────────
const getClasesHoy = async (req, res) => {
  try {
    const sedeId = req.query.sedeId;

    let query = `
      SELECT
        r.id          AS reserva_id,
        e.nombre      AS estudiante,
        i.nombre      AS instructor,
        v.patente     AS vehiculo,
        r.estado      AS estado,
        r.fecha_inicio,
        r.fecha_fin
      FROM reservas r
      JOIN usuarios e  ON r.estudiante_id  = e.id
      JOIN usuarios i  ON r.instructor_id  = i.id
      JOIN vehiculos v ON r.vehiculo_id    = v.id
      WHERE r.fecha_inicio::date = CURRENT_DATE
    `;

    const params = [];
    if (sedeId) {
      params.push(sedeId);
      query += ` AND r.sede_id = $1`;
    }

    query += ` ORDER BY r.fecha_inicio ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getClasesHoy:', error.message);
    res.status(500).json({ error: 'Error al obtener las clases de hoy' });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/grafico-semana?sedeId=
// ─────────────────────────────────────────────
const getGraficoSemana = async (req, res) => {
  try {
    const sedeId = req.query.sedeId;

    let query = `
      SELECT
        s.nombre                             AS sede,
        TO_CHAR(r.fecha_inicio, 'Day')       AS dia,
        EXTRACT(ISODOW FROM r.fecha_inicio)  AS dia_num,
        COUNT(*)                             AS total_clases
      FROM reservas r
      JOIN sedes s ON r.sede_id = s.id
      WHERE r.fecha_inicio::date >= CURRENT_DATE - INTERVAL '6 days'
        AND r.fecha_inicio::date <= CURRENT_DATE
        AND r.estado IN ('completada', 'en_progreso', 'confirmada')
    `;

    const params = [];
    if (sedeId) {
      params.push(sedeId);
      query += ` AND r.sede_id = $1`;
    }

    query += `
      GROUP BY s.nombre, TO_CHAR(r.fecha_inicio, 'Day'), EXTRACT(ISODOW FROM r.fecha_inicio)
      ORDER BY dia_num ASC
    `;

    const result = await pool.query(query, params);

    // Formatear: agrupar por sede
    const data = {};
    result.rows.forEach((row) => {
      const sede = row.sede.trim();
      if (!data[sede]) data[sede] = [];
      const diaEn = row.dia.trim();
      data[sede].push({
        dia: DIAS_ES[diaEn] || diaEn,
        diaNum: parseInt(row.dia_num, 10),
        totalClases: parseInt(row.total_clases, 10),
      });
    });

    res.json(data);
  } catch (error) {
    console.error('Error en getGraficoSemana:', error.message);
    res.status(500).json({ error: 'Error al obtener el gráfico semanal' });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/uso-flota?sedeId=
// ─────────────────────────────────────────────
const getUsoFlota = async (req, res) => {
  try {
    const sedeId = req.query.sedeId;

    // Vehículos en uso: estado 'en_sesion' O con reserva activa hoy
    let query = `
      SELECT
        s.nombre                     AS sede,
        COUNT(DISTINCT v.id)         AS vehiculos_en_uso,
        (SELECT COUNT(*) FROM vehiculos v2 WHERE v2.sede_id = s.id) AS total_flota
      FROM sedes s
      LEFT JOIN vehiculos v ON v.sede_id = s.id
        AND (
          v.estado = 'en_sesion'
          OR v.id IN (
            SELECT r.vehiculo_id
            FROM reservas r
            WHERE r.fecha_inicio::date = CURRENT_DATE
              AND r.estado IN ('confirmada', 'en_progreso')
          )
        )
    `;

    const params = [];
    if (sedeId) {
      params.push(sedeId);
      query += ` WHERE s.id = $1`;
    }

    query += ` GROUP BY s.id, s.nombre ORDER BY s.nombre`;

    const result = await pool.query(query, params);

    const data = result.rows.map((row) => {
      const enUso = parseInt(row.vehiculos_en_uso, 10);
      const total = parseInt(row.total_flota, 10);
      return {
        sede: row.sede,
        vehiculosEnUso: enUso,
        totalFlota: total,
        porcentajeUso: total > 0 ? parseFloat(((enUso / total) * 100).toFixed(1)) : 0,
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error en getUsoFlota:', error.message);
    res.status(500).json({ error: 'Error al obtener el uso de flota' });
  }
};

module.exports = { getKPIs, getClasesHoy, getGraficoSemana, getUsoFlota };
