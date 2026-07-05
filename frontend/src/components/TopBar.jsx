import React from 'react';

const tabs = [
  { id: 'all', label: 'Todas las Sedes' },
  { id: '1', label: 'Sede Central' },
  { id: '2', label: 'Sede Norte' },
];

export default function TopBar({ sedeActiva, onSetSede, user }) {
  const isAdmin = !user || user.rol === 'admin' || user.rol === 'recepcionista';

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 font-body">

      {/* Tabs de Sedes - Solo para admin */}
      <div className="flex">
        {isAdmin && (
          <div className="flex bg-neutral p-1 rounded-lg border border-gray-100">
            {tabs.map((tab) => {
              const isActive = sedeActiva === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => onSetSede(tab.id)}
                  className={`px-6 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive
                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Acciones / Usuario */}
      <div className="flex items-center justify-end space-x-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-primary">{user?.label || 'Usuario'}</p>
        </div>
      </div>
    </header>
  );
}
