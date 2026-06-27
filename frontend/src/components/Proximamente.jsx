import React, { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { demoService } from '../service/demo.Service.js';

const CONFIG = {
  estudiantes: {
    titulo: 'Modulo academico en construccion',
    descripcion: 'Simula estudiantes, progreso teorico, resultados y reservas completadas para validar dashboard, metas y agenda.',
    boton: 'Cargar datos demo academicos',
    accion: demoService.cargarAcademico,
  },
  flota: {
    titulo: 'Inventario de flota en construccion',
    descripcion: 'Simula vehiculos, estados, kilometraje, revisiones y reservas asociadas para validar alertas, disponibilidad y graficos.',
    boton: 'Cargar datos demo de flota',
    accion: demoService.cargarFlota,
  },
};

export default function Proximamente({ modulo }) {
  const config = CONFIG[modulo];
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const cargarDemo = async () => {
    if (!config?.accion) return;
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const data = await config.accion();
      setResultado(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 bg-neutral">
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-md w-full">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold font-headline text-gray-800 mb-2">
          {config?.titulo || 'Modulo en construccion'}
        </h2>
        <p className="text-gray-500 mb-6">
          {config?.descripcion || 'Estamos trabajando para habilitar esta funcionalidad pronto. Vuelve mas adelante.'}
        </p>

        {config ? (
          <>
            <button
              type="button"
              onClick={cargarDemo}
              disabled={loading}
              className="bg-primary hover:bg-secondary text-white font-semibold px-5 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              <span>{loading ? 'Cargando...' : config.boton}</span>
            </button>

            {resultado && (
              <div className="mt-6 w-full text-left bg-green-50 border border-green-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-700 mb-2">{resultado.mensaje}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                  {Object.entries(resultado.creados || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 w-full bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
