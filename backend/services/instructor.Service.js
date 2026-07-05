const { AppDataSource } = require('../db/data-source');

function calcularNota(puntajeTotal) {
  const p = Math.max(0, Math.min(25, Number(puntajeTotal) || 0));
  let nota;
  if (p >= 15) {
    nota = 4.0 + 0.3 * (p - 15);
  } else {
    nota = 1.0 + 0.2 * p;
  }
  return parseFloat(nota.toFixed(1));
}

const obtenerClasesHoy = async (instructorId, fechaStr) => {
  const repo = AppDataSource.getRepository('Reserva');
  
  // Si no se proporciona fecha, usar hoy en Chile
  let fechaInicio, fechaFin;
  if (fechaStr) {
    fechaInicio = `${fechaStr} 00:00:00`;
    fechaFin = `${fechaStr} 23:59:59`;
  } else {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    fechaInicio = `${hoy} 00:00:00`;
    fechaFin = `${hoy} 23:59:59`;
  }

  const qb = repo.createQueryBuilder('r')
    .leftJoin('r.estudiante', 'e')
    .leftJoin('r.vehiculo', 'v')
    .leftJoin('r.tipoClase', 'tc')
    .leftJoin('r.sede', 's')
    .leftJoin('evaluaciones_instructor', 'ev', 'ev.reserva_id = r.id')
    .select([
      'r.id AS id',
      'r.estado AS estado',
      'r.fecha_inicio AS fecha_inicio',
      'r.fecha_fin AS fecha_fin',
      'e.id AS estudiante_id',
      'e.nombre AS estudiante_nombre',
      'e.tipo_clase AS estudiante_tipo_clase',
      'v.id AS vehiculo_id',
      'v.patente AS vehiculo_patente',
      'v.modelo AS vehiculo_modelo',
      'tc.nombre AS tipo_clase_nombre',
      'tc.color AS tipo_clase_color',
      's.nombre AS sede_nombre',
      'ev.id AS evaluacion_id'
    ]);

  if (instructorId !== null) {
    qb.where('r.instructor_id = :instructorId', { instructorId });
  } else {
    qb.where('1=1');
  }

  const clases = await qb
    .andWhere('r.fecha_inicio >= :fechaInicio AND r.fecha_inicio <= :fechaFin', { fechaInicio, fechaFin })
    .orderBy('r.fecha_inicio', 'ASC')
    .getRawMany();

  return clases.map(c => ({
    id: c.id,
    estado: c.estado,
    fecha_inicio: c.fecha_inicio,
    fecha_fin: c.fecha_fin,
    estudiante: {
      id: c.estudiante_id,
      nombre: c.estudiante_nombre,
      tipo_clase: c.estudiante_tipo_clase,
    },
    vehiculo: c.vehiculo_id ? {
      id: c.vehiculo_id,
      patente: c.vehiculo_patente,
      modelo: c.vehiculo_modelo,
    } : null,
    tipoClase: {
      nombre: c.tipo_clase_nombre || 'Clase Práctica',
      color: c.tipo_clase_color || '#2563eb',
    },
    sede_nombre: c.sede_nombre,
    evaluado: Boolean(c.evaluacion_id),
  }));
};

const obtenerEstudiantes = async (instructorId) => {
  const repoUsuario = AppDataSource.getRepository('Usuario');
  let estudiantes = [];
  
  if (instructorId === null) {
    estudiantes = await repoUsuario.createQueryBuilder('u')
      .select([
        'u.id AS id',
        'u.nombre AS nombre',
        'u.email AS email',
        'u.telefono AS telefono',
        'u.tipo_clase AS tipo_clase',
        'u.calificacion_promedio AS calificacion_promedio',
        'u.total_clases_completadas AS total_clases_completadas',
      ])
      .where("u.rol = 'estudiante'")
      .andWhere("u.estado = 'activo'")
      .orderBy('u.nombre', 'ASC')
      .getRawMany();
  } else {
    // Obtener la licencia del instructor
    const instructor = await repoUsuario.findOne({ where: { id: instructorId } });
    const licenciaInstructor = instructor?.tipo_clase || instructor?.especialidad;
    const sedeId = instructor?.sede_id || 1;

    // Buscar estudiantes que tengan reservas con este instructor O compartan la misma licencia en la misma sede
    const qb = repoUsuario.createQueryBuilder('u')
      .select([
        'u.id AS id',
        'u.nombre AS nombre',
        'u.email AS email',
        'u.telefono AS telefono',
        'u.tipo_clase AS tipo_clase',
        'u.calificacion_promedio AS calificacion_promedio',
        'u.total_clases_completadas AS total_clases_completadas',
      ])
      .where("u.rol = 'estudiante'")
      .andWhere("u.estado = 'activo'");

    if (licenciaInstructor) {
      qb.andWhere("((u.sede_id = :sedeId AND (u.tipo_clase = :licencia OR u.tipo_clase IS NULL)) OR u.id IN (SELECT estudiante_id FROM reservas WHERE instructor_id = :instructorId))", {
        sedeId,
        licencia: licenciaInstructor,
        instructorId
      });
    } else {
      qb.andWhere("(u.sede_id = :sedeId OR u.id IN (SELECT estudiante_id FROM reservas WHERE instructor_id = :instructorId))", {
        sedeId,
        instructorId
      });
    }

    estudiantes = await qb.orderBy('u.nombre', 'ASC').getRawMany();
  }

  // Traer el promedio y estado de aptitud de evaluaciones de cada estudiante (unificado para todos los casos)
  const repoEval = AppDataSource.getRepository('EvaluacionInstructor');
  for (const est of estudiantes) {
    const evals = await repoEval.find({ where: { estudiante_id: est.id } });
    if (evals.length > 0) {
      const sumaNotas = evals.reduce((acc, ev) => {
        const pTotal = ev.puntaje_total ?? (ev.control_volante + ev.uso_espejos + ev.respeto_senalizacion + ev.maniobras_estacionamiento + ev.confianza_general);
        const notaEv = ev.nota ?? calcularNota(pTotal);
        return acc + notaEv;
      }, 0);
      est.evaluacion_promedio = parseFloat((sumaNotas / evals.length).toFixed(1));
      
      // El estado de aptitud lo determina su última evaluación
      const ultimaEval = evals[evals.length - 1];
      const pUltimo = ultimaEval.puntaje_total ?? (ultimaEval.control_volante + ultimaEval.uso_espejos + ultimaEval.respeto_senalizacion + ultimaEval.maniobras_estacionamiento + ultimaEval.confianza_general);
      const notaUltima = ultimaEval.nota ?? calcularNota(pUltimo);
      est.es_apto = ultimaEval.es_apto ?? (notaUltima >= 4.0);
    } else {
      est.evaluacion_promedio = null;
      est.es_apto = null;
    }
  }

  return estudiantes;
};

