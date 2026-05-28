import { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getDiasOcupados } from '../service/reservas.Service';
import './Calendario.css';

export default function Calendario({ fechaSeleccionada, onSelectFecha, selecciones }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(fechaSeleccionada || new Date()));
  const [diasLlenos, setDiasLlenos] = useState([]);

  useEffect(() => {
    if (!selecciones || !selecciones.sedeId) {
      setDiasLlenos([]);
      return;
    }
    const fetchDias = async () => {
      try {
        const mes = currentMonth.getMonth() + 1;
        const anio = currentMonth.getFullYear();
        const dias = await getDiasOcupados(
          mes, anio, selecciones.sedeId, 
          selecciones.instructorId, selecciones.vehiculoId, selecciones.estudianteId
        );
        setDiasLlenos(dias);
      } catch (err) {
        console.error('Error al cargar dias ocupados', err);
      }
    };
    fetchDias();
  }, [currentMonth, selecciones]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day, isFull) => {
    // bloquear domingos y días llenos
    if (day.getDay() !== 0 && !isFull) {
      onSelectFecha(day);
    }
  };

  const renderHeader = () => {
    return (
      <div className="calendario-header">
        <button onClick={prevMonth} className="btn-nav">{'<'}</button>
        <span>{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
        <button onClick={nextMonth} className="btn-nav">{'>'}</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 }); // Lunes inicio

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="col col-center" key={i}>
          {format(addDays(startDate, i), 'EEEEEE', { locale: es })}
        </div>
      );
    }
    return <div className="days row">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const isSelected = fechaSeleccionada && isSameDay(day, fechaSeleccionada);
        const isDomingo = day.getDay() === 0;
        const diaNum = parseInt(formattedDate, 10);
        const isFull = isSameMonth(day, monthStart) && diasLlenos.includes(diaNum);
        const isCurrentDay = isToday(day);

        days.push(
          <div
            className={`col cell ${
              !isSameMonth(day, monthStart) ? 'disabled' : 
              isSelected ? 'selected' : 
              isFull ? 'full' :
              isCurrentDay ? 'today' : ''
            } ${isDomingo ? 'disabled domingo' : ''}`}
            key={day}
            onClick={() => onDateClick(cloneDay, isFull)}
          >
            <span className="number">{formattedDate}</span>
            {(!isDomingo && isSameMonth(day, monthStart) && !isSelected && !isFull) && <span className="dot"></span>}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="row" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="body">{rows}</div>;
  };

  return (
    <div className="calendario">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
