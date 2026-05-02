const dashboardService = require('../services/dashboard.Service');

// GET /api/dashboard/kpis?sedeId=
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

// GET /api/dashboard/clases-hoy?sedeId=&fecha=YYYY-MM-DD
const getClasesHoy = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const { fecha } = req.query;
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

// GET /api/dashboard/clases-proximas?sedeId=&dias=7
const getClasesProximas = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const dias = parseInt(req.query.dias, 10) || 7;
    const data = await dashboardService.getClasesProximas(sedeId, dias);
    res.json(data);
  } catch (error) {
    console.error('Error en getClasesProximas:', error.message);
    res.status(500).json({ error: 'Error al obtener las clases próximas' });
  }
};

// GET /api/dashboard/vehiculos?sedeId=
const getVehiculos = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const data = await dashboardService.getVehiculos(sedeId);
    res.json(data);
  } catch (error) {
    console.error('Error en getVehiculos:', error.message);
    res.status(500).json({ error: 'Error al obtener los vehículos' });
  }
};

// GET /api/dashboard/grafico-semana?sedeId=
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

// GET /api/dashboard/uso-flota?sedeId=
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

// POST /api/dashboard/reporte-avanzado
const generarReporte = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, sedeId, metricasRequeridas } = req.body;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Los campos fechaInicio y fechaFin son obligatorios (formato YYYY-MM-DD).',
      });
    }
    if (isNaN(new Date(fechaInicio).getTime()) || isNaN(new Date(fechaFin).getTime())) {
      return res.status(400).json({
        error: 'fechaInicio y fechaFin deben ser fechas válidas en formato YYYY-MM-DD.',
      });
    }
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      return res.status(400).json({ error: 'fechaInicio no puede ser mayor que fechaFin.' });
    }
    const parsedSedeId = sedeId ? parseInt(sedeId, 10) : null;
    const metricas = Array.isArray(metricasRequeridas) && metricasRequeridas.length > 0
      ? metricasRequeridas : ['clases_completadas', 'uso_flota'];
    const data = await dashboardService.generarReporteAvanzado(
      fechaInicio, fechaFin, parsedSedeId, metricas
    );
    res.json(data);
  } catch (error) {
    console.error('Error en generarReporte:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte avanzado' });
  }
};

// =============== CRUD — Metas KPI ===============

// POST /api/dashboard/metas
const crearMeta = async (req, res) => {
  try {
    const { metrica_nombre, valor_esperado, mes_anio, sede_id } = req.body;
    if (!metrica_nombre || valor_esperado === undefined || !mes_anio) {
      return res.status(400).json({
        error: 'Los campos metrica_nombre, valor_esperado y mes_anio son obligatorios.',
      });
    }
    const meta = await dashboardService.crearMeta({ metrica_nombre, valor_esperado, mes_anio, sede_id });
    res.status(201).json({ message: 'Meta creada exitosamente', data: meta });
  } catch (error) {
    console.error('Error en crearMeta:', error.message);
    res.status(500).json({ error: 'Error al crear la meta' });
  }
};

// GET /api/dashboard/metas?mes_anio=2026-04&sede_id=1
const obtenerMetas = async (req, res) => {
  try {
    const filtros = {
      mes_anio: req.query.mes_anio || null,
      sede_id: req.query.sede_id || null,
    };
    const data = await dashboardService.obtenerMetas(filtros);
    res.json(data);
  } catch (error) {
    console.error('Error en obtenerMetas:', error.message);
    res.status(500).json({ error: 'Error al obtener las metas' });
  }
};

// PUT /api/dashboard/metas/:id
const actualizarMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = await dashboardService.actualizarMeta(id, req.body);
    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }
    res.json({ message: 'Meta actualizada exitosamente', data: meta });
  } catch (error) {
    console.error('Error en actualizarMeta:', error.message);
    res.status(500).json({ error: 'Error al actualizar la meta' });
  }
};

// DELETE /api/dashboard/metas/:id
const eliminarMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = await dashboardService.eliminarMeta(id);
    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }
    res.json({ message: 'Meta eliminada exitosamente', data: meta });
  } catch (error) {
    console.error('Error en eliminarMeta:', error.message);
    res.status(500).json({ error: 'Error al eliminar la meta' });
  }
};

// GET /api/dashboard/aprobados-reprobados?sedeId=&mes_anio=2026-05
const getAprobadosReprobados = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const mesAnio = req.query.mes_anio || null;
    const data = await dashboardService.getAprobadosReprobados(sedeId, mesAnio);
    res.json(data);
  } catch (error) {
    console.error('Error en getAprobadosReprobados:', error.message);
    res.status(500).json({ error: 'Error al obtener aprobados/reprobados' });
  }
};

// GET /api/dashboard/ocupacion-sede?sedeId=
const getOcupacionSede = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const data = await dashboardService.getOcupacionSede(sedeId);
    res.json(data);
  } catch (error) {
    console.error('Error en getOcupacionSede:', error.message);
    res.status(500).json({ error: 'Error al obtener ocupacion por sede' });
  }
};

// GET /api/dashboard/ingresos?sedeId=&mes_anio=2026-05
const getIngresos = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const mesAnio = req.query.mes_anio || null;
    const data = await dashboardService.getIngresos(sedeId, mesAnio);
    res.json(data);
  } catch (error) {
    console.error('Error en getIngresos:', error.message);
    res.status(500).json({ error: 'Error al obtener ingresos' });
  }
};

// GET /api/dashboard/rendimiento-mes?sedeId=
const getRendimientoMes = async (req, res) => {
  try {
    const sedeId = req.query.sedeId || null;
    const data = await dashboardService.getRendimientoMes(sedeId);
    res.json(data);
  } catch (error) {
    console.error('Error en getRendimientoMes:', error.message);
    res.status(500).json({ error: 'Error al obtener rendimiento del mes' });
  }
};

module.exports = {
  getKPIs, getClasesHoy, getClasesProximas, getVehiculos,
  getGraficoSemana, getUsoFlota, generarReporte,
  getAprobadosReprobados, getOcupacionSede, getIngresos, getRendimientoMes,
  crearMeta, obtenerMetas, actualizarMeta, eliminarMeta,
};

