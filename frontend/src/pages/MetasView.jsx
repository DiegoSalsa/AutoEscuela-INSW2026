import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../service/dashboard.Service.js';

const MESES_LABEL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const METRICAS_DISPONIBLES = [
  { value: 'clases_completadas', label: 'Clases Completadas', unidad: 'clases' },
  { value: 'estudiantes_activos', label: 'Estudiantes Activos', unidad: 'estudiantes' },
  { value: 'nuevos_estudiantes', label: 'Nuevos Estudiantes', unidad: 'estudiantes' },
  { value: 'aprobados', label: 'Examenes Aprobados', unidad: 'examenes' },
  { value: 'tasa_aprobacion', label: 'Tasa de Aprobacion', unidad: '%' },
  { value: 'uso_flota', label: 'Uso de Flota', unidad: '%' },
  { value: 'vehiculos_disponibles', label: 'Vehiculos Disponibles', unidad: 'vehiculos' },
];

const METRICAS_ALIAS = {
  clases_completadas: ['clases completadas', 'clases'],
  estudiantes_activos: ['estudiantes activos', 'alumnos activos'],
  nuevos_estudiantes: ['nuevos estudiantes', 'nuevos alumnos', 'matriculas'],
  aprobados: ['aprobados', 'examenes aprobados'],
  tasa_aprobacion: ['tasa aprobacion', 'tasa de aprobacion'],
  uso_flota: ['uso flota', 'uso de flota', 'ocupacion flota'],
  vehiculos_disponibles: ['vehiculos disponibles', 'autos disponibles'],
};

