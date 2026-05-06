import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getHorariosOcupados, crearReserva, actualizarReserva, getReservaById } from '../service/reservas.Service';
import { useSocket } from '../hooks/useSocket';

import SelectorRecursos from '../components/SelectorRecursos';
import SelectorTipoClase from '../components/SelectorTipoClase';
import Calendario from '../components/Calendario';
import BloqueHorarios from '../components/BloqueHorarios';
import PanelDetalles from '../components/PanelDetalles';
import ReservasList from '../components/ReservasList';

import '../App.css';
import './ReservasView.css';

// ── Usuario fantasma ──────────────────────────────────────────────────────────
// Simula el rol del usuario actual hasta que el equipo integre auth real.
// El rol se envía como header 'x-rol' al backend para aplicar (o no) la regla de 48h.
const USUARIOS_FANTASMA = [
  // estudianteId: null = admin ve todas las reservas
  // estudianteId: 52  = Carlos Prueba (carlos.prueba@test.cl)
  { id: 'admin',      label: 'Administrador / Secretaria', rol: 'admin',      estudianteId: null },
  { id: 'estudiante', label: 'Estudiante',                 rol: 'estudiante', estudianteId: 52   },
];

const ESTADO_INICIAL = {
  sedeId: null, estudianteId: null, instructorId: null, vehiculoId: null,
};

