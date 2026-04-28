const { AppDataSource } = require('../db/data-source');

const HOY_SQL = `(CURRENT_TIMESTAMP AT TIME ZONE 'America/Santiago')::date`;

const SEMANA_COMPLETA = [
  { dia: 'Lunes',     diaNum: 1 },
  { dia: 'Martes',    diaNum: 2 },
  { dia: 'Miércoles', diaNum: 3 },
  { dia: 'Jueves',    diaNum: 4 },
  { dia: 'Viernes',   diaNum: 5 },
  { dia: 'Sábado',    diaNum: 6 },
  { dia: 'Domingo',   diaNum: 7 },
];

// KPIs — 4 queries en paralelo con Promise.all
async function getKPIs(sedeId) {
  const rU = AppDataSource.getRepository('Usuario');
  const rR = AppDataSource.getRepository('Reserva');
  const rV = AppDataSource.getRepository('Vehiculo');

  const qE = rU.createQueryBuilder('u').select('COUNT(*)', 'total')
    .where("u.rol = 'estudiante'").andWhere("u.estado = 'activo'");
  const qC = rR.createQueryBuilder('r').select('COUNT(*)', 'total')
    .where("r.estado = 'completada'");
  const qD = rV.createQueryBuilder('v').select('COUNT(*)', 'total')
    .where("v.estado = 'disponible'");
  const qF = rV.createQueryBuilder('v').select('COUNT(*)', 'total');

  if (sedeId) {
    qE.andWhere('u.sede_id = :sedeId', { sedeId });
    qC.andWhere('r.sede_id = :sedeId', { sedeId });
    qD.andWhere('v.sede_id = :sedeId', { sedeId });
    qF.andWhere('v.sede_id = :sedeId', { sedeId });
  }

  const [estRes, clsRes, disRes, fltRes] = await Promise.all([
    qE.getRawOne(), qC.getRawOne(), qD.getRawOne(), qF.getRawOne(),
  ]);

  const d = parseInt(disRes.total, 10);
  const f = parseInt(fltRes.total, 10);

  return {
    estudiantesActivos: parseInt(estRes.total, 10),
    clasesCompletadas: parseInt(clsRes.total, 10),
    vehiculosDisponibles: `${d}/${f}`,
  };
}

// Clases del dia
async function getClasesHoy(sedeId, fecha) {
  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select([
      'r.id AS reserva_id', 'e.nombre AS estudiante', 'i.nombre AS instructor',
      'v.patente AS vehiculo', 'r.estado AS estado',
      'r.fecha_inicio AS fecha_inicio', 'r.fecha_fin AS fecha_fin',
    ])
    .innerJoin('usuarios', 'e', 'r.estudiante_id = e.id')
    .innerJoin('usuarios', 'i', 'r.instructor_id = i.id')
    .innerJoin('vehiculos', 'v', 'r.vehiculo_id = v.id');

  if (fecha) {
    qb.where('r.fecha_inicio::date = :fecha', { fecha });
  } else {
    qb.where(`r.fecha_inicio::date = ${HOY_SQL}`);
  }
  if (sedeId) qb.andWhere('r.sede_id = :sedeId', { sedeId });
  qb.orderBy('r.fecha_inicio', 'ASC');
  return qb.getRawMany();
}

// Grafico semanal — con dias fantasma
async function getGraficoSemana(sedeId) {
  const qS = AppDataSource.getRepository('Sede').createQueryBuilder('s')
    .select(['s.id', 's.nombre']).orderBy('s.nombre', 'ASC');
  if (sedeId) qS.where('s.id = :sedeId', { sedeId });
  const sedes = await qS.getRawMany();

  const data = {};
  sedes.forEach((s) => {
    data[s.s_nombre] = SEMANA_COMPLETA.map(({ dia, diaNum }) => ({
      dia, diaNum, totalClases: 0,
    }));
  });

  const qR = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select([
      's.nombre AS sede',
      'EXTRACT(ISODOW FROM r.fecha_inicio) AS dia_num',
      'COUNT(*) AS total_clases',
    ])
    .innerJoin('sedes', 's', 'r.sede_id = s.id')
    .where(`r.fecha_inicio::date >= ${HOY_SQL} - INTERVAL '6 days'`)
    .andWhere(`r.fecha_inicio::date <= ${HOY_SQL}`)
    .andWhere("r.estado IN ('completada','en_progreso','confirmada')");

  if (sedeId) qR.andWhere('r.sede_id = :sedeId', { sedeId });
  qR.groupBy('s.nombre').addGroupBy('EXTRACT(ISODOW FROM r.fecha_inicio)')
    .orderBy('dia_num', 'ASC');

  const rows = await qR.getRawMany();
  rows.forEach((row) => {
    const sede = row.sede.trim();
    const dN = parseInt(row.dia_num, 10);
    const t = parseInt(row.total_clases, 10);
    if (data[sede]) {
      const d = data[sede].find((x) => x.diaNum === dN);
      if (d) d.totalClases = t;
    }
  });

  return data;
}

