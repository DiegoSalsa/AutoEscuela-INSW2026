import { useState } from 'react';
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
  addDays 
} from 'date-fns';
import { es } from 'date-fns/locale';
import './Calendario.css';

export default function Calendario({ fechaSeleccionada, onSelectFecha }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(fechaSeleccionada || new Date()));

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day) => {
    // Bloquear domingos según regla de negocio
    if (day.getDay() !== 0) {
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

        days.push(
          <div
            className={`col cell ${
              !isSameMonth(day, monthStart) ? 'disabled' : 
              isSelected ? 'selected' : 
              isDomingo ? 'disabled domingo' : ''
            }`}
            key={day}
            onClick={() => onDateClick(cloneDay)}
          >
            <span className="number">{formattedDate}</span>
            {/* Punto decorativo naranjo para días con disponibilidad, opcional */}
            {(!isDomingo && isSameMonth(day, monthStart) && !isSelected) && <span className="dot"></span>}
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
