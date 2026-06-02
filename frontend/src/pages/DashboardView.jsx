import { useState } from 'react';
import ResumenTab from './dashboard/ResumenTab';
import ClasesHoyTab from './dashboard/ClasesHoyTab';
import GraficoSemanalTab from './dashboard/GraficoSemanalTab';
import ReporteTab from './dashboard/ReporteTab';
import RendimientoMesTab from './dashboard/RendimientoMesTab';
import { LayoutDashboard, Calendar, BarChart2, FileText, PieChart } from 'lucide-react';

const DASHBOARD_TABS = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={16} /> },
  { id: 'clases-hoy', label: 'Clases del Día', icon: <Calendar size={16} /> },
  { id: 'grafico-semanal', label: 'Análisis Semanal', icon: <BarChart2 size={16} /> },
  { id: 'reportes', label: 'Reportes', icon: <FileText size={16} /> },
  { id: 'rendimiento-mes', label: 'Mes en Curso', icon: <PieChart size={16} /> },
];

export default function DashboardView({ sedeActiva }) {
  const [activeTab, setActiveTab] = useState('resumen');

  const renderTab = () => {
    switch (activeTab) {
      case 'resumen': return <ResumenTab sedeActiva={sedeActiva} />;
      case 'clases-hoy': return <ClasesHoyTab sedeActiva={sedeActiva} />;
      case 'grafico-semanal': return <GraficoSemanalTab sedeActiva={sedeActiva} />;
      case 'reportes': return <ReporteTab sedeActiva={sedeActiva} />;
      case 'rendimiento-mes': return <RendimientoMesTab sedeActiva={sedeActiva} />;
      default: return <ResumenTab sedeActiva={sedeActiva} />;
    }
  };

  return (
    <div className="p-8 font-body bg-neutral min-h-[calc(100vh-64px)] overflow-y-auto">
      
      <div className="mb-6 flex items-center space-x-1 bg-white rounded-xl border border-gray-200 p-1.5 overflow-x-auto">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-white/80' : 'text-gray-400'}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
