import { useState, useEffect, useCallback } from 'react';
import { getReservas, cancelarReserva as apiCancelar } from '../service/reservas.Service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './ReservasList.css';

const ESTADO_LABELS = {
  confirmada:  { label: 'Confirmada',  color: '#16a34a' },
  en_progreso: { label: 'En progreso', color: '#2563eb' },
  proxima:     { label: 'Próxima',     color: '#7c3aed' },
  completada:  { label: 'Completada',  color: '#0891b2' },
  cancelada:   { label: 'Cancelada',   color: '#dc2626' },
  expirada:    { label: 'Expirada',    color: '#6b7280' },
  pendiente:   { label: 'Pendiente',   color: '#d97706' },
};

// Reservas completadas más antiguas que este umbral van al historial oculto
const DIAS_UMBRAL_COMPLETADAS = 7;

function diasDesde(fecha) {
  return (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24);
}

export default function ReservasList({ rol, estudianteId, onEditar }) {
  const esAdmin = rol === 'admin';

  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const filtros = esAdmin ? {} : { estudianteId };
      const data = await getReservas(filtros);
      setReservas(data);
    } catch (e) {
      setError('No se pudieron cargar las reservas.');
    } finally {
      setCargando(false);
    }
  }, [esAdmin, estudianteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCancelar = async (reserva) => {
    if (!window.confirm(`¿Cancelar la reserva del ${format(new Date(reserva.fecha_inicio), "d 'de' MMMM 'a las' HH:mm", { locale: es })}?`)) return;
    setCancelando(reserva.id);
    try {
      await apiCancelar(reserva.id, rol);
      await cargar();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setCancelando(null);
    }
  };

  const puedeAccionar = (reserva) => {
    if (rol === 'admin') return true;

    // Misma regla que el backend: comparar solo el DÍA (medianoche), no la hora exacta.
    // Clase el 10/05 → puede modificar hasta el 7/05 inclusive (3+ días de diferencia).
    // El 8/05 y el 9/05 quedan bloqueados sin importar la hora.
    const hoy      = new Date();
    const diaHoy   = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fi       = new Date(reserva.fecha_inicio);
    const diaClase = new Date(fi.getFullYear(), fi.getMonth(), fi.getDate());
    const diffDias = (diaClase - diaHoy) / (1000 * 60 * 60 * 24);
    return diffDias >= 3;
  };

  // ── Agrupación de reservas ──────────────────────────────────────────────────
  // Activas: todo lo que NO es completada, cancelada ni expirada
  const ESTADOS_ACTIVOS = ['pendiente', 'confirmada', 'en_progreso', 'proxima'];
  const reservasActivas = reservas.filter(r => ESTADOS_ACTIVOS.includes(r.estado));

  // Completadas recientes (dentro del umbral): visibles por defecto
  const completadasRecientes = reservas.filter(
    r => r.estado === 'completada' && diasDesde(r.fecha_inicio) <= DIAS_UMBRAL_COMPLETADAS
  );

  // Historial: canceladas, expiradas y completadas antiguas
  const reservasHistorial = reservas.filter(
    r => ['cancelada', 'expirada'].includes(r.estado)
       || (r.estado === 'completada' && diasDesde(r.fecha_inicio) > DIAS_UMBRAL_COMPLETADAS)
  );

  const totalHistorial = reservasHistorial.length;

  // ── Tabla genérica ──────────────────────────────────────────────────────────
  const renderTabla = (lista, conAcciones = false) => (
    <div className="rl-table-wrap">
      <table className="rl-table">
        <thead>
          <tr>
            <th>#</th>
            {esAdmin && <th>Estudiante</th>}
            <th>Instructor</th>
            <th>Vehículo</th>
            <th>Tipo de clase</th>
            <th>Fecha y hora</th>
            <th>Estado</th>
            {conAcciones && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {lista.map(r => {
            const puede = puedeAccionar(r);
            const estado = ESTADO_LABELS[r.estado] || { label: r.estado, color: '#6b7280' };
            const esHistorial = !conAcciones;
            return (
              <tr key={r.id} className={esHistorial ? 'rl-row-muted' : ''}>
                <td className="rl-id">{r.id}</td>
                {esAdmin && <td>{r.estudiante_nombre || '—'}</td>}
                <td>{r.instructor_nombre || '—'}</td>
                <td>{r.patente ? `${r.patente} (${r.modelo})` : '—'}</td>
                <td>{r.tipo_clase_nombre || 'Sin tipo'}</td>
                <td>
                  {r.fecha_inicio
                    ? format(new Date(r.fecha_inicio), "d MMM yyyy, HH:mm", { locale: es })
                    : '—'}
                </td>
                <td>
                  <span className="rl-badge" style={{ backgroundColor: estado.color }}>
                    {estado.label}
                  </span>
                </td>
                {conAcciones && (
                  <td className="rl-actions">
                    <button
                      className="rl-btn rl-btn-edit"
                      disabled={!puede}
                      title={!puede ? 'Solo puedes editar con al menos 2 días de anticipación al día de la clase' : 'Editar reserva'}
                      onClick={() => onEditar(r)}
                    >
                      Editar
                    </button>
                    <button
                      className="rl-btn rl-btn-cancel"
                      disabled={!puede || cancelando === r.id}
                      title={!puede ? 'Solo puedes cancelar con al menos 2 días de anticipación al día de la clase' : 'Cancelar reserva'}
                      onClick={() => handleCancelar(r)}
                    >
                      {cancelando === r.id ? '...' : 'Cancelar'}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (cargando) return <div className="rl-empty">Cargando reservas...</div>;
  if (error)    return <div className="rl-empty rl-error">{error}</div>;

  return (
    <div className="rl-container">

      {/* ── Reservas activas ──────────────────────────────────────────────── */}
      <div className="rl-section">
        <h3 className="rl-section-title">
          {esAdmin
            ? `Reservas activas (${reservasActivas.length})`
            : `Mis reservas activas (${reservasActivas.length})`}
        </h3>
        {reservasActivas.length === 0
          ? <p className="rl-empty">No hay reservas activas.</p>
          : renderTabla(reservasActivas, true)}
      </div>

      {/* ── Completadas recientes ─────────────────────────────────────────── */}
      {completadasRecientes.length > 0 && (
        <div className="rl-section">
          <h3 className="rl-section-title rl-section-title--completadas">
            Completadas recientemente ({completadasRecientes.length})
            <span className="rl-hint">últimos {DIAS_UMBRAL_COMPLETADAS} días</span>
          </h3>
          {renderTabla(completadasRecientes, false)}
        </div>
      )}

      {/* ── Historial (oculto por defecto) ────────────────────────────────── */}
      {totalHistorial > 0 && (
        <div className="rl-section rl-section-historial">
          <div className="rl-historial-header">
            <h3 className="rl-section-title">
              {esAdmin
                ? `Historial (${totalHistorial})`
                : `Mi historial (${totalHistorial})`}
              <span className="rl-hint">canceladas, expiradas y completadas antiguas</span>
            </h3>
            <button
              className="rl-btn-toggle"
              onClick={() => setMostrarHistorial(v => !v)}
            >
              {mostrarHistorial ? 'Ocultar historial' : `Mostrar historial (${totalHistorial})`}
            </button>
          </div>

          {mostrarHistorial && renderTabla(reservasHistorial, false)}
        </div>
      )}

    </div>
  );
}
