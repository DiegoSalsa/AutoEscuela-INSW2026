import React, { useState, useEffect } from 'react';
import { dashboardService } from '../service/dashboard.Service.js';
import { demoService } from '../service/demo.Service.js';

export default function FlotaView({ sedeActiva }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [seedError, setSeedError] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getVehiculos(sedeActiva);
      setVehiculos(data || []);
    } catch (err) {
      console.error('Error al cargar vehiculos:', err);
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
      const data = await demoService.cargarFlota();
      setSeedResult(data);
      await cargarDatos();
    } catch (err) {
      console.error('Error seed flota:', err);
      setSeedError(err.message || 'No se pudieron cargar los datos demo de la flota');
    } finally {
      setSeedLoading(false);
    }
  };

  const seedMetrics = seedResult?.creados || seedResult?.eliminados || {};

  return (
    <div className="p-8 font-body bg-neutral min-h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline text-gray-900">Módulo de Flota</h1>
          <p className="text-sm text-gray-500">Visualiza los vehículos registrados en el sistema</p>
        </div>
        <button
          onClick={cargarDemo}
          disabled={seedLoading}
          className="bg-primary hover:bg-secondary text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 text-sm self-start md:self-auto"
        >
          {seedLoading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
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
        <p className="text-gray-500">Cargando vehículos...</p>
      ) : vehiculos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 mb-4">No hay vehículos registrados.</p>
          <p className="text-sm text-gray-400">Haz clic en el botón superior para generar vehículos de prueba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehiculos.map((v, idx) => {
            const estado = v.estado || 'disponible';
            let color = 'text-green-600 bg-green-50';
            if (estado === 'mantenimiento') color = 'text-red-600 bg-red-50';
            if (estado === 'en_sesion' || estado === 'en_progreso') color = 'text-blue-600 bg-blue-50';

            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{v.modelo}</h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">{v.patente}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Kilometraje:</span>
                    <span className="font-semibold text-gray-800">{v.kilometraje_actual} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sede:</span>
                    <span className="font-medium text-gray-700">{v.sede_nombre || 'N/A'}</span>
                  </div>
                </div>
                <span className={`inline-block w-full text-center text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg ${color}`}>
                  {estado.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
