import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './BloqueHorarios.css';

// Generar bloques de clase de 45 minutos. De esta forma quedan 15 minutos libres 
// al final de cada hora para preparación/limpieza del vehículo antes de la siguiente.
const generarBloquesDelDia = () => {
  const bloques = [];
  for (let i = 8; i < 20; i++) {
    if (i === 13) continue; // Saltar colación
    const horaStr = i.toString().padStart(2, '0');
    bloques.push({
      id: `${horaStr}:00`,
      horaInicio: `${horaStr}:00`,
      horaFin: `${horaStr}:45`
    });
  }
  return bloques;
};

export default function BloqueHorarios({ fechaSeleccionada, horariosOcupados, horaSeleccionada, onSelectHora }) {
  const bloquesPosibles = generarBloquesDelDia();

  // Función para determinar si un bloque está ocupado
  // Ocupado significa que la hora de inicio de este bloque cae dentro de una reserva
  // o que es exactamente igual. Para simplificar (al ser bloques exactos de 1h),
  // comparamos solo la horaInicio.
  const isBloqueOcupado = (bloque) => {
    if (!fechaSeleccionada) return true;
    
    // Si la fecha seleccionada es hoy, bloquear horas pasadas
    const now = new Date();
    if (fechaSeleccionada.toDateString() === now.toDateString()) {
      const [horas] = bloque.horaInicio.split(':');
      if (parseInt(horas, 10) <= now.getHours()) return true;
    }

    return horariosOcupados.some(res => {
      const reservaDate = new Date(res.fecha_inicio);
      const reservaHour = reservaDate.getUTCHours().toString().padStart(2, '0');
      const reservaMin = reservaDate.getUTCMinutes().toString().padStart(2, '0');
      const reservaHoraStr = `${reservaHour}:${reservaMin}`;
      return reservaHoraStr === bloque.horaInicio;
    });
  };

  if (!fechaSeleccionada) {
    return (
      <div className="bloque-horarios-container">
        <p className="text-muted text-center">Selecciona una fecha en el calendario</p>
      </div>
    );
  }

  return (
    <div className="bloque-horarios-container">
      <div className="horarios-header">
        Disponibilidad para: {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
      </div>
      <div className="horarios-grid">
        {bloquesPosibles.map(bloque => {
          const ocupado = isBloqueOcupado(bloque);
          const seleccionado = horaSeleccionada?.id === bloque.id;

          return (
            <button
              key={bloque.id}
              className={`bloque-btn ${ocupado ? 'ocupado' : ''} ${seleccionado ? 'seleccionado' : ''}`}
              disabled={ocupado}
              onClick={() => onSelectHora(bloque)}
            >
              {bloque.horaInicio}
            </button>
          );
        })}
      </div>
    </div>
  );
}
