import React, { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardView from './DashboardView';
import MetasView from './MetasView';
import ReservasView from './ReservasView';
import Proximamente from '../components/Proximamente';

export default function MainLayout() {
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [sedeActiva, setSedeActiva] = useState('all');

  const handleSetVista = useCallback((vista) => {
    setVistaActual(vista);
  }, []);

  const handleSetSede = useCallback((sede) => {
    setSedeActiva(sede);
  }, []);

  const renderVista = () => {
    switch (vistaActual) {
      case 'dashboard':
        return <DashboardView sedeActiva={sedeActiva} />;
      case 'metas':
        return <MetasView sedeActiva={sedeActiva} />;
      case 'agenda':
        return <ReservasView />;
      default:
        return <Proximamente />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral overflow-hidden">
      {/* Sidebar */}
      <Sidebar vistaActual={vistaActual} onSetVista={handleSetVista} />

      {/* Contenido Principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TopBar — oculto en la vista de agenda (tiene su propio header) */}
        {vistaActual !== 'agenda' && (
          <TopBar sedeActiva={sedeActiva} onSetSede={handleSetSede} />
        )}

        {/* Área de la Vista Actual */}
        <main className="flex-1 overflow-y-auto">
          {renderVista()}
        </main>
      </div>
    </div>
  );
}
