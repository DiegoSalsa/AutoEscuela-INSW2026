import React, { useState, useEffect } from 'react';
import { demoService } from '../service/demo.Service.js';
import { dashboardService } from '../service/dashboard.Service.js';

function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function obtenerLicencia(instructor) {
  return instructor.tipo_clase
    ? `Clase ${String(instructor.tipo_clase).toUpperCase()}`
    : instructor.especialidad
    || instructor.tipoLicencia
    || instructor.licencia
    || instructor.clase
    || instructor.clase_licencia
    || '';
}

function InstructorCard({ instructor }) {
  const licencia = obtenerLicencia(instructor);
  const initials = (instructor.nombre || 'IN')
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{instructor.nombre}</h3>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Licencia que imparte</p>
        <p className="text-sm text-gray-600">{licencia || 'Sin licencia registrada'}</p>
      </div>
    </div>
  );
}

export default function InstructoresView({ sedeActiva }) {
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [seedError, setSeedError] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const sedeId = sedeActiva && sedeActiva !== 'all' ? sedeActiva : null;
      const data = normalizarLista(await dashboardService.getInstructores(sedeId));
      setInstructores(data);
    } catch (err) {
      console.error('Error al cargar instructores:', err);
      setInstructores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [sedeActiva]);

  const cargarDemo = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    setSeedError('');
    try {
      const data = await demoService.cargarInstructores();
      setSeedResult(data);
      await cargarDatos();
    } catch (err) {
      console.error('Error seed instructores:', err);
      setSeedError(err.message || 'No se pudieron cargar los datos demo de instructores');
    } finally {
      setSeedLoading(false);
    }
  };

  const seedMetrics = seedResult?.creados || seedResult?.eliminados || {};

  return (
    <div className="p-8 font-body bg-neutral min-h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline text-gray-900">Modulo de Instructores</h1>
          <p className="text-sm text-gray-500">Visualiza los instructores y la clase que imparten</p>
        </div>
        <button
          onClick={cargarDemo}
          disabled={seedLoading}
          className="bg-primary hover:bg-secondary text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 text-sm self-start md:self-auto"
        >
          {seedLoading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          )}
          <span>{seedLoading ? 'Generando...' : 'Generar Datos de Prueba'}</span>
        </button>
      </div>

      {(seedResult || seedError) && (
        <div className={`mb-6 rounded-lg border p-4 ${seedError ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
          {seedError ? (
            <p className="text-sm text-red-700">{seedError}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-green-700 mb-2">{seedResult.mensaje}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-green-800">
                {Object.entries(seedMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando instructores...</p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Instructores</h2>
            <span className="text-xs text-gray-400">{instructores.length} registrados</span>
          </div>

          {instructores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructores.map(instructor => (
                <InstructorCard key={instructor.id} instructor={instructor} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-sm text-gray-400">No hay instructores para la sede seleccionada.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