// Uso de flota
async function getUsoFlota(sedeId) {
  const qb = AppDataSource.getRepository('Sede').createQueryBuilder('s')
    .select([
      's.nombre AS sede',
      'COUNT(DISTINCT v.id) AS vehiculos_en_uso',
      '(SELECT COUNT(*) FROM vehiculos v2 WHERE v2.sede_id = s.id) AS total_flota',
    ])
    .leftJoin('vehiculos', 'v',
      `v.sede_id = s.id AND (v.estado = 'en_sesion' OR v.id IN (` +
      `SELECT r.vehiculo_id FROM reservas r ` +
      `WHERE r.fecha_inicio::date = ${HOY_SQL} ` +
      `AND r.estado IN ('confirmada','en_progreso')))`
    );
  if (sedeId) qb.where('s.id = :sedeId', { sedeId });
  qb.groupBy('s.id').addGroupBy('s.nombre').orderBy('s.nombre', 'ASC');

  const rows = await qb.getRawMany();
  return rows.map((r) => {
    const u = parseInt(r.vehiculos_en_uso, 10);
    const t = parseInt(r.total_flota, 10);
    return {
      sede: r.sede, vehiculosEnUso: u, totalFlota: t,
      porcentajeUso: t > 0 ? parseFloat(((u / t) * 100).toFixed(1)) : 0,
    };
  });
}

// Reporte avanzado
async function generarReporteAvanzado(fi, ff, sedeId, metricas) {
  const rep = { periodo: { fechaInicio: fi, fechaFin: ff }, sedeId: sedeId || 'todas',
    generadoEn: new Date().toISOString(), metricas: {} };
  const proms = []; const keys = [];

  if (metricas.includes('clases_completadas')) {
    const q = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
      .select('COUNT(*)', 'total').where("r.estado = 'completada'")
      .andWhere('r.fecha_inicio >= :fi::date', { fi })
      .andWhere("r.fecha_fin <= (:ff::date + INTERVAL '1 day')", { ff });
    if (sedeId) q.andWhere('r.sede_id = :sedeId', { sedeId });
    proms.push(q.getRawOne()); keys.push('clases_completadas');
  }
  if (metricas.includes('uso_flota')) {
    const q = AppDataSource.getRepository('Vehiculo').createQueryBuilder('v')
      .select([
        "COUNT(*) FILTER (WHERE v.estado IN ('en_sesion','mantenimiento')) AS vehiculos_ocupados",
        "COUNT(*) FILTER (WHERE v.estado = 'disponible') AS vehiculos_disponibles",
        'COUNT(*) AS total_flota',
      ]);
    if (sedeId) q.where('v.sede_id = :sedeId', { sedeId });
    proms.push(q.getRawOne()); keys.push('uso_flota');
  }

  const res = await Promise.all(proms);
  res.forEach((r, i) => {
    if (keys[i] === 'clases_completadas') {
      rep.metricas.clases_completadas = {
        total: parseInt(r.total, 10),
        descripcion: `Clases completadas entre ${fi} y ${ff}`,
      };
    }
    if (keys[i] === 'uso_flota') {
      const o = parseInt(r.vehiculos_ocupados, 10);
      const d = parseInt(r.vehiculos_disponibles, 10);
      const t = parseInt(r.total_flota, 10);
      rep.metricas.uso_flota = {
        vehiculosOcupados: o, vehiculosDisponibles: d, totalFlota: t,
        porcentajeOcupacion: t > 0 ? parseFloat(((o / t) * 100).toFixed(1)) : 0,
        descripcion: 'Estado actual de la flota de vehículos',
      };
    }
  });
  return rep;
}

// =============== CRUD — Metas KPI ===============

async function crearMeta(datos) {
  const repo = AppDataSource.getRepository('MetaKPI');
  const meta = repo.create({
    metrica_nombre: datos.metrica_nombre,
    valor_esperado: datos.valor_esperado,
    mes_anio: datos.mes_anio,
    sede_id: datos.sede_id || null,
  });
  return repo.save(meta);
}

async function obtenerMetas(filtros = {}) {
  const qb = AppDataSource.getRepository('MetaKPI').createQueryBuilder('m')
    .leftJoin('sedes', 's', 'm.sede_id = s.id')
    .select([
      'm.id AS id', 'm.metrica_nombre AS metrica_nombre',
      'm.valor_esperado AS valor_esperado', 'm.mes_anio AS mes_anio',
      'm.sede_id AS sede_id', 's.nombre AS sede_nombre',
      'm.creado_en AS creado_en', 'm.actualizado_en AS actualizado_en',
    ]);
  if (filtros.mes_anio) qb.where('m.mes_anio = :ma', { ma: filtros.mes_anio });
  if (filtros.sede_id) qb.andWhere('m.sede_id = :si', { si: filtros.sede_id });
  qb.orderBy('m.creado_en', 'DESC');
  return qb.getRawMany();
}

async function actualizarMeta(id, datos) {
  const repo = AppDataSource.getRepository('MetaKPI');
  const meta = await repo.findOneBy({ id: parseInt(id, 10) });
  if (!meta) return null;
  if (datos.metrica_nombre !== undefined) meta.metrica_nombre = datos.metrica_nombre;
  if (datos.valor_esperado !== undefined) meta.valor_esperado = datos.valor_esperado;
  if (datos.mes_anio !== undefined) meta.mes_anio = datos.mes_anio;
  if (datos.sede_id !== undefined) meta.sede_id = datos.sede_id;
  return repo.save(meta);
}

async function eliminarMeta(id) {
  const repo = AppDataSource.getRepository('MetaKPI');
  const meta = await repo.findOneBy({ id: parseInt(id, 10) });
  if (!meta) return null;
  await repo.remove(meta);
  return meta;
}

module.exports = {
  getKPIs, getClasesHoy, getGraficoSemana, getUsoFlota, generarReporteAvanzado,
  crearMeta, obtenerMetas, actualizarMeta, eliminarMeta,
};
