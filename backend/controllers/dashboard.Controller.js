const dashboardService = require('../services/dashboard.Service');
const NodeCache = require('node-cache');

// ─── Caché en memoria: TTL 5 minutos, chequeo cada 60s ───
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Genera una clave de caché única basada en el nombre del endpoint y parámetros.
 */
const cacheKey = (prefix, params = {}) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}:${v}`)
    .sort()
    .join('|');
  return `${prefix}:${parts || 'all'}`;
};

// ─────────────────────────────────────────────
// GET /api/dashboard/kpis?sedeId=
// ─────────────────────────────────────────────
const getKPIs = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const key = cacheKey('kpis', { sedeId });

    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const data = await dashboardService.getKPIs(sedeId);
    cache.set(key, data);
    res.json(data);
  } catch (error) {
    console.error('Error en getKPIs:', error.message);
    res.status(500).json({ error: 'Error al obtener los KPIs' });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/clases-hoy?sedeId=&fecha=YYYY-MM-DD
// ─────────────────────────────────────────────
const getClasesHoy = async (req, res) => {
  try {
    const { sedeId, fecha } = req.query;
    const key = cacheKey('clases-hoy', { sedeId, fecha });

    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const data = await dashboardService.getClasesHoy(sedeId, fecha);
    cache.set(key, data);
    res.json(data);
  } catch (error) {
    console.error('Error en getClasesHoy:', error.message);
    res.status(500).json({ error: 'Error al obtener las clases' });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/grafico-semana?sedeId=&dias=7
// ─────────────────────────────────────────────
const getGraficoSemana = async (req, res) => {
  try {
    const { sedeId, dias } = req.query;
    const key = cacheKey('grafico-semana', { sedeId, dias });

    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const data = await dashboardService.getGraficoSemana(sedeId, dias);
    cache.set(key, data);
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
    const { sedeId } = req.query;
    const key = cacheKey('uso-flota', { sedeId });

    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const data = await dashboardService.getUsoFlota(sedeId);
    cache.set(key, data);
    res.json(data);
  } catch (error) {
    console.error('Error en getUsoFlota:', error.message);
    res.status(500).json({ error: 'Error al obtener el uso de flota' });
  }
};

module.exports = { getKPIs, getClasesHoy, getGraficoSemana, getUsoFlota };
