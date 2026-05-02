import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getHorariosOcupados, crearReserva } from './api/reservas';
import { useSocket } from './hooks/useSocket';

import SelectorRecursos from './components/SelectorRecursos';
import SelectorTipoClase from './components/SelectorTipoClase';
import Calendario from './components/Calendario';
import BloqueHorarios from './components/BloqueHorarios';
import PanelDetalles from './components/PanelDetalles';

import './App.css';

function App() {
  const [selecciones, setSelecciones] = useState({
    sedeId: null,
    estudianteId: null,
    instructorId: null,
    vehiculoId: null,
  });

  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [tipoClaseId, setTipoClaseId] = useState(null);
  
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  // Clave de idempotencia: se genera al seleccionar un horario,
  // se reutiliza si el usuario hace doble/triple click
  const [idempotencyKey, setIdempotencyKey] = useState(null);

  // Hook de WebSocket (se une a la sala de la sede actual)
  const { socket } = useSocket(selecciones.sedeId);

  // Cargar ocupados cuando cambia fecha o recursos
  useEffect(() => {
    const fetchOcupados = async () => {
      if (!fecha || !selecciones.sedeId) return;
      
      try {
        const data = await getHorariosOcupados(
          fecha, 
          selecciones.sedeId, 
          selecciones.instructorId, 
          selecciones.vehiculoId
        );
        setHorariosOcupados(data);
      } catch (err) {
        console.error('Error al cargar disponibilidad', err);
      }
    };

    fetchOcupados();
  }, [fecha, selecciones]);

  // Escuchar eventos en tiempo real
  useEffect(() => {
    if (!socket) return;

    const actualizar = () => {
      // Si alguien más hace una reserva, recargamos la disponibilidad actual
      if (fecha && selecciones.sedeId) {
        getHorariosOcupados(fecha, selecciones.sedeId, selecciones.instructorId, selecciones.vehiculoId)
          .then(setHorariosOcupados)
          .catch(console.error);
      }
    };

    socket.on('reserva:creada', actualizar);
    socket.on('reserva:actualizada', actualizar);
    socket.on('reserva:expirada', actualizar);

    return () => {
      socket.off('reserva:creada', actualizar);
      socket.off('reserva:actualizada', actualizar);
      socket.off('reserva:expirada', actualizar);
    };
  }, [socket, fecha, selecciones]);

  const handleSelectFecha = (nuevaFecha) => {
    setFecha(nuevaFecha);
    setHora(null); // Resetear hora al cambiar de día
    setExito(false);
    setError(null);
  };

  const handleConfirmar = async () => {
    setIsLoading(true);
    setError(null);

    // Formatear ISO strings combinando fecha y hora
    // Enviar la fecha en formato ISO pero como HORA LOCAL (sin la Z de UTC)
    // Esto evita que 17:00 hrs local se convierta en 13:00 hrs en el servidor y choque con el almuerzo
    const dateStr = format(fecha, 'yyyy-MM-dd');
    const fechaInicio = `${dateStr}T${hora.horaInicio}:00`;
    const fechaFin = `${dateStr}T${hora.horaFin}:00`;

    try {
      await crearReserva({
        estudianteId: selecciones.estudianteId,
        instructorId: selecciones.instructorId,
        vehiculoId: selecciones.vehiculoId,
        sedeId: selecciones.sedeId,
        tipoClaseId,
        fechaInicio,
        fechaFin
      }, idempotencyKey);
      setExito(true);
      setHora(null); // Reset selection
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Programa tu reserva</h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Selecciona los recursos y elige un horario en el calendario.
          </p>
        </div>
        <span style={{ color: 'var(--secondary-color)', fontSize: '0.875rem' }}>
          hora estándar de Chile (GMT-4)
        </span>
      </div>

      <SelectorRecursos 
        selecciones={selecciones} 
        onSelect={(nuevas) => {
          setSelecciones(nuevas);
          setExito(false);
        }} 
      />

      <SelectorTipoClase
        tipoSeleccionado={tipoClaseId}
        onSelect={(id) => {
          setTipoClaseId(id);
          setExito(false);
        }}
      />

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Calendario 
          fechaSeleccionada={fecha} 
          onSelectFecha={handleSelectFecha} 
        />
        
        <BloqueHorarios 
          fechaSeleccionada={fecha} 
          horariosOcupados={horariosOcupados}
          horaSeleccionada={hora}
          onSelectHora={(h) => {
            setHora(h);
            setIdempotencyKey(crypto.randomUUID()); // Nueva key por cada selección de horario
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
        />
      </div>
    </div>
  );
}

export default App;