const guardarEvaluacion = async (data) => {
  const repo = AppDataSource.getRepository('EvaluacionInstructor');
  let obs = data.observaciones || '';
  if (data.es_teorica && !obs.startsWith('[Teórica]')) {
    obs = '[Teórica] ' + obs;
  }

  const c1 = Number(data.control_volante) >= 0 ? Number(data.control_volante) : 5;
  const c2 = Number(data.uso_espejos) >= 0 ? Number(data.uso_espejos) : 5;
  const c3 = Number(data.respeto_senalizacion) >= 0 ? Number(data.respeto_senalizacion) : 5;
  const c4 = Number(data.maniobras_estacionamiento) >= 0 ? Number(data.maniobras_estacionamiento) : 5;
  const c5 = Number(data.confianza_general) >= 0 ? Number(data.confianza_general) : 5;

  const puntajeTotal = c1 + c2 + c3 + c4 + c5;
  const nota = calcularNota(puntajeTotal);
  const esApto = nota >= 4.0;
  const listoExamen = esApto ? 'si' : 'no';

  const nueva = repo.create({
    reserva_id: data.reserva_id || null,
    instructor_id: data.instructor_id,
    estudiante_id: data.estudiante_id,
    control_volante: c1,
    uso_espejos: c2,
    respeto_senalizacion: c3,
    maniobras_estacionamiento: c4,
    confianza_general: c5,
    puntaje_total: puntajeTotal,
    nota: nota,
    es_apto: esApto,
    listo_examen: listoExamen,
    observaciones: obs,
  });
  return await repo.save(nueva);
};

const obtenerEvaluacionesEstudiante = async (estudianteId) => {
  const repo = AppDataSource.getRepository('EvaluacionInstructor');
  const evals = await repo.find({
    where: { estudiante_id: estudianteId },
    relations: ['instructor', 'reserva', 'reserva.tipoClase'],
    order: { created_at: 'DESC' },
  });

  return evals.map(ev => {
    const nombreTC = ev.reserva?.tipoClase?.nombre?.toLowerCase() || '';
    const esTeorica = Boolean(
      ev.observaciones?.startsWith('[Teórica]') ||
      nombreTC.includes('teór') ||
      nombreTC.includes('teor')
    );
    const obsLimpia = ev.observaciones?.startsWith('[Teórica] ') ? ev.observaciones.replace('[Teórica] ', '') : ev.observaciones;

    const puntajeTotal = ev.puntaje_total ?? (ev.control_volante + ev.uso_espejos + ev.respeto_senalizacion + ev.maniobras_estacionamiento + ev.confianza_general);
    const nota = ev.nota ?? calcularNota(puntajeTotal);
    const esApto = ev.es_apto ?? (nota >= 4.0);

    return {
      id: ev.id,
      fecha: ev.created_at,
      instructor_nombre: ev.instructor?.nombre || 'Instructor',
      reserva_fecha: ev.reserva?.fecha_inicio || ev.created_at,
      es_teorica: esTeorica,
      puntuaciones: {
        control_volante: ev.control_volante,
        uso_espejos: ev.uso_espejos,
        respeto_senalizacion: ev.respeto_senalizacion,
        maniobras_estacionamiento: ev.maniobras_estacionamiento,
        confianza_general: ev.confianza_general,
      },
      puntaje_total: puntajeTotal,
      nota: nota,
      es_apto: esApto,
      listo_examen: ev.listo_examen || (esApto ? 'si' : 'no'),
      observaciones: obsLimpia,
    };
  });
};

module.exports = {
  obtenerClasesHoy,
  obtenerEstudiantes,
  guardarEvaluacion,
  obtenerEvaluacionesEstudiante,
  calcularNota,
};
