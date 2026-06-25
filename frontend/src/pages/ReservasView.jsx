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

export default function ReservasView({ user }) {
  const ESTADO_INICIAL = {
    sedeId: user.rol === 'estudiante' ? user.sedeId : null,
    estudianteId: user.rol === 'estudiante' ? user.estudianteId : null,
    instructorId: null,
    vehiculoId: null,
  };
  // Tab activa: 'nueva' | 'lista'
  const [tab, setTab] = useState('nueva');

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

  // Cargar disponibilidad cuando cambian fecha o recursos
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

  // WebSocket: actualizar disponibilidad en tiempo real
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

  // Prellenar formulario en modo edicion
  const iniciarEdicion = async (reserva) => {
    try {
      const data = await getReservaById(reserva.id);
      setEditandoId(data.id);
      setSelecciones({
        sedeId: data.sede_id,
        estudianteId: data.estudiante_id,
        instructorId: data.instructor_id,
        vehiculoId: data.vehiculo_id,
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
        horaFin: `${pad(ff.getHours())}:${pad(ff.getMinutes())}`,
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

  // Confirmar (crear o actualizar reserva)
  const handleConfirmar = async () => {
    setIsLoading(true);
    setError(null);
    const dateStr = format(fecha, 'yyyy-MM-dd');
    const fechaInicio = `${dateStr}T${hora.horaInicio}:00`;
    const fechaFin = `${dateStr}T${hora.horaFin}:00`;

    try {
      const payload = {
        estudianteId: selecciones.estudianteId,
        instructorId: selecciones.instructorId,
        sedeId: selecciones.sedeId,
        tipoClaseId,
        fechaInicio,
        fechaFin,
      };
      // Solo incluir vehiculoId si la clase lo requiere
      if (selecciones.vehiculoId) payload.vehiculoId = selecciones.vehiculoId;

      if (editandoId) {
        await actualizarReserva(editandoId, payload, user.rol);
      } else {
        await crearReserva(payload, idempotencyKey);
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
      {/* Header */}
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
      </div>

      {/* Tabs */}
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

      {/* Tab: lista de reservas */}
      {tab === 'lista' && !editandoId && (
        <ReservasList
          rol={user.rol}
          estudianteId={user.estudianteId}
          onEditar={iniciarEdicion}
        />
      )}

      {/* Tab: formulario nueva / edicion */}
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

          <SelectorTipoClase
            tipoSeleccionado={tipoClaseId}
            onSelect={(id) => {
              setTipoClaseId(id);
              setExito(false);
              // Si elige clase teorica, limpiar vehiculo
              if (id === 1) {
                setSelecciones(prev => ({ ...prev, vehiculoId: null }));
              }
            }}
          />

          <SelectorRecursos
            selecciones={selecciones}
            onSelect={(nuevas) => { setSelecciones(nuevas); setExito(false); }}
            requiereVehiculo={tipoClaseId !== 1}
            user={user}
          />

          <div className="rv-calendar-row">
            <Calendario
              fechaSeleccionada={fecha}
              selecciones={selecciones}
              onSelectFecha={(f) => { setFecha(f); setHora(null); setExito(false); setError(null); }}
            />
            <BloqueHorarios
              fechaSeleccionada={fecha}
              horariosOcupados={horariosOcupados}
              horaSeleccionada={hora}
              onSelectHora={(h) => {
                setHora(h);
                setIdempotencyKey(
                  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = (Math.random() * 16) | 0;
                    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
                  })
                );
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
              requiereVehiculo={tipoClaseId !== 1}
            />
          </div>
        </div>
      )}
    </div>
  );
}
