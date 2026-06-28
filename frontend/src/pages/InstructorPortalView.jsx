import React, { useState, useEffect } from 'react';
import { getClasesHoy, getEstudiantesInstructor, guardarEvaluacion, getEvaluacionesEstudiante } from '../service/instructor.Service';

export default function InstructorPortalView({ user }) {
  const [tab, setTab] = useState('calendario'); // 'calendario' | 'estudiantes'
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [clases, setClases] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [licenciaAdmin, setLicenciaAdmin] = useState('todas');

  // Modal de evaluación
  const [modalEvalOpen, setModalEvalOpen] = useState(false);
  const [reservaEval, setReservaEval] = useState(null);
  const [estudianteEval, setEstudianteEval] = useState(null);
  const [formEval, setFormEval] = useState({
    control_volante: 5,
    uso_espejos: 5,
    respeto_senalizacion: 5,
    maniobras_estacionamiento: 5,
    confianza_general: 5,
    listo_examen: 'si',
    observaciones: '',
    es_teorica: false,
  });

  // Modal de historial
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [estudianteHistorial, setEstudianteHistorial] = useState(null);

  const instructorId = user?.instructorId || user?.id;

  const cargarClases = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const data = await getClasesHoy(instructorId, fecha);
      setClases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstudiantes = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const data = await getEstudiantesInstructor(instructorId);
      setEstudiantes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'calendario') cargarClases();
    if (tab === 'estudiantes') cargarEstudiantes();
  }, [tab, fecha, instructorId]);

  const cambiarFecha = (dias) => {
    const act = new Date(fecha + 'T12:00:00');
    act.setDate(act.getDate() + dias);
    setFecha(act.toISOString().split('T')[0]);
  };

  const abrirModalEval = (clase = null, estudiante = null) => {
    setReservaEval(clase);
    setEstudianteEval(estudiante || (clase ? clase.estudiante : null));
    const nombre = clase?.tipoClase?.nombre?.toLowerCase() || '';
    const esTeorica = Boolean(nombre.includes('teór') || nombre.includes('teor'));
    setFormEval({
      control_volante: 5,
      uso_espejos: 5,
      respeto_senalizacion: 5,
      maniobras_estacionamiento: 5,
      confianza_general: 5,
      listo_examen: 'si',
      observaciones: '',
      es_teorica: esTeorica,
    });
    setModalEvalOpen(true);
  };

  const handleSubmitEval = async (e) => {
    e.preventDefault();
    try {
      await guardarEvaluacion({
        reserva_id: reservaEval?.id || null,
        instructor_id: instructorId,
        estudiante_id: estudianteEval?.id,
        ...formEval
      });
      setModalEvalOpen(false);
      alert('¡Evaluación guardada exitosamente!');
      if (tab === 'calendario') cargarClases();
      if (tab === 'estudiantes') cargarEstudiantes();
    } catch (err) {
      alert('Error al guardar la evaluación: ' + err.message);
    }
  };

  const verHistorial = async (estudiante) => {
    setEstudianteHistorial(estudiante);
    try {
      const data = await getEvaluacionesEstudiante(instructorId, estudiante.id);
      setHistorial(data);
      setModalHistorialOpen(true);
    } catch (err) {
      alert('Error al obtener historial: ' + err.message);
    }
  };

  const StarInput = ({ label, name, value, onChange }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange({ ...formEval, [name]: star })}
            className={`text-2xl transition-transform hover:scale-125 focus:outline-none ${
              star <= value ? 'text-amber-400' : 'text-gray-200'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  const clasesAMostrar = user?.rol === 'admin' && licenciaAdmin !== 'todas'
    ? clases.filter(c => !c.estudiante?.tipo_licencia || c.estudiante.tipo_licencia === licenciaAdmin)
    : clases;

  const estudiantesAMostrar = user?.rol === 'admin' && licenciaAdmin !== 'todas'
    ? estudiantes.filter(e => !e.tipo_licencia || e.tipo_licencia === licenciaAdmin)
    : estudiantes;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header del Portal */}
      <div className="bg-primary rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Portal del Instructor
          </div>
          <h1 className="text-3xl font-extrabold">{user?.label || 'Profesor'}</h1>
          {user?.rol === 'admin' ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white/80 text-xs font-semibold">Licencia (Modo Admin):</span>
              <select
                value={licenciaAdmin}
                onChange={(e) => setLicenciaAdmin(e.target.value)}
                className="bg-white/10 border border-white/30 text-white rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-white"
              >
                <option value="todas" className="text-gray-900">Todas las licencias</option>
                <option value="A" className="text-gray-900">Clase A</option>
                <option value="B" className="text-gray-900">Clase B</option>
                <option value="C" className="text-gray-900">Clase C</option>
              </select>
            </div>
          ) : (
            <p className="text-white/80 text-sm mt-1">
              Especialidad / Licencia: <span className="font-semibold bg-white/10 px-2 py-0.5 rounded">Clase {user?.tipo_licencia || 'B'}</span>
            </p>
          )}
        </div>

        {/* Tabs de Navegación */}
        <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/10">
          <button
            onClick={() => setTab('calendario')}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
              tab === 'calendario' ? 'bg-white text-primary shadow-md font-bold' : 'text-white/80 hover:text-white'
            }`}
          >
            Mi Agenda del Día
          </button>
          <button
            onClick={() => setTab('estudiantes')}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
              tab === 'estudiantes' ? 'bg-white text-primary shadow-md font-bold' : 'text-white/80 hover:text-white'
            }`}
          >
            Mis Estudiantes
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : tab === 'calendario' ? (
        /* SECCIÓN 1: CALENDARIO DEL DÍA */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Controles de fecha */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => cambiarFecha(-1)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium">
                ← Anterior
              </button>
              <button onClick={() => setFecha(new Date().toISOString().split('T')[0])} className="px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary rounded-lg hover:bg-primary/10 text-sm font-bold">
                Hoy
              </button>
              <button onClick={() => cambiarFecha(1)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium">
                Siguiente →
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Fecha seleccionada:</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold bg-white"
              />
            </div>
          </div>

          {/* Lista de clases */}
          <div className="p-6">
            {clasesAMostrar.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <h3 className="text-lg font-semibold text-gray-700">No tienes clases agendadas para este día</h3>
                <p className="text-sm">Selecciona otra fecha o revisa la pestaña de tus estudiantes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clasesAMostrar.map((clase) => {
                  const horaInicio = new Date(clase.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                  const horaFin = new Date(clase.fecha_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={clase.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-xl border border-gray-200 hover:border-primary/40 transition-all bg-gradient-to-r from-white to-gray-50/50 shadow-sm gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 text-primary font-bold px-4 py-3 rounded-xl text-center min-w-[90px]">
                          <div className="text-base">{horaInicio}</div>
                          <div className="text-xs font-normal text-primary/80">{horaFin}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-lg">{clase.estudiante.nombre}</span>
                            <span className="text-xs bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                              {clase.estudiante.tipo_licencia || 'Licencia General'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                            <span>Vehículo: {clase.vehiculo ? `${clase.vehiculo.modelo} (${clase.vehiculo.patente})` : 'Sin vehículo'}</span>
                            <span>•</span>
                            <span className="font-medium" style={{ color: clase.tipoClase.color }}>{clase.tipoClase.nombre}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          clase.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          clase.estado === 'confirmada' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {clase.estado.toUpperCase()}
                        </span>

                        <button
                          onClick={() => abrirModalEval(clase)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${
                            clase.evaluado
                              ? 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                        >
                          {clase.evaluado ? 'Actualizar Evaluación' : 'Evaluar Desempeño'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SECCIÓN 2: MIS ESTUDIANTES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estudiantesAMostrar.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-500">
              <h3 className="text-lg font-semibold text-gray-700">No hay estudiantes asignados o de esta licencia</h3>
            </div>
          ) : (
            estudiantesAMostrar.map((est) => (
              <div key={est.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg shadow-inner">
                      {est.nombre.charAt(0)}
                    </div>
                    <span className="text-xs font-bold bg-primary/5 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                      {est.tipo_licencia || 'Licencia B'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1">{est.nombre}</h3>
                  <p className="text-xs text-gray-500 mb-4">Email: {est.email}</p>

                  <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between mb-4 border border-gray-100">
                    <span className="text-xs font-medium text-gray-600">Promedio Evaluaciones:</span>
                    <span className="font-bold text-sm flex items-center gap-1">
                      {est.evaluacion_promedio ? (
                        <><span className="text-amber-500">★</span> {est.evaluacion_promedio} / 5.0</>
                      ) : (
                        <span className="text-gray-400 font-normal">Sin evaluar</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => verHistorial(est)}
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Historial
                  </button>
                  <button
                    onClick={() => abrirModalEval(null, est)}
                    className="flex-1 py-2 px-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    Evaluar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL FORMULARIO DE EVALUACIÓN */}
      {modalEvalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Evaluación de Desempeño</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Estudiante: <span className="font-semibold">{estudianteEval?.nombre}</span>
                </p>
              </div>
              <button onClick={() => setModalEvalOpen(false)} className="text-white/80 hover:text-white text-2xl font-bold">×</button>
            </div>

            <form onSubmit={handleSubmitEval} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Toggle Teórica / Práctica */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
                <span className="text-xs font-bold text-gray-700">Modalidad de Clase:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormEval({ ...formEval, es_teorica: false })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!formEval.es_teorica ? 'bg-primary text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Práctica
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormEval({ ...formEval, es_teorica: true })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formEval.es_teorica ? 'bg-purple-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Teórica / Examen
                  </button>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary font-medium">
                {formEval.es_teorica
                  ? 'Califica de 1 a 5 estrellas el dominio de los contenidos teóricos y normativa vial.'
                  : 'Califica de 1 a 5 estrellas cada aspecto técnico de la conducción práctica.'}
              </div>

              <div className="space-y-1">
                <StarInput
                  label={formEval.es_teorica ? 'Comprensión de Leyes y Normativa' : 'Control del volante y pedales'}
                  name="control_volante"
                  value={formEval.control_volante}
                  onChange={setFormEval}
                />
                <StarInput
                  label={formEval.es_teorica ? 'Conocimiento de Señalización Vial' : 'Uso de espejos y puntos ciegos'}
                  name="uso_espejos"
                  value={formEval.uso_espejos}
                  onChange={setFormEval}
                />
                <StarInput
                  label={formEval.es_teorica ? 'Resolución de Situaciones de Riesgo' : 'Respeto de señalización vial'}
                  name="respeto_senalizacion"
                  value={formEval.respeto_senalizacion}
                  onChange={setFormEval}
                />
                <StarInput
                  label={formEval.es_teorica ? 'Participación y Atención en Clase' : 'Maniobras de estacionamiento'}
                  name="maniobras_estacionamiento"
                  value={formEval.maniobras_estacionamiento}
                  onChange={setFormEval}
                />
                <StarInput
                  label={formEval.es_teorica ? 'Resultado en Test Teórico' : 'Confianza y seguridad general'}
                  name="confianza_general"
                  value={formEval.confianza_general}
                  onChange={setFormEval}
                />
              </div>

              <div className="pt-2 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formEval.es_teorica ? '¿Aprobó la evaluación teórica?' : '¿Está listo para dar el examen municipal?'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['si', 'casi', 'no'].map((opcion) => (
                    <label key={opcion} className={`border rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center font-bold text-xs uppercase ${
                      formEval.listo_examen === opcion
                        ? 'bg-primary/5 border-primary text-primary ring-2 ring-primary/20'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="listo_examen"
                        value={opcion}
                        checked={formEval.listo_examen === opcion}
                        onChange={(e) => setFormEval({ ...formEval, listo_examen: e.target.value })}
                        className="sr-only"
                      />
                      {formEval.es_teorica
                        ? (opcion === 'si' ? 'Aprobado' : opcion === 'casi' ? 'Pendiente / Repaso' : 'Reprobado')
                        : (opcion === 'si' ? 'Sí, Listo' : opcion === 'casi' ? 'Casi Listo' : 'Aún No')}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones detalladas para el alumno:</label>
                <textarea
                  rows="3"
                  value={formEval.observaciones}
                  onChange={(e) => setFormEval({ ...formEval, observaciones: e.target.value })}
                  placeholder={formEval.es_teorica ? 'Ej: Demostró excelente dominio de ceda el paso y normativa vial.' : 'Ej: Debe mejorar el embrague en pendientes. Excelente respeto al ceda el paso.'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setModalEvalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md">
                  Guardar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE EVALUACIONES */}
      {modalHistorialOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Historial de Evaluaciones</h3>
                <p className="text-xs text-white/80 mt-0.5">Alumno: <span className="font-semibold text-white">{estudianteHistorial?.nombre}</span></p>
              </div>
              <button onClick={() => setModalHistorialOpen(false)} className="text-white/80 hover:text-white text-2xl font-bold">×</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {historial.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay evaluaciones previas registradas.</div>
              ) : (
                historial.map((h) => (
                  <div key={h.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">{new Date(h.fecha).toLocaleDateString('es-CL')}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.es_teorica ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                          {h.es_teorica ? 'Modalidad: Teórica' : 'Modalidad: Práctica'}
                        </span>
                      </div>
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        ★ Promedio: {h.promedio} / 5.0
                      </span>
                    </div>

                    {h.es_teorica ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>Leyes: <span className="font-bold">{h.puntuaciones.control_volante}★</span></div>
                        <div>Señales: <span className="font-bold">{h.puntuaciones.uso_espejos}★</span></div>
                        <div>Riesgos: <span className="font-bold">{h.puntuaciones.respeto_senalizacion}★</span></div>
                        <div>Atención: <span className="font-bold">{h.puntuaciones.maniobras_estacionamiento}★</span></div>
                        <div>Test: <span className="font-bold">{h.puntuaciones.confianza_general}★</span></div>
                        <div>Resultado: <span className="font-bold uppercase text-purple-700">{h.listo_examen === 'si' ? 'APROBADO' : h.listo_examen === 'casi' ? 'PENDIENTE' : 'REPROBADO'}</span></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>Volante: <span className="font-bold">{h.puntuaciones.control_volante}★</span></div>
                        <div>Espejos: <span className="font-bold">{h.puntuaciones.uso_espejos}★</span></div>
                        <div>Señales: <span className="font-bold">{h.puntuaciones.respeto_senalizacion}★</span></div>
                        <div>Estacionamiento: <span className="font-bold">{h.puntuaciones.maniobras_estacionamiento}★</span></div>
                        <div>Confianza: <span className="font-bold">{h.puntuaciones.confianza_general}★</span></div>
                        <div>Examen: <span className="font-bold uppercase text-primary">{h.listo_examen}</span></div>
                      </div>
                    )}

                    {h.observaciones && (
                      <div className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200 italic">
                        "{h.observaciones}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end bg-white">
              <button onClick={() => setModalHistorialOpen(false)} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
