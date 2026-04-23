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

// ─────────────────────────────────────────────
// POST /api/dashboard/reporte-avanzado
// ─────────────────────────────────────────────
const generarReporte = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, sedeId, metricasRequeridas } = req.body;

    // Validación básica de campos obligatorios
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Los campos fechaInicio y fechaFin son obligatorios (formato YYYY-MM-DD).'
      });
    }

    if (isNaN(new Date(fechaInicio).getTime()) || isNaN(new Date(fechaFin).getTime())) {
      return res.status(400).json({
        error: 'fechaInicio y fechaFin deben ser fechas válidas en formato YYYY-MM-DD.'
      });
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      return res.status(400).json({
        error: 'fechaInicio no puede ser mayor que fechaFin.'
      });
    }

    const parsedSedeId = sedeId ? parseInt(sedeId, 10) : null;
    const metricas = Array.isArray(metricasRequeridas) && metricasRequeridas.length > 0
      ? metricasRequeridas
      : ['clases_completadas', 'uso_flota'];

    const data = await dashboardService.generarReporteAvanzado(
      fechaInicio, fechaFin, parsedSedeId, metricas
    );
    res.json(data);
  } catch (error) {
    console.error('Error en generarReporte:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte avanzado' });
  }
};

module.exports = { getKPIs, getClasesHoy, getGraficoSemana, getUsoFlota, generarReporte };