export default function ReservasView() {
  // Tab activa: 'nueva' | 'lista'
  const [tab, setTab] = useState('nueva');

  // Usuario fantasma
  const [usuarioFantasma, setUsuarioFantasma] = useState(USUARIOS_FANTASMA[0]);

  // Modo edición: si editandoId !== null estamos actualizando una reserva
  const [editandoId, setEditandoId] = useState(null);

  // Formulario
  const [selecciones, setSelecciones] = useState(ESTADO_INICIAL);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [tipoClaseId, setTipoClaseId] = useState(null);

  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(null);

  const { socket } = useSocket(selecciones.sedeId);

  // ── Cargar disponibilidad ────────────────────────────────────────────────────
  useEffect(() => {
    if (!fecha || !selecciones.sedeId) return;
    const fetchOcupados = async () => {
      try {
        const data = await getHorariosOcupados(
          fecha, selecciones.sedeId,
          selecciones.instructorId, selecciones.vehiculoId,
          selecciones.estudianteId
        );
        setHorariosOcupados(data);
      } catch (err) {
        console.error('Error al cargar disponibilidad', err);
      }
    };
    fetchOcupados();
  }, [fecha, selecciones]);

  // ── WebSocket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const actualizar = () => {
      if (fecha && selecciones.sedeId) {
        getHorariosOcupados(
          fecha, selecciones.sedeId,
          selecciones.instructorId, selecciones.vehiculoId,
          selecciones.estudianteId
        ).then(setHorariosOcupados).catch(console.error);
      }
    };
    socket.on('reserva:creada', actualizar);
    socket.on('reserva:actualizada', actualizar);
    socket.on('reserva:expirada', actualizar);
    socket.on('reserva:cancelada', actualizar);
    return () => {
      socket.off('reserva:creada', actualizar);
      socket.off('reserva:actualizada', actualizar);
      socket.off('reserva:expirada', actualizar);
      socket.off('reserva:cancelada', actualizar);
    };
  }, [socket, fecha, selecciones]);

  // ── Prellenar formulario en modo edición 
  const iniciarEdicion = async (reserva) => {
    try {
      const data = await getReservaById(reserva.id);
      setEditandoId(data.id);
      setSelecciones({
        sedeId:       data.sede_id,
        estudianteId: data.estudiante_id,
        instructorId: data.instructor_id,
        vehiculoId:   data.vehiculo_id,
      });
      setTipoClaseId(data.tipo_clase_id);
      setFecha(new Date(data.fecha_inicio));
      // Prellenar hora (usar hora local, no UTC)
      const fi = new Date(data.fecha_inicio);
      const ff = new Date(data.fecha_fin);
      const pad = (n) => String(n).padStart(2, '0');
      setHora({
        id: `${pad(fi.getHours())}:${pad(fi.getMinutes())}`,
        horaInicio: `${pad(fi.getHours())}:${pad(fi.getMinutes())}`,
        horaFin:    `${pad(ff.getHours())}:${pad(ff.getMinutes())}`,
      });
      setError(null);
      setExito(false);
      setTab('nueva');
    } catch (e) {
      alert(`Error al cargar reserva: ${e.message}`);
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setSelecciones(ESTADO_INICIAL);
    setFecha(null);
    setHora(null);
    setTipoClaseId(null);
    setError(null);
    setExito(false);
  };

  // ── Confirmar (crear o actualizar) ──────────────────────────────────────────
  const handleConfirmar = async () => {
    setIsLoading(true);
    setError(null);
    const dateStr = format(fecha, 'yyyy-MM-dd');
    const fechaInicio = `${dateStr}T${hora.horaInicio}:00`;
    const fechaFin    = `${dateStr}T${hora.horaFin}:00`;

    try {
      if (editandoId) {
        await actualizarReserva(editandoId, {
          estudianteId: selecciones.estudianteId,
          instructorId: selecciones.instructorId,
          vehiculoId:   selecciones.vehiculoId,
          sedeId:       selecciones.sedeId,
          tipoClaseId,
          fechaInicio,
          fechaFin,
        }, usuarioFantasma.rol);
      } else {
        await crearReserva({
          estudianteId: selecciones.estudianteId,
          instructorId: selecciones.instructorId,
          vehiculoId:   selecciones.vehiculoId,
          sedeId:       selecciones.sedeId,
          tipoClaseId,
          fechaInicio,
          fechaFin,
        }, idempotencyKey);
      }
      setExito(true);
      setHora(null);
      if (editandoId) cancelarEdicion();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rv-wrapper">
      {/* ── Header de página ───────────────────────────────────────────────── */}
      <div className="rv-header">
        <div>
          <h2 className="rv-title">
            {editandoId ? `Editando reserva #${editandoId}` : 'Agenda de Clases'}
          </h2>
          <p className="rv-subtitle">
            {editandoId
              ? 'Modifica los datos de la reserva y confirma los cambios.'
              : 'Crea y gestiona las reservas de clases de conducción.'}
          </p>
        </div>

        {/* Selector de usuario fantasma — solo visible para admin/secretaria */}
        {usuarioFantasma.rol === 'admin' && (
          <div className="rv-usuario-selector">
            <label className="rv-usuario-label">Perfil de usuario</label>
            <select
              className="rv-usuario-select"
              value={usuarioFantasma.id}
              onChange={(e) => {
                const u = USUARIOS_FANTASMA.find(u => u.id === e.target.value);
                setUsuarioFantasma(u);
              }}
            >
              {USUARIOS_FANTASMA.map(u => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      {!editandoId && (
        <div className="rv-tabs">
          <button
            className={`rv-tab${tab === 'nueva' ? ' rv-tab-active' : ''}`}
            onClick={() => setTab('nueva')}
          >
            Nueva reserva
          </button>
          <button
            className={`rv-tab${tab === 'lista' ? ' rv-tab-active' : ''}`}
            onClick={() => setTab('lista')}
          >
            Ver reservas
          </button>
        </div>
      )}

      {/* ── Tab: lista de reservas ─────────────────────────────────────────── */}
      {tab === 'lista' && !editandoId && (
        <ReservasList
          rol={usuarioFantasma.rol}
          estudianteId={usuarioFantasma.estudianteId}
          onEditar={iniciarEdicion}
        />
      )}

      {/* ── Tab: formulario nueva / edición ───────────────────────────────── */}
      {(tab === 'nueva' || editandoId) && (
        <div className="rv-form">
          {editandoId && (
            <div className="rv-edit-banner">
              Editando reserva #{editandoId} —
              <button className="rv-edit-cancel-link" onClick={cancelarEdicion}>
                Cancelar edición
              </button>
            </div>
          )}

          <SelectorRecursos
            selecciones={selecciones}
            onSelect={(nuevas) => { setSelecciones(nuevas); setExito(false); }}
          />

          <SelectorTipoClase
            tipoSeleccionado={tipoClaseId}
            onSelect={(id) => { setTipoClaseId(id); setExito(false); }}
          />

          <div className="rv-calendar-row">
            <Calendario
              fechaSeleccionada={fecha}
              onSelectFecha={(f) => { setFecha(f); setHora(null); setExito(false); setError(null); }}
            />
            <BloqueHorarios
              fechaSeleccionada={fecha}
              horariosOcupados={horariosOcupados}
              horaSeleccionada={hora}
              onSelectHora={(h) => {
                setHora(h);
                setIdempotencyKey(crypto.randomUUID());
                setExito(false);
                setError(null);
              }}
            />
            <PanelDetalles
              selecciones={selecciones}
              tipoClaseId={tipoClaseId}
              fecha={fecha}
              hora={hora}
              isLoading={isLoading}
              error={error}
              exito={exito}
              onConfirmar={handleConfirmar}
              modoEdicion={!!editandoId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
