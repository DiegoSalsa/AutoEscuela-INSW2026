import React, { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardView from './DashboardView';
import MetasView from './MetasView';
import ReservasView from './ReservasView';
import InstructoresView from './InstructoresView';
import EstudiantesView from './EstudiantesView';
import FlotaView from './FlotaView';
import InstructorPortalView from './InstructorPortalView';
import Proximamente from '../components/Proximamente';

export default function MainLayout({ user, onLogout }) {
  // Vista inicial según rol
  const vistaInicial = () => {
    if (user?.rol === 'estudiante') return 'agenda';
    if (user?.rol === 'instructor') return 'portal_instructor';
    return 'dashboard';
  };
  const [vistaActual, setVistaActual] = useState(vistaInicial());
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
        return <DashboardView sedeActiva={sedeActiva} user={user} />;
      case 'metas':
        return <MetasView sedeActiva={sedeActiva} user={user} />;
      case 'agenda':
        return <ReservasView user={user} sedeActiva={sedeActiva} />;
      case 'portal_instructor':
        return <InstructorPortalView user={user} />;
      case 'instructores':
        return <InstructoresView sedeActiva={sedeActiva} />;
      case 'estudiantes':
        return <EstudiantesView sedeActiva={sedeActiva} />;
      case 'flota':
        return <FlotaView sedeActiva={sedeActiva} />;
      default:
        return <Proximamente />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral overflow-hidden">
      {/* Sidebar */}
      <Sidebar vistaActual={vistaActual} onSetVista={handleSetVista} user={user} onLogout={onLogout} />

      {/* Contenido Principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TopBar */}
        <TopBar sedeActiva={sedeActiva} onSetSede={handleSetSede} user={user} onLogout={onLogout} />

        {/* Área de la Vista Actual */}
        <main className="flex-1 overflow-y-auto">
          {renderVista()}
        </main>
      </div>
    </div>
  );
}
