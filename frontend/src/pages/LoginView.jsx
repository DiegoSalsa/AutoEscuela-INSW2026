import React, { useState, useEffect } from 'react';
import { getEstudiantes, getSedes } from '../service/reservas.Service';
import './LoginView.css';

export default function LoginView({ onLogin }) {
  const [sedes, setSedes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  const [rol, setRol] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [estudianteId, setEstudianteId] = useState('');

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

  useEffect(() => {
    if (!sedeId || rol !== 'estudiante') {
      setEstudiantes([]);
      return;
    }

    const fetchEstudiantes = async () => {
      try {
        const data = await getEstudiantes(sedeId);
        setEstudiantes(data);
        if (data.length > 0) setEstudianteId(data[0].id.toString());
      } catch (error) {
        console.error('Error al cargar estudiantes', error);
      }
    };
    fetchEstudiantes();
  }, [sedeId, rol]);

  const handleLoginAdmin = () => {
    onLogin({ id: 'admin', label: 'Administrador', rol: 'admin', estudianteId: null });
  };

  const handleLoginEstudiante = () => {
    if (!estudianteId) return;
    const estudiante = estudiantes.find((e) => e.id.toString() === estudianteId);
    if (!estudiante) return;

    onLogin({
      id: 'estudiante',
      label: estudiante.nombre || 'Estudiante',
      rol: 'estudiante',
      estudianteId: estudiante.id,
      sedeId: parseInt(sedeId, 10),
    });
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
            <button className="login-simple-btn btn-student" onClick={() => setRol('estudiante')}>
              Soy Estudiante
            </button>
          </div>
        ) : (
          <div className="login-simple-form">
            <button className="btn-back" onClick={() => setRol('')}>Volver</button>

            {rol === 'admin' ? (
              <div className="form-group">
                <p className="info-text">Ingreso como Administrador. Tendras acceso total al sistema.</p>
                <button className="login-simple-btn btn-admin" onClick={handleLoginAdmin}>
                  Entrar como Admin
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label>1. Selecciona tu sede:</label>
                <select
                  className="login-simple-select"
                  value={sedeId}
                  onChange={(e) => { setSedeId(e.target.value); setEstudianteId(''); }}
                >
                  <option value="">-- Elige una sede --</option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>

                {sedeId && (
                  <>
                    <label>2. Selecciona tu nombre:</label>
                    <select
                      className="login-simple-select"
                      value={estudianteId}
                      onChange={(e) => setEstudianteId(e.target.value)}
                    >
                      {estudiantes.length === 0 && <option value="">No hay estudiantes en esta sede</option>}
                      {estudiantes.map((e) => (
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
