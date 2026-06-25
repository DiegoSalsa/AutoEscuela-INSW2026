import React, { useState, useEffect } from 'react';
import { getEstudiantes, getSedes } from '../service/reservas.Service';
import './LoginView.css';

export default function LoginView({ onLogin }) {
  const [sedes, setSedes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  
  const [rol, setRol] = useState(''); // 'admin' o 'estudiante'
  const [sedeId, setSedeId] = useState('');
  const [estudianteId, setEstudianteId] = useState('');

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

  // 2. cargar estudiantes cuando cambia la sede
  useEffect(() => {
    if (!sedeId || rol !== 'estudiante') {
      setEstudiantes([]);
      return;
    }
    const fetchEst = async () => {
      try {
        const data = await getEstudiantes(sedeId);
        setEstudiantes(data);
        if (data.length > 0) setEstudianteId(data[0].id.toString());
      } catch (error) {
        console.error('Error al cargar estudiantes', error);
      }
    };
    fetchEst();
  }, [sedeId, rol]);

  const handleLoginAdmin = () => {
    onLogin({ id: 'admin', label: 'Administrador', rol: 'admin', estudianteId: null });
  };

  const handleLoginRecepcionista = () => {
    onLogin({ id: 'recepcionista', label: 'Recepcionista', rol: 'recepcionista', estudianteId: null });
  };

  const handleLoginInstructor = () => {
    onLogin({ id: 'instructor', label: 'Instructor', rol: 'instructor', estudianteId: null });
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
            ) : rol === 'instructor' ? (
              <div className="form-group">
                <p className="info-text">Ingreso como Instructor. Podrás ver tu módulo de instructores.</p>
                <button className="login-simple-btn btn-instructor" onClick={handleLoginInstructor}>
                  Entrar como Instructor
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label>1. Selecciona tu Sede:</label>
                <select 
                  className="login-simple-select"
                  value={sedeId}
                  onChange={e => { setSedeId(e.target.value); setEstudianteId(''); }}
                >
                  <option value="">-- Elige una sede --</option>
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>

                {sedeId && (
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
