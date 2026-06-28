import React, { useState, useEffect } from 'react';
import { getEstudiantes, getInstructores, getSedes } from '../service/reservas.Service';
import './LoginView.css';

export default function LoginView({ onLogin }) {
  const [sedes, setSedes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [instructores, setInstructores] = useState([]);
  
  const [rol, setRol] = useState(''); // 'admin', 'recepcionista', 'instructor' o 'estudiante'
  const [sedeId, setSedeId] = useState('');
  const [estudianteId, setEstudianteId] = useState('');
  const [instructorId, setInstructorId] = useState('');

  // 1. cargar sedes al montar
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const data = await getSedes();
        setSedes(data);
      } catch (error) {
        console.error('Error al cargar sedes', error);
      }
    };
    fetchSedes();
  }, []);

  // 2. cargar estudiantes o instructores cuando cambia la sede
  useEffect(() => {
    if (!sedeId) {
      setEstudiantes([]);
      setInstructores([]);
      return;
    }
    if (rol === 'estudiante') {
      getEstudiantes(sedeId).then(data => {
        setEstudiantes(data);
        if (data.length > 0) setEstudianteId(data[0].id.toString());
      }).catch(err => console.error(err));
    } else if (rol === 'instructor') {
      getInstructores(sedeId).then(data => {
        setInstructores(data);
        if (data.length > 0) setInstructorId(data[0].id.toString());
      }).catch(err => console.error(err));
    }
  }, [sedeId, rol]);

  const handleLoginAdmin = () => {
    onLogin({ id: 'admin', label: 'Administrador', rol: 'admin', estudianteId: null });
  };

  const handleLoginRecepcionista = () => {
    onLogin({ id: 'recepcionista', label: 'Recepcionista', rol: 'recepcionista', estudianteId: null });
  };

  const handleLoginInstructor = () => {
    if (!instructorId) return;
    const inst = instructores.find(i => i.id.toString() === instructorId);
    if (inst) {
      onLogin({
        id: 'instructor',
        label: inst.nombre || 'Instructor',
        rol: 'instructor',
        instructorId: inst.id,
        sedeId: parseInt(sedeId, 10),
        tipo_licencia: inst.tipo_licencia || inst.especialidad,
      });
    }
  };

  const handleLoginEstudiante = () => {
    if (!estudianteId) return;
    const est = estudiantes.find(e => e.id.toString() === estudianteId);
    if (est) {
      onLogin({
        id: 'estudiante',
        label: est.nombre || 'Estudiante',
        rol: 'estudiante',
        estudianteId: est.id,
        sedeId: parseInt(sedeId, 10),
        tipo_licencia: est.tipo_licencia,
      });
    }
  };

  return (
    <div className="login-simple-container">
      <div className="login-simple-card">
        <h1 className="login-simple-title">AutoDrive Academy</h1>
        <p className="login-simple-subtitle">Ingresa a tu cuenta</p>

        {!rol ? (
          <div className="login-simple-options">
            <button className="login-simple-btn btn-admin" onClick={() => setRol('admin')}>
              Soy Administrador
            </button>
            <button className="login-simple-btn btn-recepcionista" onClick={() => setRol('recepcionista')}>
              Soy Recepcionista
            </button>
            <button className="login-simple-btn btn-instructor" onClick={() => setRol('instructor')}>
              Soy Instructor
            </button>
            <button className="login-simple-btn btn-student" onClick={() => setRol('estudiante')}>
              Soy Estudiante
            </button>
          </div>
        ) : (
          <div className="login-simple-form">
            <button className="btn-back" onClick={() => setRol('')}>← Volver</button>
            
            {rol === 'admin' ? (
              <div className="form-group">
                <p className="info-text">Ingreso como Administrador. Tendrás acceso total al sistema.</p>
                <button className="login-simple-btn btn-admin" onClick={handleLoginAdmin}>
                  Entrar como Admin
                </button>
              </div>
            ) : rol === 'recepcionista' ? (
              <div className="form-group">
                <p className="info-text">Ingreso como Recepcionista. Tendrás acceso a la gestión operativa del sistema.</p>
                <button className="login-simple-btn btn-recepcionista" onClick={handleLoginRecepcionista}>
                  Entrar como Recepcionista
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label>1. Selecciona tu Sede:</label>
                <select 
                  className="login-simple-select"
                  value={sedeId}
                  onChange={e => { setSedeId(e.target.value); setEstudianteId(''); setInstructorId(''); }}
                >
                  <option value="">-- Elige una sede --</option>
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>

                {sedeId && rol === 'estudiante' && (
                  <>
                    <label>2. Selecciona tu Nombre:</label>
                    <select 
                      className="login-simple-select"
                      value={estudianteId}
                      onChange={e => setEstudianteId(e.target.value)}
                    >
                      {estudiantes.length === 0 && <option value="">No hay estudiantes en esta sede</option>}
                      {estudiantes.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>

                    <button 
                      className="login-simple-btn btn-student" 
                      onClick={handleLoginEstudiante}
                      disabled={!estudianteId}
                    >
                      Ingresar
                    </button>
                  </>
                )}

                {sedeId && rol === 'instructor' && (
                  <>
                    <label>2. Selecciona tu Nombre (Instructor):</label>
                    <select 
                      className="login-simple-select"
                      value={instructorId}
                      onChange={e => setInstructorId(e.target.value)}
                    >
                      {instructores.length === 0 && <option value="">No hay instructores en esta sede</option>}
                      {instructores.map(i => (
                        <option key={i.id} value={i.id}>{i.nombre} ({i.especialidad || 'General'})</option>
                      ))}
                    </select>

                    <button 
                      className="login-simple-btn btn-instructor" 
                      onClick={handleLoginInstructor}
                      disabled={!instructorId}
                    >
                      Ingresar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
