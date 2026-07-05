import React, { useState, useEffect } from 'react';
import { getEvaluacionesEstudiante } from '../service/instructor.Service';

export default function ProgresoEstudianteView({ user }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const estudianteId = user?.estudianteId || user?.id;

  useEffect(() => {
    const cargarDatos = async () => {
      if (!estudianteId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getEvaluacionesEstudiante(0, estudianteId);
        setEvaluaciones(data || []);
      } catch (err) {
        console.error('Error al obtener progreso:', err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [estudianteId]);

  // Calcular promedios
  const totalEvals = evaluaciones.length;
  let notaPromedio = 0;
  let esApto = false;
  let promCriterios = {
    control_volante: 0,
    uso_espejos: 0,
    respeto_senalizacion: 0,
    maniobras_estacionamiento: 0,
    confianza_general: 0,
  };

  if (totalEvals > 0) {
    const sumaNotas = evaluations => evaluations.reduce((acc, ev) => acc + (ev.nota || 0), 0);
    notaPromedio = parseFloat((sumaNotas(evaluaciones) / totalEvals).toFixed(1));
    
    // El estado apto lo define la última evaluación
    const ultima = evaluaciones[0]; // ordenado DESC
    esApto = ultima?.es_apto ?? (notaPromedio >= 4.0);

    // Sumar criterios
    evaluaciones.forEach(ev => {
      promCriterios.control_volante += ev.puntuaciones?.control_volante || 0;
      promCriterios.uso_espejos += ev.puntuaciones?.uso_espejos || 0;
      promCriterios.respeto_senalizacion += ev.puntuaciones?.respeto_senalizacion || 0;
      promCriterios.maniobras_estacionamiento += ev.puntuaciones?.maniobras_estacionamiento || 0;
      promCriterios.confianza_general += ev.puntuaciones?.confianza_general || 0;
    });

    promCriterios.control_volante = parseFloat((promCriterios.control_volante / totalEvals).toFixed(1));
    promCriterios.uso_espejos = parseFloat((promCriterios.uso_espejos / totalEvals).toFixed(1));
    promCriterios.respeto_senalizacion = parseFloat((promCriterios.respeto_senalizacion / totalEvals).toFixed(1));
    promCriterios.maniobras_estacionamiento = parseFloat((promCriterios.maniobras_estacionamiento / totalEvals).toFixed(1));
    promCriterios.confianza_general = parseFloat((promCriterios.confianza_general / totalEvals).toFixed(1));
  }

  const criteriosList = [
    { label: 'Control del Vehículo y Volante', key: 'control_volante' },
    { label: 'Uso de Espejos y Puntos Ciegos', key: 'uso_espejos' },
    { label: 'Respeto de Señalización Vial', key: 'respeto_senalizacion' },
    { label: 'Maniobras de Estacionamiento', key: 'maniobras_estacionamiento' },
    { label: 'Confianza y Seguridad General', key: 'confianza_general' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen font-body">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-gray-900 tracking-tight">Mi Progreso Académico</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitorea tus calificaciones en tiempo real y revisa tu estado de certificación para el examen municipal.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-gray-500">Cargando tu expediente académico...</p>
        </div>
      ) : totalEvals === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center font-black text-2xl mx-auto">
            i
          </div>
          <h3 className="text-lg font-bold text-gray-800">Aún no tienes clases evaluadas</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Tus instructores registrarán tus calificaciones y observaciones al finalizar cada una de tus clases prácticas y teóricas.
          </p>
        </div>
      ) : (
        <>
          {/* HERO CARD: ESTADO MUNICIPAL */}
          <div className="bg-primary rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-2xl"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
              {/* Estado Municipal */}
              <div className="md:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
                  <span>CERTIFICACIÓN MUNICIPAL</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {esApto ? 'APTO PARA RENDIR EXAMEN' : 'EN PREPARACIÓN ACADÉMICA'}
                </h2>
                <p className="text-sm text-white/90 max-w-xl leading-relaxed font-normal">
                  {esApto
                    ? 'Felicidades, has alcanzado y superado el estándar mínimo exigido. La escuela acredita que cuentas con las competencias teóricas y prácticas para aprobar en la Dirección de Tránsito.'
                    : 'Actualmente te encuentras en proceso de perfeccionamiento. Recuerda que el Ministerio exige una aprobación mínima equivalente a nota 4.0 (60% de exigencia) para emitir el certificado de aptitud.'}
                </p>
                
                <div className="flex items-center gap-4 pt-2 text-xs font-bold text-white">
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-white">
                    Clases Evaluadas: <strong className="text-white font-black">{totalEvals}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-white">
                    Exigencia Mínima: <strong className="text-white font-black">Nota 4.0</strong>
                  </span>
                </div>
              </div>

              {/* Nota Promedio */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase tracking-widest text-white/90">Nota Promedio</span>
                <div className="text-5xl font-black my-2 tracking-tight text-white flex items-baseline gap-1">
                  {notaPromedio} <span className="text-xl font-bold text-white/70">/ 7.0</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${esApto ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, (notaPromedio / 7.0) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-white/90 mt-2 uppercase tracking-wider">
                  {esApto ? 'Estándar Aprobado' : 'Refuerzo Recomendado'}
                </span>
              </div>
            </div>
          </div>

          {/* GRID: DESGLOSE DE COMPETENCIAS + REQUISITOS MUNICIPALES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Barras de competencia al volante */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Dominio por Competencias (Escala 0 a 5 pts)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Promedio de puntaje obtenido en cada uno de los 5 pilares de evaluación técnica.
                </p>
              </div>

              <div className="space-y-4">
                {criteriosList.map(crit => {
                  const val = promCriterios[crit.key] || 0;
                  const porcentaje = (val / 5.0) * 100;
                  return (
                    <div key={crit.key} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-gray-800 font-medium">
                          {crit.label}
                        </span>
                        <span className="font-extrabold text-primary">{val} / 5 pts</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            val >= 3.0 ? 'bg-primary' : 'bg-amber-500'
                          }`}
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requisitos y Consejos Municipales */}
            <div className="bg-primary rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between space-y-6 border border-primary/80">
              <div className="space-y-4">
                <div className="inline-block px-2.5 py-1 bg-white/10 rounded text-white font-extrabold text-xs uppercase tracking-wider border border-white/20">
                  Requisitos Tránsito
                </div>
                <h4 className="text-xl font-bold text-white leading-snug">¿Qué necesitas para el día de tu examen?</h4>
                <ul className="space-y-3 text-xs text-white/90 leading-relaxed font-normal">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong className="text-white font-semibold">Cédula de Identidad:</strong> Vigente y en buen estado físico.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong className="text-white font-semibold">Certificado de la Escuela:</strong> Emitido oficialmente al estar clasificado como APTO.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong className="text-white font-semibold">Examen Teórico & Psicotécnico:</strong> Rendición in-situ en la Dirección de Tránsito.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-xl p-4 border border-white/20 text-xs text-white/90 font-normal">
                <strong className="text-white font-bold block mb-1">Tip de Instructor:</strong>
                "Asegúrate de regular tu asiento y espejos antes de encender el motor en el examen práctico. El examinador evalúa tu preparación previa al avance."
              </div>
            </div>
          </div>

          {/* HISTORIAL CRONOLÓGICO DE EVALUACIONES */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Historial Detallado de Clases</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Bitácora de retroalimentación y calificaciones otorgadas por tus instructores.
              </p>
            </div>

            <div className="space-y-4">
              {evaluaciones.map((ev) => (
                <div key={ev.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary/40 transition-colors bg-gray-50/50 space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ev.es_teorica ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ev.es_teorica ? 'Clase Teórica / Examen' : 'Clase Práctica'}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(ev.fecha).toLocaleDateString('es-CL', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 mt-1">Instructor: {ev.instructor_nombre}</h4>
                    </div>

                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-right">
                        <div className="text-[9px] text-gray-400 font-black uppercase">Puntaje</div>
                        <div className="text-xs font-extrabold text-gray-700">{ev.puntaje_total} / 25 pts</div>
                      </div>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <div className="text-right">
                        <div className="text-[9px] text-gray-400 font-black uppercase">Nota</div>
                        <div className={`text-sm font-black ${ev.es_apto ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {ev.nota}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  {ev.observaciones && (
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 text-xs text-gray-700">
                      <strong className="text-gray-900 block mb-0.5 font-bold">Retroalimentación del Instructor:</strong>
                      {ev.observaciones}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
