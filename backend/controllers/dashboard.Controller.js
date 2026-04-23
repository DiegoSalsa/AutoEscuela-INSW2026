const dashboardService = require('../services/dashboard.Service');

// ─────────────────────────────────────────────
// GET /api/dashboard/kpis?sedeId=
// ─────────────────────────────────────────────
const getKPIs = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const data = await dashboardService.getKPIs(sedeId);
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
    const sedeId = req.query.sedeId || null;
    const { fecha } = req.query;

    // Validar formato de fecha si se proporcionó
    if (fecha && isNaN(new Date(fecha).getTime())) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
    }

    const data = await dashboardService.getClasesHoy(sedeId, fecha);
    res.json(data);
  } catch (error) {
    console.error('Error en getClasesHoy:', error.message);
    res.status(500).json({ error: 'Error al obtener las clases' });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/grafico-semana?sedeId=
// ─────────────────────────────────────────────
const getGraficoSemana = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const data = await dashboardService.getGraficoSemana(sedeId);
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
    const sedeId = req.query.sedeId || null;
    const data = await dashboardService.getUsoFlota(sedeId);
    res.json(data);
  } catch (error) {
    console.error('Error en getUsoFlota:', error.message);
    res.status(500).json({ error: 'Error al obtener el uso de flota' });
  }
};

module.exports = { getKPIs, getClasesHoy, getGraficoSemana, getUsoFlota };
