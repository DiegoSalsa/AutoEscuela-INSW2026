import React from 'react';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"/>
        <rect width="7" height="5" x="14" y="3" rx="1"/>
        <rect width="7" height="9" x="14" y="12" rx="1"/>
        <rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'estudiantes',
    label: 'Estudiantes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'instructores',
    label: 'Instructores',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
      </svg>
    ),
  },
  {
    id: 'flota',
    label: 'Flota',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    ),
  },
  {
    id: 'agenda',
    label: 'Agenda',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'metas',
    label: 'Metas Operativas',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    id: 'portal_instructor',
    label: 'Mi Portal',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: 'progreso_estudiante',
    label: 'Mi Progreso',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
];

export default function Sidebar({ vistaActual, onSetVista, user, onLogout }) {
  // Filtrar items según el rol del usuario
  const visibleMenuItems = menuItems.filter(item => {
    if (user?.rol === 'estudiante') {
      return ['agenda', 'progreso_estudiante'].includes(item.id);
    }
    if (user?.rol === 'instructor') {
      return item.id === 'portal_instructor';
    }
    // Admin y Recepcionista no ven portales individuales de instructor ni estudiante
    return !['portal_instructor', 'progreso_estudiante'].includes(item.id);
  });

  const rolLabel = {
    admin: 'Dashboard Analytics',
    recepcionista: 'Panel Operativo',
    instructor: 'Portal del Instructor',
    estudiante: 'Portal de Estudiantes',
  };

  return (
    <aside className="w-64 bg-primary text-white h-full flex flex-col font-body">
      <div className="p-6">
        <h1 className="text-2xl font-bold font-headline tracking-wider text-white">AUTODRIVE</h1>
        <p className="text-sm text-neutral/70 mt-1">
          {rolLabel[user?.rol] || 'Dashboard Analytics'}
        </p>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {visibleMenuItems.map((item) => {
          const isActive = vistaActual === item.id;
          return (
            <button
              key={item.id}
              id={`menu-btn-${item.id}`}
              onClick={() => onSetVista(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors !border-none ${
                isActive
                  ? 'bg-secondary text-white font-semibold'
                  : '!bg-transparent text-gray-300 hover:bg-primary/80 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-tertiary' : 'text-gray-400'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-secondary/50 flex flex-col items-center">
        <button 
          onClick={onLogout}
          className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors text-sm font-semibold"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Cerrar Sesión</span>
        </button>
        <p className="text-xs text-center text-gray-500 mt-4">© 2026 AutoDrive Academy</p>
      </div>
    </aside>
  );
}