function normalizarTexto(valor = '') {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function metricaInfo(nombre) {
  const normalizada = normalizarTexto(nombre);
  const claveAlias = Object.entries(METRICAS_ALIAS)
    .find(([clave, alias]) => clave === normalizada || alias.includes(normalizada))?.[0];
  return METRICAS_DISPONIBLES.find((m) => m.value === nombre || m.value === claveAlias || normalizarTexto(m.label) === normalizada) || {
    value: nombre,
    label: nombre || 'Sin nombre',
    unidad: '',
  };
}

function formatValor(valor, unidad) {
  const numero = Number(valor) || 0;
  if (unidad === '%') return `${numero}%`;
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(numero);
}

function sedeLabel(sedeActiva) {
  if (sedeActiva === 'all') return 'General';
  return sedeActiva === '1' ? 'Central' : 'Norte';
}

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

/* ── Tarjeta de Meta ── */
function MetaCard({ meta, onEditar, onEliminar }) {
  let mesDisplay = '';
  let anioDisplay = '';
  if (meta.mes_anio) {
    const parts = meta.mes_anio.split('-');
    anioDisplay = parts[0] || '';
    const mesNum = parseInt(parts[1], 10);
    mesDisplay = MESES_LABEL[mesNum - 1] || parts[1];
  }

  const sedeNombre = meta.sede_nombre || 'Todas las sedes';
  const info = metricaInfo(meta.metrica_nombre);
  const metricaNombre = info.label;
  const valorEsperado = Number(meta.valor_esperado) || 0;
  const valorActual = Number(meta.valor_actual) || 0;
  const progreso = Math.min(Number(meta.progreso_porcentaje) || 0, 100);
  const brecha = Number(meta.brecha) || 0;
  const cumplida = meta.estado_progreso === 'cumplida';

  return (
    <div className="border border-gray-200 rounded-lg p-5 relative hover:shadow-md transition-shadow group">
      {/* Acciones hover */}
      <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEditar(meta)}
          className="text-gray-400 hover:text-blue-500 p-1 bg-white rounded-full transition-colors"
          title="Editar meta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
        <button
          onClick={() => onEliminar(meta.id)}
          className="text-gray-400 hover:text-red-500 p-1 bg-white rounded-full transition-colors"
          title="Eliminar meta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        </button>
      </div>

      {/* Fecha y Sede */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
        <span>{mesDisplay} {anioDisplay}</span>
        <span className="text-gray-300">·</span>
        <span>{sedeNombre}</span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold font-headline text-gray-800 mb-1">{metricaNombre}</h3>
        <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${cumplida ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {cumplida ? 'Cumplida' : 'En progreso'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <span className="block text-xs text-gray-500 mb-1">Actual</span>
          <span className="text-2xl font-black text-primary">{formatValor(valorActual, info.unidad)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 mb-1">Objetivo</span>
          <span className="text-2xl font-black text-gray-800">{formatValor(valorEsperado, info.unidad)}</span>
        </div>
      </div>

      {/* Progreso */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Progreso actual</span>
          <span className={`font-medium ${cumplida ? 'text-green-600' : 'text-tertiary'}`}>{Number(meta.progreso_porcentaje || 0).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className={`${cumplida ? 'bg-green-500' : 'bg-tertiary'} h-1.5 rounded-full transition-all`} style={{ width: `${progreso}%` }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {cumplida ? 'Meta alcanzada' : `Faltan ${formatValor(brecha, info.unidad)}`}
        </p>
      </div>
    </div>
  );
}

/* ── Componente Principal: MetasView ── */

export default function MetasView({ sedeActiva }) {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [metrica, setMetrica] = useState('');
  const [valor, setValor] = useState('');
  const [periodo, setPeriodo] = useState(mesActual());

  const cargarMetas = useCallback(async () => {
    try {
      const data = await dashboardService.obtenerMetas(sedeActiva);
      setMetas(data || []);
    } catch (error) {
      console.error('cargarMetas error:', error);
    } finally {
      setLoading(false);
    }
  }, [sedeActiva]);

  useEffect(() => {
    setLoading(true);
    cargarMetas();
  }, [cargarMetas]);

  const cancelarEdicion = useCallback(() => {
    setEditingId(null);
    setMetrica('');
    setValor('');
    setPeriodo(mesActual());
  }, []);

  const iniciarEdicion = useCallback((meta) => {
    setEditingId(meta.id);
    setMetrica(metricaInfo(meta.metrica_nombre).value || '');
    setValor(meta.valor_esperado ?? '');
    setPeriodo(meta.mes_anio || mesActual());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const mesNum = parseInt(periodo.slice(5), 10);
    if (!/^\d{4}-\d{2}$/.test(periodo) || isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      alert('Selecciona un periodo valido.');
      return;
    }

    const mesAnio = periodo;

    const payload = {
      metrica_nombre: metrica,
      valor_esperado: Number(valor),
      mes_anio: mesAnio,
      sede_id: sedeActiva === 'all' ? null : Number(sedeActiva),
    };

    let result;
    if (editingId) {
      result = await dashboardService.actualizarMeta(editingId, payload);
    } else {
      result = await dashboardService.crearMeta(payload);
    }

    if (result) {
      cancelarEdicion();
      await cargarMetas();
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta meta?')) {
      const exito = await dashboardService.eliminarMeta(id);
      if (exito) {
        if (editingId === id) cancelarEdicion();
        await cargarMetas();
      }
    }
  };

  const isEditing = editingId !== null;
  const titleSede = sedeLabel(sedeActiva);

  return (
    <div className="p-8 font-body space-y-8 bg-neutral min-h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-tertiary/10 text-tertiary rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline text-gray-900">Metas Operativas</h1>
          <p className="text-sm text-gray-500">Gestiona los objetivos para la sede {titleSede}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          {isEditing ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              Editando Meta
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-tertiary">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Nueva Meta
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Métrica</label>
            <select
              value={metrica}
              onChange={(e) => setMetrica(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none"
              required
            >
              <option value="">Selecciona una metrica</option>
              {METRICAS_DISPONIBLES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Objetivo</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej. 100"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className={`w-full font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center text-white ${
                isEditing
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-tertiary hover:bg-orange-600'
              }`}
            >
              {isEditing ? 'Actualizar Meta' : 'Guardar Meta'}
            </button>
          </div>
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Metas */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Metas Activas</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : metas.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-3">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <p className="text-gray-500">No hay metas definidas para esta sede.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metas.map((meta) => (
              <MetaCard
                key={meta.id}
                meta={meta}
                onEditar={iniciarEdicion}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
