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
  isToday,
  isBefore,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getDiasOcupados } from '../service/reservas.Service';
import './Calendario.css';

export default function Calendario({ fechaSeleccionada, onSelectFecha, selecciones }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(fechaSeleccionada || new Date()));
  const [diasLlenos, setDiasLlenos] = useState([]);

  // Sincronizar currentMonth cuando cambia la fechaSeleccionada externamente
  useEffect(() => {
    if (fechaSeleccionada) {
      const startOfSelMonth = startOfMonth(fechaSeleccionada);
      if (!isSameMonth(startOfSelMonth, currentMonth)) {
        setCurrentMonth(startOfSelMonth);
      }
    }
  }, [fechaSeleccionada]);

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
        setDiasLlenos(dias ? dias.map(Number) : []);
      } catch (err) {
        console.error('Error al cargar dias ocupados', err);
      }
    };
    fetchDias();
  }, [currentMonth, selecciones]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day, isFull, isPasado, isSameMes) => {
    // Bloquear domingos, días llenos, días pasados y días que pertenecen a otro mes en la cuadrícula
    if (isSameMes && day.getDay() !== 0 && !isFull && !isPasado) {
      onSelectFecha(day);
    }
  };

  const renderHeader = () => {
    return (
      <div className="calendario-header">
        <button onClick={prevMonth} className="btn-nav" type="button" aria-label="Mes anterior">{'<'}</button>
        <span className="font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
        <button onClick={nextMonth} className="btn-nav" type="button" aria-label="Mes siguiente">{'>'}</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 }); // Lunes inicio

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="col col-center font-semibold text-gray-500" key={i}>
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
        const isSameMes = isSameMonth(day, monthStart);
        const isFull = isSameMes && diasLlenos.includes(diaNum);
        const isCurrentDay = isToday(day);
        const isPasado = isBefore(day, startOfDay(new Date())) && !isCurrentDay;

        days.push(
          <div
            className={`col cell ${
              !isSameMes ? 'disabled' : 
              isSelected ? 'selected' : 
              isFull ? 'full' :
              isCurrentDay ? 'today' : 
              isPasado ? 'disabled pasado' : ''
            } ${isDomingo ? 'disabled domingo' : ''}`}
            key={day.toString()}
            onClick={() => onDateClick(cloneDay, isFull, isPasado, isSameMes)}
          >
            <span className="number">{formattedDate}</span>
            {(!isDomingo && !isPasado && isSameMes && !isSelected && !isFull) && <span className="dot"></span>}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="row" key={day.toString()}>
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
