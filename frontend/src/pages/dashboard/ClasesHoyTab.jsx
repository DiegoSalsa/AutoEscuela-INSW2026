import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../service/dashboard.Service.js';

const pad2 = (n) => String(n).padStart(2, '0');

function sedeLabel(s) {
  if (s === 'all') return 'Todas las Sedes';
  return s === '1' ? 'Sede Central' : 'Sede Norte';
}

/* ── Estado badge ── */
function EstadoBadge({ estado }) {
  const map = {
    completada:   { color: '#15803d', bg: '#dcfce7', label: 'Completada' },
    confirmada:   { color: '#1d4ed8', bg: '#dbeafe', label: 'Confirmada' },
    en_progreso:  { color: '#002366', bg: '#eff6ff', label: 'En Progreso' },
    pendiente:    { color: '#64748b', bg: '#f1f5f9', label: 'Pendiente' },
    cancelada:    { color: '#dc2626', bg: '#fee2e2', label: 'Cancelada' },
  };
  const s = map[estado] || map.pendiente;
  return (
    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

export default function ClasesHoyTab({ sedeActiva }) {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardService.getClasesHoy(sedeActiva, fecha)
      .then((data) => { if (!cancelled) setClases(data || []); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sedeActiva, fecha]);

  const titleSede = sedeLabel(sedeActiva);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline text-gray-900">Clases del Día</h1>
          <p className="text-sm text-gray-500">Detalle de sesiones programadas — {titleSede}</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-600">Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Clases</p>
          <p className="text-3xl font-black font-headline text-gray-900">{clases.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Completadas</p>
          <p className="text-3xl font-black font-headline" style={{ color: '#15803d' }}>
            {clases.filter((c) => c.estado === 'completada').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">En Progreso / Pendientes</p>
          <p className="text-3xl font-black font-headline text-primary">
            {clases.filter((c) => c.estado === 'en_progreso' || c.estado === 'confirmada' || c.estado === 'pendiente').length}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 font-headline">Detalle de Sesiones</h2>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 p-6">Cargando...</p>
        ) : clases.length === 0 ? (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300 mb-3">
              <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <p className="text-gray-400">No hay clases para esta fecha</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Vehículo</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clases.map((c, i) => {
                  let hora = '', horaFin = '';
                  if (c.fecha_inicio) { const d = new Date(c.fecha_inicio); hora = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
                  if (c.fecha_fin) { const d = new Date(c.fecha_fin); horaFin = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-primary/5 text-primary">
                          {hora}{horaFin ? ` - ${horaFin}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.estudiante || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.instructor || '—'}</td>
                      <td className="px-4 py-3">
                        {c.vehiculo ? (
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{c.vehiculo}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3"><EstadoBadge estado={c.estado} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
