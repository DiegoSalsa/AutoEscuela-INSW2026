import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../service/dashboard.Service.js';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const pad2 = (n) => String(n).padStart(2, '0');
const hoyStr = () => new Date().toISOString().split('T')[0];

function sedeLabel(s) {
  if (s === 'all') return 'Todas las Sedes';
  return s === '1' ? 'Sede Central' : 'Sede Norte';
}

/* ── Donut Chart ── */
function DonutChart({ clasesComp }) {
  const maxClases = Math.max(clasesComp, 50);
  const pct = Math.round((clasesComp / maxClases) * 100);
  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (pct / 100) * circumference;
  const [animOffset, setAnimOffset] = useState(circumference);

  useEffect(() => {
    const t = setTimeout(() => setAnimOffset(offset), 200);
    return () => clearTimeout(t);
  }, [offset]);

  return (
    <div className="flex flex-col items-center justify-center md:w-1/2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Horas Practicas Completadas</p>
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="transform -rotate-90 w-44 h-44" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="68" stroke="#e5e7eb" strokeWidth="14" fill="transparent" />
          <circle cx="80" cy="80" r="68" stroke="#FF5722" strokeWidth="14" fill="transparent" strokeLinecap="round"
            style={{ strokeDasharray: circumference, strokeDashoffset: animOffset, transition: 'stroke-dashoffset 1.5s ease-in-out' }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-black font-headline text-gray-900">{clasesComp}</span>
          <span className="text-xs text-gray-400 mt-0.5">de ~{maxClases}</span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-3" style={{ color: '#FF5722' }}>{pct}% COMPLETADO</p>
    </div>
  );
}

/* ── KPI Row ── */
function KpiRow({ icon, label, value, borderBottom = true }) {
  return (
    <div className={`flex items-center space-x-3 py-2.5 ${borderBottom ? 'border-b border-gray-50' : ''}`}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: icon.bg }}>{icon.svg}</div>
      <div className="flex-1"><p className="text-sm text-gray-700">{label}</p></div>
      <span className="text-lg font-bold font-headline text-gray-900" style={icon.valueStyle || {}}>{value}</span>
    </div>
  );
}

