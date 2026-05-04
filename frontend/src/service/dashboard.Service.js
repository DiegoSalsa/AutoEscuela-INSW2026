const API_BASE = '/api/dashboard';

function buildSedeParam(sedeId) {
  // Backend expects no sedeId param (or null) for "all sedes"
  if (!sedeId || sedeId === 'all') return '';
  return `sedeId=${encodeURIComponent(sedeId)}`;
}

export const dashboardService = {

  // GET /api/dashboard/kpis?sedeId=
  getDashboardKPIs: async (sedeId = 'all') => {
    try {
      const sp = buildSedeParam(sedeId);
      const url = `${API_BASE}/kpis${sp ? '?' + sp : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener KPIs');
      return await response.json();
    } catch (error) {
      console.error('getDashboardKPIs:', error);
      return { estudiantesActivos: 0, clasesCompletadas: 0, vehiculosDisponibles: '0/0' };
    }
  },

  // GET /api/dashboard/clases-hoy?sedeId=&fecha=
  getClasesHoy: async (sedeId = 'all', fecha = null) => {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') params.set('sedeId', sedeId);
      if (fecha) params.set('fecha', fecha);
      const qs = params.toString();
      const url = `${API_BASE}/clases-hoy${qs ? '?' + qs : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener Clases de hoy');
      return await response.json();
    } catch (error) {
      console.error('getClasesHoy:', error);
      return [];
    }
  },

  // GET /api/dashboard/clases-proximas?sedeId=&dias=7
  getClasesProximas: async (sedeId = 'all', dias = 7) => {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') params.set('sedeId', sedeId);
      params.set('dias', dias);
      const qs = params.toString();
      const url = `${API_BASE}/clases-proximas${qs ? '?' + qs : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener clases próximas');
      return await response.json();
    } catch (error) {
      console.error('getClasesProximas:', error);
      return [];
    }
  },

  // GET /api/dashboard/vehiculos?sedeId=
  getVehiculos: async (sedeId = 'all') => {
    try {
      const sp = buildSedeParam(sedeId);
      const url = `${API_BASE}/vehiculos${sp ? '?' + sp : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener vehículos');
      return await response.json();
    } catch (error) {
      console.error('getVehiculos:', error);
      return [];
    }
  },

  // GET /api/dashboard/uso-flota?sedeId=
  getUsoFlota: async (sedeId = 'all') => {
    try {
      const sp = buildSedeParam(sedeId);
      const url = `${API_BASE}/uso-flota${sp ? '?' + sp : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener Uso de Flota');
      return await response.json();
    } catch (error) {
      console.error('getUsoFlota:', error);
      return [];
    }
  },

  // GET /api/dashboard/grafico-semana?sedeId=
  getGraficoSemana: async (sedeId = 'all') => {
    try {
      const sp = buildSedeParam(sedeId);
      const url = `${API_BASE}/grafico-semana${sp ? '?' + sp : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener gráfico semanal');
      return await response.json();
    } catch (error) {
      console.error('getGraficoSemana:', error);
      return {};
    }
  },

  // ─── METAS CRUD ───

  // GET /api/dashboard/metas?sede_id=&mes_anio=
  obtenerMetas: async (sedeId = 'all', mesAnio = null) => {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') params.set('sede_id', sedeId);
      if (mesAnio) params.set('mes_anio', mesAnio);
      const qs = params.toString();
      const url = `${API_BASE}/metas${qs ? '?' + qs : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener Metas');
      return await response.json();
    } catch (error) {
      console.error('obtenerMetas:', error);
      return [];
    }
  },

  // POST /api/dashboard/metas
  crearMeta: async (datos) => {
    try {
      const response = await fetch(`${API_BASE}/metas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al crear Meta');
      return await response.json();
    } catch (error) {
      console.error('crearMeta:', error);
      return null;
    }
  },

  // PUT /api/dashboard/metas/:id
  actualizarMeta: async (id, datos) => {
    try {
      const response = await fetch(`${API_BASE}/metas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al actualizar Meta');
      return await response.json();
    } catch (error) {
      console.error('actualizarMeta:', error);
      return null;
    }
  },

  // DELETE /api/dashboard/metas/:id
  eliminarMeta: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/metas/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar Meta');
      return true;
    } catch (error) {
      console.error('eliminarMeta:', error);
      return false;
    }
  },

  // POST /api/dashboard/reporte-avanzado
  generarReporte: async (fechaInicio, fechaFin, sedeId = null, metricasRequeridas = null) => {
    try {
      const body = { fechaInicio, fechaFin };
      if (sedeId && sedeId !== 'all') body.sedeId = sedeId;
      if (metricasRequeridas) body.metricasRequeridas = metricasRequeridas;
      const response = await fetch(`${API_BASE}/reporte-avanzado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Error al generar reporte');
      return await response.json();
    } catch (error) {
      console.error('generarReporte:', error);
      return null;
    }
  },

  // GET /api/dashboard/aprobados-reprobados?sedeId=&mes_anio=
  getAprobadosReprobados: async (sedeId = 'all', mesAnio = null) => {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') params.set('sedeId', sedeId);
      if (mesAnio) params.set('mes_anio', mesAnio);
      const qs = params.toString();
      const url = `${API_BASE}/aprobados-reprobados${qs ? '?' + qs : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      return await response.json();
    } catch (error) {
      console.error('getAprobadosReprobados:', error);
      return { aprobados: 0, reprobados: 0, total: 0, tasaAprobacion: 0, porTipo: [] };
    }
  },

  // GET /api/dashboard/ocupacion-sede?sedeId=
  getOcupacionSede: async (sedeId = 'all') => {
    try {
      const sp = buildSedeParam(sedeId);
      const url = `${API_BASE}/ocupacion-sede${sp ? '?' + sp : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      return await response.json();
    } catch (error) {
      console.error('getOcupacionSede:', error);
      return [];
    }
  },

  // GET /api/dashboard/ingresos?sedeId=&mes_anio=
  getIngresos: async (sedeId = 'all', mesAnio = null) => {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') params.set('sedeId', sedeId);
      if (mesAnio) params.set('mes_anio', mesAnio);
      const qs = params.toString();
      const url = `${API_BASE}/ingresos${qs ? '?' + qs : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      return await response.json();
    } catch (error) {
      console.error('getIngresos:', error);
      return { totalIngresos: 0, totalPagos: 0, porConcepto: [], porSede: [] };
    }
  },

  // GET /api/dashboard/rendimiento-mes?sedeId=
  getRendimientoMes: async (sedeId = 'all') => {
    try {
      const sp = buildSedeParam(sedeId);
      const url = `${API_BASE}/rendimiento-mes${sp ? '?' + sp : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      return await response.json();
    } catch (error) {
      console.error('getRendimientoMes:', error);
      return null;
    }
  },
};

export const obtenerInventarioFlota = async (sedeId = null) => {
    try {
        const parametroSede = sedeId ? `?sedeId=${sedeId}` : '';
        const respuesta = await fetch(`/api/dashboard/vehiculos${parametroSede}`);
        if (!respuesta.ok) throw new Error('Error al conectar con el servidor');
        return await respuesta.json();
    } catch (error) {
        console.error("Error en obtenerInventarioFlota:", error);
        return [];
    }
};

