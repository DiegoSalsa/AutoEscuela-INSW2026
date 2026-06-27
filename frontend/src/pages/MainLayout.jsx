import React, { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardView from './DashboardView';
import MetasView from './MetasView';
import ReservasView from './ReservasView';
import Proximamente from '../components/Proximamente';
import EstudiantesView from './EstudiantesView';
import InstructoresView from './InstructoresView';
import FlotaView from './FlotaView';

export default function MainLayout({ user, onLogout }) {
  // Si es estudiante, solo tiene acceso a agenda
  const [vistaActual, setVistaActual] = useState(user?.rol === 'admin' ? 'dashboard' : 'agenda');
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
        return <ReservasView user={user} />;
      case 'estudiantes':
        return <EstudiantesView sedeActiva={sedeActiva} />;
      case 'instructores':
        return <InstructoresView sedeActiva={sedeActiva} />;
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
