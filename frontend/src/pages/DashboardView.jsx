import React, { useState } from 'react';
import ResumenTab from './dashboard/ResumenTab';
import ClasesHoyTab from './dashboard/ClasesHoyTab';
import GraficoSemanalTab from './dashboard/GraficoSemanalTab';
import ReporteTab from './dashboard/ReporteTab';
import RendimientoMesTab from './dashboard/RendimientoMesTab';

const DASHBOARD_TABS = [
  {
    id: 'resumen',
    label: 'Resumen',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'clases-hoy',
    label: 'Clases del Día',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'grafico-semanal',
    label: 'Análisis Semanal',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 4-9"/>
      </svg>
    ),
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    id: 'rendimiento-mes',
    label: 'Mes en Curso',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
      </svg>
    ),
  },
];

export default function DashboardView({ sedeActiva }) {
  const [activeTab, setActiveTab] = useState('resumen');

  const renderTab = () => {
    switch (activeTab) {
      case 'resumen':
        return <ResumenTab sedeActiva={sedeActiva} />;
      case 'clases-hoy':
        return <ClasesHoyTab sedeActiva={sedeActiva} />;
      case 'grafico-semanal':
        return <GraficoSemanalTab sedeActiva={sedeActiva} />;
      case 'reportes':
        return <ReporteTab sedeActiva={sedeActiva} />;
      case 'rendimiento-mes':
        return <RendimientoMesTab sedeActiva={sedeActiva} />;
      default:
        return <ResumenTab sedeActiva={sedeActiva} />;
    }
  };

  return (
    <div className="p-8 font-body bg-neutral min-h-[calc(100vh-64px)] overflow-y-auto">
      {/* Sub-navigation tabs */}
      <div className="mb-6 flex items-center space-x-1 bg-white rounded-xl border border-gray-200 p-1.5 overflow-x-auto">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={isActive ? 'text-white/80' : 'text-gray-400'}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {renderTab()}
    </div>
  );
}
