import { useState, useEffect } from 'react';
import { getSedes, getEstudiantes, getInstructores, getVehiculos } from '../service/reservas.Service';
import './SelectorRecursos.css';

export default function SelectorRecursos({ selecciones, onSelect }) {
  const [sedes, setSedes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar sedes al montar
  useEffect(() => {
    getSedes()
      .then(setSedes)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  // Recargar estudiantes, instructores y vehículos cuando cambia la sede
  useEffect(() => {
    if (!selecciones.sedeId) {
      setEstudiantes([]);
      setInstructores([]);
      setVehiculos([]);
      return;
    }

    Promise.all([
      getEstudiantes(selecciones.sedeId),
      getInstructores(selecciones.sedeId),
      getVehiculos(selecciones.sedeId),
    ])
      .then(([est, inst, veh]) => {
        setEstudiantes(est);
        setInstructores(inst);
        setVehiculos(veh);
      })
      .catch(console.error);
  }, [selecciones.sedeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const update = { ...selecciones, [name]: value ? parseInt(value, 10) : null };

    // Si cambia la sede, resetear las selecciones dependientes
    if (name === 'sedeId') {
      update.estudianteId = null;
      update.instructorId = null;
      update.vehiculoId = null;
    }

    onSelect(update);
  };

  if (cargando) {
    return <div className="selector-recursos"><p className="text-muted text-sm">Cargando recursos...</p></div>;
  }

  return (
    <div className="selector-recursos">
      <div className="form-group">
        <label>Sede</label>
        <select name="sedeId" value={selecciones.sedeId || ''} onChange={handleChange}>
          <option value="">Seleccione Sede...</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Estudiante</label>
        <select name="estudianteId" value={selecciones.estudianteId || ''} onChange={handleChange} disabled={!selecciones.sedeId}>
          <option value="">Seleccione Estudiante...</option>
          {estudiantes.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Instructor</label>
        <select name="instructorId" value={selecciones.instructorId || ''} onChange={handleChange} disabled={!selecciones.sedeId}>
          <option value="">Seleccione Instructor...</option>
          {instructores.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Vehículo</label>
        <select name="vehiculoId" value={selecciones.vehiculoId || ''} onChange={handleChange} disabled={!selecciones.sedeId}>
          <option value="">Seleccione Vehículo...</option>
          {vehiculos.map(v => <option key={v.id} value={v.id}>{v.patente} — {v.modelo}</option>)}
        </select>
      </div>
    </div>
  );
}
