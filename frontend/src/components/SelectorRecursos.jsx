import { useState, useEffect } from 'react';
import { getSedes, getEstudiantes, getInstructores, getVehiculos } from '../service/reservas.Service';
import './SelectorRecursos.css';

export default function SelectorRecursos({ selecciones, onSelect, requiereVehiculo = true, user }) {
  const [sedes, setSedes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar sedes al montar
  useEffect(() => {
    if (user && user.rol === 'estudiante') {
      setCargando(false);
      return;
    }
    getSedes()
      .then(setSedes)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [user]);

  // Recargar estudiantes, instructores y vehículos cuando cambia la sede
  useEffect(() => {
    if (!selecciones.sedeId) {
      setEstudiantes([]);
      setInstructores([]);
      setVehiculos([]);
      return;
    }

    Promise.all([
      user?.rol !== 'estudiante' ? getEstudiantes(selecciones.sedeId) : Promise.resolve([]),
      getInstructores(selecciones.sedeId),
      getVehiculos(selecciones.sedeId),
    ])
      .then(([est, inst, veh]) => {
        setEstudiantes(est);
        setInstructores(inst);
        setVehiculos(veh);
      })
      .catch(console.error);
  }, [selecciones.sedeId, user]);

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

  const isAdmin = !user || user.rol === 'admin' || user.rol === 'recepcionista';
  const estSeleccionado = estudiantes.find(e => e.id === selecciones.estudianteId);
  const licenciaEstudiante = user?.rol === 'estudiante' ? user?.tipo_clase : estSeleccionado?.tipo_clase;

  return (
    <div className="selector-recursos">
      {isAdmin && (
        <>
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
        </>
      )}

      <div className="form-group">
        <label>Instructor</label>
        <select name="instructorId" value={selecciones.instructorId || ''} onChange={handleChange} disabled={!selecciones.sedeId}>
          <option value="">Seleccione Instructor...</option>
          {instructores.map(i => {
            const licInst = i.tipo_clase || i.especialidad;
            const incompatible = licenciaEstudiante && licInst && licenciaEstudiante !== licInst;
            return (
              <option
                key={i.id}
                value={i.id}
                disabled={incompatible}
                style={incompatible ? { color: '#9ca3af', backgroundColor: '#f3f4f6' } : {}}
              >
                {i.nombre} {incompatible ? `(Incompatible - ${licInst})` : `(${licInst || 'General'})`}
              </option>
            );
          })}
        </select>
      </div>

      {requiereVehiculo && (
        <div className="form-group">
          <label>Vehículo</label>
          <select name="vehiculoId" value={selecciones.vehiculoId || ''} onChange={handleChange} disabled={!selecciones.sedeId}>
            <option value="">Seleccione Vehículo...</option>
            {vehiculos.map(v => {
              const tipoVeh = (v.tipo_licencia || '').toLowerCase();
              let incompatible = false;
              let razon = '';
              if (licenciaEstudiante) {
                const licNorm = licenciaEstudiante.replace(/clase\s*/i, '').trim().toUpperCase();
                if ((licNorm === 'A' || licNorm === 'B') && tipoVeh === 'moto') {
                  incompatible = true;
                  razon = 'Solo motos - Incompatible';
                } else if (licNorm === 'C' && tipoVeh !== 'moto') {
                  incompatible = true;
                  razon = 'Solo autos - Incompatible';
                }
              }
              return (
                <option
                  key={v.id}
                  value={v.id}
                  disabled={incompatible}
                  style={incompatible ? { color: '#9ca3af', backgroundColor: '#f3f4f6' } : {}}
                >
                  {v.patente} — {v.modelo} {incompatible ? `(${razon})` : tipoVeh ? `(${tipoVeh})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
}
