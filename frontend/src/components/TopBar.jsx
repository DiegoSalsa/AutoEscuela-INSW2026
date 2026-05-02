import React from 'react';

const tabs = [
  { id: 'all', label: 'Todas las Sedes' },
  { id: '1', label: 'Sede Central' },
  { id: '2', label: 'Sede Norte' },
];

export default function TopBar({ sedeActiva, onSetSede }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 font-body">

      {/* Tabs de Sedes */}
      <div className="flex bg-neutral p-1 rounded-lg border border-gray-100">
        {tabs.map((tab) => {
          const isActive = sedeActiva === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onSetSede(tab.id)}
              className={`px-6 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Acciones / Usuario */}
      <div className="flex items-center justify-end space-x-6 w-1/4">
        <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-tertiary rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">Administrador</p>
            <p className="text-xs text-gray-500">AutoDrive Academy</p>
          </div>
          <div className="h-9 w-9 bg-primary text-white rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