/* ── Timeline ── */
function TimelineSection({ clases }) {
  if (!clases || clases.length === 0) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300 mb-3">
          <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        <p className="text-gray-400 text-sm">No hay clases programadas</p>
      </div>
    );
  }

  const grouped = {};
  clases.forEach((c) => { const dk = new Date(c.fecha_inicio).toISOString().split('T')[0]; if (!grouped[dk]) grouped[dk] = []; grouped[dk].push(c); });
  const todayStr = hoyStr();

  return (
    <>
      {Object.keys(grouped).sort().map((dateKey) => {
        const dateObj = new Date(dateKey + 'T12:00:00');
        const dia = dateObj.getDate();
        const mes = MESES[dateObj.getMonth()];
        const isToday = dateKey === todayStr;

        return grouped[dateKey].map((clase, idx) => {
          let hora = '', horaFin = '';
          if (clase.fecha_inicio) { const d = new Date(clase.fecha_inicio); hora = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
          if (clase.fecha_fin) { const d = new Date(clase.fecha_fin); horaFin = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
          const timeStr = hora + (horaFin ? ' - ' + horaFin : '');
          const showDot = idx === 0;
          const dotColor = isToday ? 'bg-tertiary text-white' : 'bg-gray-100 text-gray-500';
          const lineColor = isToday ? 'border-tertiary' : 'border-gray-200';

          return (
            <div key={`${dateKey}-${idx}`} className="flex items-start space-x-4 pb-6 relative">
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 48 }}>
                {showDot ? (
                  <div className={`w-12 h-12 rounded-full ${dotColor} flex flex-col items-center justify-center text-center shadow-sm`}>
                    <span className="text-[9px] font-bold leading-none">{mes}</span>
                    <span className="text-base font-black font-headline leading-none">{dia}</span>
                  </div>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center"><div className={`w-0.5 h-full ${lineColor} border-l-2`}></div></div>
                )}
              </div>
              <div className="flex-1 pb-2 border-b border-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm">{clase.estudiante || 'Clase'}</h4>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        <span>Instr. {clase.instructor || 'Sin asignar'}</span>
                      </span>
                      {clase.vehiculo && (
                        <span className="inline-flex items-center space-x-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                          <span>{clase.vehiculo}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-white flex-shrink-0">{timeStr}</span>
                </div>
              </div>
            </div>
          );
        });
      })}
    </>
  );
}

/* ── Alertas ── */
function AlertasSection({ vehiculos }) {
  if (!vehiculos) return null;
  const enMant = vehiculos.filter((v) => v.estado === 'mantenimiento');
  if (enMant.length === 0) {
    return (<div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center"><p className="text-sm text-green-700 font-medium">Sin alertas de mantenimiento</p></div>);
  }
  return (
    <div className="space-y-2">
      {enMant.map((v, i) => (
        <div key={i} className="flex items-center justify-between bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FF5722' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{v.modelo} ({v.patente})</p>
              <p className="text-xs text-gray-500">Mantenimiento programado</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer" style={{ background: '#FF5722' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Vehiculos ── */
function VehiculosList({ vehiculos }) {
  if (!vehiculos || vehiculos.length === 0) return <p className="text-sm text-gray-500 p-4">No hay vehiculos registrados.</p>;
  return (
    <>
      {vehiculos.map((v, i) => {
        const estado = v.estado || 'disponible';
        let badgeColor = '#15803d', badgeBg = '#f0fdf4', badgeLabel = 'DISPONIBLE';
        if (estado === 'mantenimiento') { badgeColor = '#FF5722'; badgeBg = '#fff7ed'; badgeLabel = 'MANTENIMIENTO'; }
        else if (estado === 'en_sesion' || estado === 'en_progreso') { badgeColor = '#002366'; badgeBg = '#eff6ff'; badgeLabel = 'EN SESION'; }
        return (
          <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{v.modelo}</p>
                <p className="text-xs text-gray-400">{v.patente}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: badgeColor, background: badgeBg }}>{badgeLabel}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{v.sede_nombre || ''}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ════════════════════════════════════════════
   COMPONENTE PRINCIPAL — ResumenTab
   ════════════════════════════════════════════ */

export default function ResumenTab({ sedeActiva }) {
  const [kpis, setKpis] = useState({ estudiantesActivos: 0, clasesCompletadas: 0, vehiculosDisponibles: '0/0' });
  const [clases, setClases] = useState([]);
  const [flota, setFlota] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      dashboardService.getDashboardKPIs(sedeActiva),
      dashboardService.getClasesProximas(sedeActiva, 7),
      dashboardService.getUsoFlota(sedeActiva),
      dashboardService.getVehiculos(sedeActiva),
    ]).then(([k, c, f, v]) => {
      if (cancelled) return;
      setKpis(k || { estudiantesActivos: 0, clasesCompletadas: 0, vehiculosDisponibles: '0/0' });
      setClases(c || []); setFlota(f || []); setVehiculos(v || []);
    }).catch(console.error).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sedeActiva]);

  const estudiantes = kpis?.estudiantesActivos ?? 0;
  const clasesComp = kpis?.clasesCompletadas ?? 0;
  const flotaStr = kpis?.vehiculosDisponibles ?? '0/0';

  let utilizacion = 0;
  if (flota && flota.length > 0) {
    const totalPct = flota.reduce((a, i) => a + (i.porcentajeUso || 0), 0);
    utilizacion = Math.round(totalPct / flota.length);
    if (isNaN(utilizacion)) utilizacion = 0;
  }

  const titleSede = sedeLabel(sedeActiva);

  if (loading) return <p className="p-8 text-gray-500">Cargando vista...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold font-headline text-gray-900">Progreso {titleSede}</h1>
          <p className="text-sm text-gray-500">Resumen operativo - {titleSede}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT */}
        <div className="lg:w-[58%] space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <DonutChart clasesComp={clasesComp} />
            <div className="flex flex-col justify-center md:w-1/2 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Metricas Clave</p>
              <KpiRow icon={{ bg: '#eff6ff', svg: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#002366" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }} label="Estudiantes Activos" value={estudiantes} />
              <KpiRow icon={{ bg: '#f0fdf4', svg: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }} label="Clases Completadas" value={clasesComp} />
              <KpiRow icon={{ bg: '#faf5ff', svg: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg> }} label="Flota Disponible" value={flotaStr} />
              <KpiRow icon={{ bg: '#fff7ed', svg: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, valueStyle: { color: '#FF5722' } }} label="Utilizacion de Flota" value={`${utilizacion}%`} borderBottom={false} />
            </div>
          </div>

          {/* Clases Programadas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold font-headline text-gray-900">Clases Programadas</h2>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FF5722' }}>Próximos 7 días</span>
            </div>
            <div className="space-y-0 max-h-[500px] overflow-y-auto pr-2">
              <TimelineSection clases={clases} />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:w-[42%] space-y-6">
          <div>
            <h2 className="text-xl font-bold font-headline text-gray-900">Vehiculos {titleSede}</h2>
            <p className="text-sm text-gray-500">Seguimiento de estado en tiempo real</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center space-x-2" style={{ color: '#FF5722' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>Alertas de Mantenimiento</span>
            </p>
            <AlertasSection vehiculos={vehiculos} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 font-headline">Inventario Activo</h3>
              <span className="text-xs font-medium text-gray-400">{vehiculos ? vehiculos.length : 0} Total</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto"><VehiculosList vehiculos={vehiculos} /></div>
            <div className="p-3 border-t border-gray-100 text-center">
              <button className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-primary transition-colors">Gestionar Inventario Completo</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
