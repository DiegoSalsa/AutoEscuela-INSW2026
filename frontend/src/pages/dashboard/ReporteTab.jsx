import React, { useState } from 'react';
import { dashboardService } from '../../service/dashboard.Service.js';
import * as XLSX from 'xlsx';

function sedeLabel(s) {
  if (s === 'all') return 'Todas las Sedes';
  return s === '1' ? 'Sede Central' : 'Sede Norte';
}

const METRICAS_DISPONIBLES = [
  { id: 'clases_completadas', label: 'Clases Completadas', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  )},
  { id: 'uso_flota', label: 'Uso de Flota', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
  )},
  { id: 'aprobados_reprobados', label: 'Aprobados vs Reprobados', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  )},
];

function agregarFilaDetalle(filas, categoria, indicador, valor, unidad = '') {
  filas.push({ Categoria: categoria, Indicador: indicador, Valor: valor, Unidad: unidad });
}

function exportarExcel(reporte) {
  if (!reporte) return;

  const periodo = `${reporte.periodo?.fechaInicio || ''} a ${reporte.periodo?.fechaFin || ''}`;
  const sede = reporte.sedeId === 'todas' ? 'Todas las sedes' : `Sede ${reporte.sedeId}`;
  const generado = new Date(reporte.generadoEn).toLocaleString('es-CL');

  const resumen = [
    ['Reporte Avanzado - AutoDrive Academy'],
    ['Periodo', periodo],
    ['Sede', sede],
    ['Generado', generado],
    [],
    ['Categoria', 'Indicador', 'Valor', 'Unidad'],
  ];

  const detalles = [];

  if (reporte.metricas?.clases_completadas) {
    const total = reporte.metricas.clases_completadas.total;
    resumen.push(['Clases Completadas', 'Total', total, 'clases']);
    agregarFilaDetalle(detalles, 'Clases Completadas', 'Total', total, 'clases');
  }

  if (reporte.metricas?.uso_flota) {
    const uf = reporte.metricas.uso_flota;
    const filas = [
      ['Vehiculos ocupados', uf.vehiculosOcupados, 'vehiculos'],
      ['Vehiculos disponibles', uf.vehiculosDisponibles, 'vehiculos'],
      ['Total flota', uf.totalFlota, 'vehiculos'],
      ['Ocupacion', uf.porcentajeOcupacion, '%'],
    ];
    filas.forEach(([indicador, valor, unidad]) => {
      resumen.push(['Uso de Flota', indicador, valor, unidad]);
      agregarFilaDetalle(detalles, 'Uso de Flota', indicador, valor, unidad);
    });
  }

  if (reporte.metricas?.aprobados_reprobados) {
    const ar = reporte.metricas.aprobados_reprobados;
    const filas = [
      ['Aprobados', ar.aprobados, 'examenes'],
      ['Reprobados', ar.reprobados, 'examenes'],
      ['Total examenes', ar.total, 'examenes'],
      ['Tasa aprobacion', ar.tasaAprobacion, '%'],
    ];
    filas.forEach(([indicador, valor, unidad]) => {
      resumen.push(['Aprobados vs Reprobados', indicador, valor, unidad]);
      agregarFilaDetalle(detalles, 'Aprobados vs Reprobados', indicador, valor, unidad);
    });
  }

  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: 'Reporte Avanzado - AutoDrive Academy',
    Subject: 'Indicadores operativos',
    Author: 'AutoDrive Academy',
    CreatedDate: new Date(),
  };

  const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
  wsResumen['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];
  wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  wsResumen['!autofilter'] = { ref: `A6:D${Math.max(resumen.length, 6)}` };

  const wsDetalle = XLSX.utils.json_to_sheet(detalles);
  wsDetalle['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 14 }];
  wsDetalle['!autofilter'] = { ref: `A1:D${Math.max(detalles.length + 1, 1)}` };

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

  const filename = `reporte_operativo_${reporte.periodo?.fechaInicio}_${reporte.periodo?.fechaFin}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export default function ReporteTab({ sedeActiva }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [metricasSeleccionadas, setMetricasSeleccionadas] = useState(
    ['clases_completadas', 'uso_flota', 'aprobados_reprobados']
  );
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleMetrica = (id) => {
    setMetricasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleGenerar = async (e) => {
    e.preventDefault();
    setError('');
    if (!fechaInicio || !fechaFin) { setError('Debes seleccionar fecha de inicio y fin.'); return; }
    if (new Date(fechaInicio) > new Date(fechaFin)) { setError('La fecha de inicio no puede ser mayor que la fecha fin.'); return; }
    if (metricasSeleccionadas.length === 0) { setError('Selecciona al menos una metrica.'); return; }

    setLoading(true);
    const result = await dashboardService.generarReporte(fechaInicio, fechaFin, sedeActiva, metricasSeleccionadas);
    setLoading(false);
    if (result) { setReporte(result); } else { setError('Error al generar el reporte.'); }
  };

  const titleSede = sedeLabel(sedeActiva);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline text-gray-900">Reporte Avanzado</h1>
        <p className="text-sm text-gray-500">Genera reportes operativos con exportacion a Excel -- {titleSede}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2 text-primary">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          Configurar Reporte
        </h2>
        <form onSubmit={handleGenerar} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metricas a incluir</label>
            <div className="flex flex-wrap gap-3">
              {METRICAS_DISPONIBLES.map((m) => {
                const selected = metricasSeleccionadas.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggleMetrica(m.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      selected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                    {selected && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-sm text-red-600">{error}</p></div>}

          <div className="flex space-x-3">
            <button type="submit" disabled={loading}
              className="bg-primary hover:bg-secondary text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span>Generando...</span></>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg><span>Generar Reporte</span></>
              )}
            </button>
            {reporte && (
              <button type="button" onClick={() => exportarExcel(reporte)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                <span>Exportar Excel</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {reporte && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-headline text-gray-900">Resultado del Reporte</h2>
            <span className="text-xs text-gray-400">Generado: {new Date(reporte.generadoEn).toLocaleString('es-CL')}</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-6 text-sm">
            <div><span className="text-gray-500">Periodo:</span><span className="ml-2 font-semibold text-gray-800">{reporte.periodo?.fechaInicio} - {reporte.periodo?.fechaFin}</span></div>
            <div><span className="text-gray-500">Sede:</span><span className="ml-2 font-semibold text-gray-800">{reporte.sedeId === 'todas' ? 'Todas' : `Sede ${reporte.sedeId}`}</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reporte.metricas?.clases_completadas && (
              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-2">Clases Completadas</h3>
                <p className="text-4xl font-black font-headline text-primary mb-1">{reporte.metricas.clases_completadas.total}</p>
                <p className="text-xs text-gray-500">{reporte.metricas.clases_completadas.descripcion}</p>
              </div>
            )}

            {reporte.metricas?.uso_flota && (
              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-3">Uso de Flota</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Ocupados</span><span className="font-bold" style={{color:'#FF5722'}}>{reporte.metricas.uso_flota.vehiculosOcupados}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Disponibles</span><span className="font-bold text-green-600">{reporte.metricas.uso_flota.vehiculosDisponibles}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-bold">{reporte.metricas.uso_flota.totalFlota}</span></div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between"><span className="text-gray-600">% Ocupacion</span><span className="font-bold text-primary">{reporte.metricas.uso_flota.porcentajeOcupacion}%</span></div>
                </div>
              </div>
            )}

            {reporte.metricas?.aprobados_reprobados && (
              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-3">Aprobados vs Reprobados</h3>
                <div className="flex items-end space-x-4 mb-3">
                  <div><p className="text-3xl font-black font-headline text-green-600">{reporte.metricas.aprobados_reprobados.aprobados}</p><p className="text-xs text-gray-500">Aprobados</p></div>
                  <div><p className="text-3xl font-black font-headline text-red-500">{reporte.metricas.aprobados_reprobados.reprobados}</p><p className="text-xs text-gray-500">Reprobados</p></div>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-600">Tasa de Aprobacion</span>
                  <span className="font-bold text-green-600">{reporte.metricas.aprobados_reprobados.tasaAprobacion}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{width:`${reporte.metricas.aprobados_reprobados.tasaAprobacion}%`}}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
