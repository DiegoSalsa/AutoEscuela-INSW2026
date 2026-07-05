import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardView from './DashboardView';
import MetasView from './MetasView';
import ReservasView from './ReservasView';
import InstructoresView from './InstructoresView';
import EstudiantesView from './EstudiantesView';
import FlotaView from './FlotaView';
import InstructorPortalView from './InstructorPortalView';
import ProgresoEstudianteView from './ProgresoEstudianteView';
import Proximamente from '../components/Proximamente';

export default function MainLayout({ user, onLogout }) {
  // Vista inicial según rol
  const vistaInicial = () => {
    if (user?.rol === 'estudiante') return 'agenda';
    if (user?.rol === 'instructor') return 'portal_instructor';
    return 'dashboard';
  };
  const [vistaActual, setVistaActual] = useState(vistaInicial());
  const [sedeActiva, setSedeActiva] = useState(() => {
    if (user?.sedeId && user?.rol !== 'admin') {
      return user.sedeId.toString();
    }
    return 'all';
  });

  useEffect(() => {
    if (user?.sedeId && user?.rol !== 'admin') {
      setSedeActiva(user.sedeId.toString());
    } else if (user?.rol === 'admin' || user?.rol === 'recepcionista') {
      setSedeActiva('all');
    }
  }, [user]);

  const handleSetVista = useCallback((vista) => {
    setVistaActual(vista);
  }, []);

  const handleSetSede = useCallback((sede) => {
    setSedeActiva(sede);
  }, []);

  // Función de verificación de seguridad por rol
  const tienePermiso = (vista) => {
    const rol = user?.rol || 'admin';
    if (rol === 'admin' || rol === 'recepcionista') {
      return !['portal_instructor', 'progreso_estudiante'].includes(vista);
    }
    if (rol === 'instructor') {
      return vista === 'portal_instructor';
    }
    if (rol === 'estudiante') {
      return ['agenda', 'progreso_estudiante'].includes(vista);
    }
    return false;
  };

  const renderVista = () => {
    if (!tienePermiso(vistaActual)) {
      return (
        <div className="p-8 max-w-2xl mx-auto mt-16 text-center bg-white rounded-2xl shadow-xl border border-red-100 font-body">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
            🚫
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-headline">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Tu rol actual (<strong className="capitalize text-primary">{user?.label || user?.rol}</strong>) no tiene permisos de seguridad para acceder a la sección <strong className="text-red-600">'{vistaActual}'</strong>.
          </p>
          <button
            onClick={() => setVistaActual(vistaInicial())}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 text-sm"
          >
            Volver a mi vista principal
          </button>
        </div>
      );
    }

    switch (vistaActual) {
      case 'dashboard':
        return <DashboardView sedeActiva={sedeActiva} user={user} />;
      case 'metas':
        return <MetasView sedeActiva={sedeActiva} user={user} />;
      case 'agenda':
        return <ReservasView user={user} sedeActiva={sedeActiva} />;
      case 'portal_instructor':
        return <InstructorPortalView user={user} />;
      case 'progreso_estudiante':
        return <ProgresoEstudianteView user={user} />;
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
