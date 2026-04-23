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
// Gráfico semanal – a prueba de sedes vacías
// ─────────────────────────────────────────────
async function getGraficoSemana(sedeId) {
  // 1. Obtener TODAS las sedes (o la filtrada)
  let sedesQuery = `SELECT id, nombre FROM sedes`;
  const sedesParams = [];
  if (sedeId) {
    sedesQuery += ` WHERE id = $1`;
    sedesParams.push(sedeId);
  }
  sedesQuery += ` ORDER BY nombre`;
  const sedesResult = await pool.query(sedesQuery, sedesParams);

  // 2. Inicializar TODAS las sedes con 7 días en 0
  const data = {};
  sedesResult.rows.forEach((sede) => {
    data[sede.nombre] = SEMANA_COMPLETA.map(({ dia, diaNum }) => ({
      dia,
      diaNum,
      totalClases: 0,
    }));
  });

  // 3. Consultar reservas agrupadas por sede y día
  let reservasQuery = `
    SELECT
      s.nombre                             AS sede,
      EXTRACT(ISODOW FROM r.fecha_inicio)  AS dia_num,
      COUNT(*)                             AS total_clases
    FROM reservas r
    JOIN sedes s ON r.sede_id = s.id
    WHERE r.fecha_inicio::date >= ${HOY_SQL} - INTERVAL '6 days'
      AND r.fecha_inicio::date <= ${HOY_SQL}
      AND r.estado IN ('completada', 'en_progreso', 'confirmada')
  `;

  const reservasParams = [];
  if (sedeId) {
    reservasParams.push(sedeId);
    reservasQuery += ` AND r.sede_id = $1`;
  }

  reservasQuery += `
    GROUP BY s.nombre, EXTRACT(ISODOW FROM r.fecha_inicio)
    ORDER BY dia_num ASC
  `;

  const reservasResult = await pool.query(reservasQuery, reservasParams);

  // 4. Rellenar los datos reales sobre la estructura inicializada
  reservasResult.rows.forEach((row) => {
    const sede = row.sede.trim();
    const diaNum = parseInt(row.dia_num, 10);
    const total = parseInt(row.total_clases, 10);

    if (data[sede]) {
      const diaObj = data[sede].find((d) => d.diaNum === diaNum);
      if (diaObj) diaObj.totalClases = total;
    }
  });

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

// ─────────────────────────────────────────────
// Reporte Avanzado – POST bajo demanda
// ─────────────────────────────────────────────
async function generarReporteAvanzado(fechaInicio, fechaFin, sedeId, metricasRequeridas) {
  const reporte = {
    periodo: { fechaInicio, fechaFin },
    sedeId: sedeId || 'todas',
    generadoEn: new Date().toISOString(),
    metricas: {}
  };

  // ── Construir promesas dinámicamente según las métricas solicitadas ──
  const promesas = [];
  const claves = [];

  // Métrica: clases_completadas
  if (metricasRequeridas.includes('clases_completadas')) {
    const params = [fechaInicio, fechaFin];
    let query = `
      SELECT COUNT(*) AS total
      FROM reservas
      WHERE estado = 'completada'
        AND fecha_inicio >= $1::date
        AND fecha_fin <= ($2::date + INTERVAL '1 day')
    `;
    if (sedeId) {
      params.push(sedeId);
      query += ` AND sede_id = $${params.length}`;
    }

    promesas.push(pool.query(query, params));
    claves.push('clases_completadas');
  }

  // Métrica: uso_flota
  if (metricasRequeridas.includes('uso_flota')) {
    const params = [];
    let query = `
      SELECT
        COUNT(*) FILTER (WHERE estado IN ('en_sesion', 'mantenimiento')) AS vehiculos_ocupados,
        COUNT(*) FILTER (WHERE estado = 'disponible') AS vehiculos_disponibles,
        COUNT(*) AS total_flota
      FROM vehiculos
    `;
    if (sedeId) {
      params.push(sedeId);
      query += ` WHERE sede_id = $1`;
    }

    promesas.push(pool.query(query, params));
    claves.push('uso_flota');
  }

  // ── Ejecutar todas las queries en paralelo ──
  const resultados = await Promise.all(promesas);

  // ── Mapear resultados a sus claves correspondientes ──
  resultados.forEach((result, index) => {
    const clave = claves[index];

    if (clave === 'clases_completadas') {
      reporte.metricas.clases_completadas = {
        total: parseInt(result.rows[0].total, 10),
        descripcion: `Clases completadas entre ${fechaInicio} y ${fechaFin}`
      };
    }

    if (clave === 'uso_flota') {
      const row = result.rows[0];
      const ocupados = parseInt(row.vehiculos_ocupados, 10);
      const disponibles = parseInt(row.vehiculos_disponibles, 10);
      const total = parseInt(row.total_flota, 10);
      reporte.metricas.uso_flota = {
        vehiculosOcupados: ocupados,
        vehiculosDisponibles: disponibles,
        totalFlota: total,
        porcentajeOcupacion: total > 0 ? parseFloat(((ocupados / total) * 100).toFixed(1)) : 0,
        descripcion: 'Estado actual de la flota de vehículos'
      };
    }
  });

  return reporte;
}

module.exports = { getKPIs, getClasesHoy, getGraficoSemana, getUsoFlota, generarReporteAvanzado };
