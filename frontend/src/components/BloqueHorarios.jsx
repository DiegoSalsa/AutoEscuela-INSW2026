import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './BloqueHorarios.css';

const generarBloquesDelDia = () => {
  const bloques = [];
  for (let i = 8; i < 20; i++) {
    if (i === 13) continue;
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

  const isBloqueOcupado = (bloque) => {
    if (!fechaSeleccionada) return true;


    // Si la fecha es hoy, bloquear horas pasadas (hora local del navegador)
    const now = new Date();
    const hoyStr = format(now, 'yyyy-MM-dd');
    const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
    if (fechaStr === hoyStr) {
      const [horas] = bloque.horaInicio.split(':');
      if (parseInt(horas, 10) <= now.getHours()) return true;
    }

    return horariosOcupados.some(res => {
      // El backend puede devolver fecha en UTC o local; convertimos a Date y extraemos hora local
      let reservaHoraStr = '';
      const fechaReserva = new Date(res.fecha_inicio || res.inicio);
      if (!isNaN(fechaReserva.getTime())) {
        const horas = fechaReserva.getHours().toString().padStart(2, '0');
        const minutos = fechaReserva.getMinutes().toString().padStart(2, '0');
        reservaHoraStr = `${horas}:${minutos}`;
      }
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