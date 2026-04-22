const pool = require('../db/db');

// ─── Zona horaria fija para Chile ─────────────────────────────────
const HOY_SQL = `(CURRENT_TIMESTAMP AT TIME ZONE 'America/Santiago')::date`;

// ─── Mapa de traducción de días inglés → español ──────────────────
const DIAS_ES = {
  'Monday': 'Lunes',
  'Tuesday': 'Martes',
  'Wednesday': 'Miércoles',
  'Thursday': 'Jueves',
  'Friday': 'Viernes',
  'Saturday': 'Sábado',
  'Sunday': 'Domingo',
};

// Orden fijo: Lunes(1) → Domingo(7) para rellenar días fantasma
const SEMANA_COMPLETA = [
  { dia: 'Lunes',     diaNum: 1 },
  { dia: 'Martes',    diaNum: 2 },
  { dia: 'Miércoles', diaNum: 3 },
  { dia: 'Jueves',    diaNum: 4 },
  { dia: 'Viernes',   diaNum: 5 },
  { dia: 'Sábado',    diaNum: 6 },
  { dia: 'Domingo',   diaNum: 7 },
];

// ─────────────────────────────────────────────
// KPIs – 4 queries en paralelo con Promise.all
// ─────────────────────────────────────────────
async function getKPIs(sedeId) {
  const filtroSede = sedeId ? ' AND sede_id = $1' : '';
  const filtroSedeVehiculos = sedeId ? ' WHERE sede_id = $1' : '';
  const params = sedeId ? [sedeId] : [];

  const [estudiantesRes, clasesRes, disponiblesRes, flotaRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'estudiante' AND estado = 'activo'${filtroSede}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM reservas WHERE estado = 'completada'${filtroSede}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM vehiculos WHERE estado = 'disponible'${filtroSede}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM vehiculos${filtroSedeVehiculos}`,
      params
    ),
  ]);

  const disponibles = parseInt(disponiblesRes.rows[0].total, 10);
  const flota = parseInt(flotaRes.rows[0].total, 10);

  return {
    estudiantesActivos: parseInt(estudiantesRes.rows[0].total, 10),
    clasesCompletadas: parseInt(clasesRes.rows[0].total, 10),
    vehiculosDisponibles: `${disponibles}/${flota}`,
  };
}

// ─────────────────────────────────────────────
// Clases del día (hoy o fecha específica)
// ─────────────────────────────────────────────
async function getClasesHoy(sedeId, fecha) {
  const params = [];
  let paramIndex = 1;

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
  `;

  if (fecha) {
    params.push(fecha);
    query += ` WHERE r.fecha_inicio::date = $${paramIndex++}`;
  } else {
    query += ` WHERE r.fecha_inicio::date = ${HOY_SQL}`;
  }

  if (sedeId) {
    params.push(sedeId);
    query += ` AND r.sede_id = $${paramIndex++}`;
  }

  query += ` ORDER BY r.fecha_inicio ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

// ─────────────────────────────────────────────
// Gráfico semanal – con relleno de días fantasma
// ─────────────────────────────────────────────
async function getGraficoSemana(sedeId) {
  let query = `
    SELECT
      s.nombre                             AS sede,
      TO_CHAR(r.fecha_inicio, 'Day')       AS dia,
      EXTRACT(ISODOW FROM r.fecha_inicio)  AS dia_num,
      COUNT(*)                             AS total_clases
    FROM reservas r
    JOIN sedes s ON r.sede_id = s.id
    WHERE r.fecha_inicio::date >= ${HOY_SQL} - INTERVAL '6 days'
      AND r.fecha_inicio::date <= ${HOY_SQL}
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

  // ── Agrupar data real por sede ───────────────
  const dataPorSede = {};
  result.rows.forEach((row) => {
    const sede = row.sede.trim();
    if (!dataPorSede[sede]) dataPorSede[sede] = {};
    const diaNum = parseInt(row.dia_num, 10);
    dataPorSede[sede][diaNum] = parseInt(row.total_clases, 10);
  });

  // ── Rellenar los 7 días para cada sede (días fantasma) ──
  const data = {};
  for (const sede of Object.keys(dataPorSede)) {
    data[sede] = SEMANA_COMPLETA.map(({ dia, diaNum }) => ({
      dia,
      diaNum,
      totalClases: dataPorSede[sede][diaNum] || 0,
    }));
  }

  return data;
}

// ─────────────────────────────────────────────
// Uso de flota por sede
// ─────────────────────────────────────────────
async function getUsoFlota(sedeId) {
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
          WHERE r.fecha_inicio::date = ${HOY_SQL}
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

  return result.rows.map((row) => {
    const enUso = parseInt(row.vehiculos_en_uso, 10);
    const total = parseInt(row.total_flota, 10);
    return {
      sede: row.sede,
      vehiculosEnUso: enUso,
      totalFlota: total,
      porcentajeUso: total > 0 ? parseFloat(((enUso / total) * 100).toFixed(1)) : 0,
    };
  });
}

module.exports = { getKPIs, getClasesHoy, getGraficoSemana, getUsoFlota };
