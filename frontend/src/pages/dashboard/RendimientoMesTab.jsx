import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../service/dashboard.Service.js';

function sedeLabel(s) {
  if (s === 'all') return 'Todas las Sedes';
  return s === '1' ? 'Sede Central' : 'Sede Norte';
}

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

export default function RendimientoMesTab({ sedeActiva }) {
  const [data, setData] = useState(null);
  const [ocupacion, setOcupacion] = useState([]);
  const [ingresos, setIngresos] = useState(null);
  const [aprobados, setAprobados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const ahora = new Date();
    const mesAnio = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    Promise.all([
      dashboardService.getRendimientoMes(sedeActiva),
      dashboardService.getOcupacionSede(sedeActiva),
      dashboardService.getIngresos(sedeActiva, mesAnio),
      dashboardService.getAprobadosReprobados(sedeActiva, mesAnio),
    ]).then(([rend, ocup, ing, apr]) => {
      if (cancelled) return;
      setData(rend); setOcupacion(ocup || []); setIngresos(ing); setAprobados(apr);
    }).catch(console.error).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sedeActiva]);

  const titleSede = sedeLabel(sedeActiva);

  if (loading) return <p className="p-8 text-gray-500">Cargando rendimiento...</p>;
  if (!data) return <p className="p-8 text-gray-500">No hay datos disponibles.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline text-gray-900">Rendimiento del Mes</h1>
        <p className="text-sm text-gray-500 capitalize">{data.mes} -- {titleSede}</p>
      </div>

      {/* KPI Cards principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Estudiantes Activos</p>
          <p className="text-3xl font-black font-headline text-primary">{data.estudiantesActivos}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Clases Completadas (Mes)</p>
          <p className="text-3xl font-black font-headline text-secondary">{data.clasesCompletadasMes}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tasa de Aprobacion</p>
          <p className="text-3xl font-black font-headline" style={{color: data.tasaAprobacion >= 70 ? '#15803d' : '#dc2626'}}>{data.tasaAprobacion}%</p>
          <p className="text-xs text-gray-400 mt-1">{data.aprobados} aprobados / {data.reprobados} reprobados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ingresos del Mes</p>
          <p className="text-3xl font-black font-headline text-primary">{formatCLP(data.ingresosMes)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.totalPagos} transacciones</p>
        </div>
      </div>

      {/* Aprobados vs Reprobados detalle */}
      {aprobados && aprobados.porTipo && aprobados.porTipo.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold font-headline text-gray-900 mb-4">Resultados de Examenes por Tipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aprobados.porTipo.map((tipo) => (
              <div key={tipo.tipo} className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 capitalize mb-3">Examen {tipo.tipo}</h3>
                <div className="flex items-center space-x-6 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-black text-green-600">{tipo.aprobados}</p>
                    <p className="text-xs text-gray-500">Aprobados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-red-500">{tipo.reprobados}</p>
                    <p className="text-xs text-gray-500">Reprobados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-700">{tipo.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all" style={{
                    width: `${tipo.tasaAprobacion}%`,
                    background: tipo.tasaAprobacion >= 70 ? '#16a34a' : tipo.tasaAprobacion >= 50 ? '#f59e0b' : '#dc2626',
                  }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{tipo.tasaAprobacion}% aprobacion</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ocupacion de vehiculos por sede */}
      {ocupacion.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold font-headline text-gray-900 mb-4">Ocupacion de Vehiculos por Sede</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3 text-center">En Sesion</th>
                  <th className="px-4 py-3 text-center">Mantenimiento</th>
                  <th className="px-4 py-3 text-center">Disponibles</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">% Ocupacion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ocupacion.map((s) => (
                  <tr key={s.sedeId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.sede}</td>
                    <td className="px-4 py-3 text-center"><span className="font-bold text-primary">{s.enSesion}</span></td>
                    <td className="px-4 py-3 text-center"><span className="font-bold" style={{color:'#FF5722'}}>{s.enMantenimiento}</span></td>
                    <td className="px-4 py-3 text-center"><span className="font-bold text-green-600">{s.disponibles}</span></td>
                    <td className="px-4 py-3 text-center font-bold">{s.total}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{width:`${s.porcentajeOcupacion}%`}}></div>
                        </div>
                        <span className="font-bold text-xs text-primary">{s.porcentajeOcupacion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ingresos por concepto */}
      {ingresos && ingresos.porConcepto && ingresos.porConcepto.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold font-headline text-gray-900 mb-4">Ingresos por Concepto</h2>
          <div className="space-y-3">
            {ingresos.porConcepto.map((c, i) => {
              const pct = ingresos.totalIngresos > 0 ? ((c.total / ingresos.totalIngresos) * 100).toFixed(1) : 0;
              return (
                <div key={i} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{c.concepto}</span>
                      <span className="text-sm font-bold text-gray-900">{formatCLP(c.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{width:`${pct}%`}}></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
            <span className="font-bold text-gray-800">Total</span>
            <span className="font-black text-lg text-primary">{formatCLP(ingresos.totalIngresos)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
