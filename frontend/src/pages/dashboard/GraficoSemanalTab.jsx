import React, { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../../service/dashboard.Service.js';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController);

function sedeLabel(s) {
  if (s === 'all') return 'Todas las Sedes';
  return s === '1' ? 'Sede Central' : 'Sede Norte';
}

const COLORS = [
  { bar: '#002366', bg: 'rgba(0,35,102,0.85)' },
  { bar: '#FF5722', bg: 'rgba(255,87,34,0.85)' },
  { bar: '#1A237E', bg: 'rgba(26,35,126,0.75)' },
  { bar: '#7e22ce', bg: 'rgba(126,34,206,0.75)' },
];

export default function GraficoSemanalTab({ sedeActiva }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardService.getGraficoSemana(sedeActiva)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sedeActiva]);

  // Build chart
  useEffect(() => {
    if (!data || !chartRef.current) return;

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const sedeNames = Object.keys(data);
    if (sedeNames.length === 0) return;

    // Labels = days of the week
    const labels = data[sedeNames[0]].map((d) => d.dia);

    const datasets = sedeNames.map((sede, idx) => {
      const c = COLORS[idx % COLORS.length];
      return {
        label: sede,
        data: data[sede].map((d) => d.totalClases),
        backgroundColor: c.bg,
        borderColor: c.bar,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      };
    });

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: 'Inter', size: 12, weight: '500' },
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { family: 'Inter', size: 13 },
            bodyFont: { family: 'Inter', size: 12 },
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} clases`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 12, weight: '500' }, color: '#64748b' },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#94a3b8',
              stepSize: 1,
              callback: (v) => Number.isInteger(v) ? v : '',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);

  const titleSede = sedeLabel(sedeActiva);

  // Calcular totales para las cards
  let totalSemana = 0;
  let maxDia = { dia: '—', total: 0 };
  let promedio = 0;

  if (data) {
    const sedeNames = Object.keys(data);
    const dailyTotals = {};

    sedeNames.forEach((sede) => {
      data[sede].forEach((d) => {
        dailyTotals[d.dia] = (dailyTotals[d.dia] || 0) + d.totalClases;
        totalSemana += d.totalClases;
      });
    });

    Object.entries(dailyTotals).forEach(([dia, total]) => {
      if (total > maxDia.total) maxDia = { dia, total };
    });

    promedio = Object.keys(dailyTotals).length > 0
      ? Math.round(totalSemana / Object.keys(dailyTotals).length)
      : 0;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-headline text-gray-900">Análisis Semanal</h1>
        <p className="text-sm text-gray-500">Distribución de clases por día — {titleSede}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Semana</p>
          <p className="text-3xl font-black font-headline text-primary">{totalSemana}</p>
          <p className="text-xs text-gray-400 mt-1">clases en los últimos 7 días</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Día con más Actividad</p>
          <p className="text-3xl font-black font-headline" style={{ color: '#FF5722' }}>{maxDia.dia}</p>
          <p className="text-xs text-gray-400 mt-1">{maxDia.total} clases</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Promedio Diario</p>
          <p className="text-3xl font-black font-headline text-secondary">{promedio}</p>
          <p className="text-xs text-gray-400 mt-1">clases por día</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold font-headline text-gray-900">Clases por Día de la Semana</h2>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Últimos 7 días</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-12 text-center">Cargando datos...</p>
        ) : !data || Object.keys(data).length === 0 ? (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300 mb-3">
              <path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 4-9"/>
            </svg>
            <p className="text-gray-400">No hay datos para mostrar</p>
          </div>
        ) : (
          <div style={{ height: 360 }}>
            <canvas ref={chartRef}></canvas>
          </div>
        )}
      </div>

      {/* Tabla por sede */}
      {data && Object.keys(data).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 font-headline">Desglose por Sede</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Sede</th>
                  {data[Object.keys(data)[0]].map((d) => (
                    <th key={d.dia} className="px-4 py-3 text-center">{d.dia.slice(0, 3)}</th>
                  ))}
                  <th className="px-4 py-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.entries(data).map(([sede, dias], i) => {
                  const total = dias.reduce((a, d) => a + d.totalClases, 0);
                  const c = COLORS[i % COLORS.length];
                  return (
                    <tr key={sede} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: c.bar }}></span>
                        <span>{sede}</span>
                      </td>
                      {dias.map((d) => (
                        <td key={d.dia} className="px-4 py-3 text-center text-gray-600">
                          {d.totalClases > 0 ? (
                            <span className="font-bold">{d.totalClases}</span>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-primary">{total}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
