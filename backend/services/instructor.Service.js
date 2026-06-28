const { AppDataSource } = require('../db/data-source');

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
      'e.tipo_licencia AS estudiante_licencia',
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
      tipo_licencia: c.estudiante_licencia,
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
  
  if (instructorId === null) {
    const estudiantes = await repoUsuario.createQueryBuilder('u')
      .select([
        'u.id AS id',
        'u.nombre AS nombre',
        'u.email AS email',
        'u.telefono AS telefono',
        'u.tipo_licencia AS tipo_licencia',
        'u.calificacion_promedio AS calificacion_promedio',
        'u.total_clases_completadas AS total_clases_completadas',
      ])
      .where("u.rol = 'estudiante'")
      .andWhere("u.estado = 'activo'")
      .orderBy('u.nombre', 'ASC')
      .getRawMany();

    const repoEval = AppDataSource.getRepository('EvaluacionInstructor');
    for (const est of estudiantes) {
      const evals = await repoEval.find({ where: { estudiante_id: est.id } });
      if (evals.length > 0) {
        const suma = evals.reduce((acc, ev) => {
          const promEv = (ev.control_volante + ev.uso_espejos + ev.respeto_senalizacion + ev.maniobras_estacionamiento + ev.confianza_general) / 5;
          return acc + promEv;
        }, 0);
        est.evaluacion_promedio = parseFloat((suma / evals.length).toFixed(1));
      } else {
        est.evaluacion_promedio = null;
      }
    }
    return estudiantes;
  }

  // Obtener la licencia del instructor
  const instructor = await repoUsuario.findOne({ where: { id: instructorId } });
  const licenciaInstructor = instructor?.tipo_licencia || instructor?.especialidad;

  // Buscar estudiantes que tengan reservas con este instructor O compartan la misma licencia en la misma sede
  const qb = repoUsuario.createQueryBuilder('u')
    .select([
      'u.id AS id',
      'u.nombre AS nombre',
      'u.email AS email',
      'u.telefono AS telefono',
      'u.tipo_licencia AS tipo_licencia',
      'u.calificacion_promedio AS calificacion_promedio',
      'u.total_clases_completadas AS total_clases_completadas',
    ])
    .where("u.rol = 'estudiante'")
    .andWhere("u.estado = 'activo'");

  const sedeId = instructor?.sede_id || 1;

  if (licenciaInstructor) {
    qb.andWhere("((u.sede_id = :sedeId AND (u.tipo_licencia = :licencia OR u.tipo_licencia IS NULL)) OR u.id IN (SELECT estudiante_id FROM reservas WHERE instructor_id = :instructorId))", {
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

  const estudiantes = await qb.orderBy('u.nombre', 'ASC').getRawMany();

  // Traer el promedio de evaluaciones de cada estudiante
  const repoEval = AppDataSource.getRepository('EvaluacionInstructor');
  for (const est of estudiantes) {
    const evals = await repoEval.find({ where: { estudiante_id: est.id } });
    if (evals.length > 0) {
      const suma = evals.reduce((acc, ev) => {
        const promEv = (ev.control_volante + ev.uso_espejos + ev.respeto_senalizacion + ev.maniobras_estacionamiento + ev.confianza_general) / 5;
        return acc + promEv;
      }, 0);
      est.evaluacion_promedio = parseFloat((suma / evals.length).toFixed(1));
    } else {
      est.evaluacion_promedio = null;
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
  const nueva = repo.create({
    reserva_id: data.reserva_id || null,
    instructor_id: data.instructor_id,
    estudiante_id: data.estudiante_id,
    control_volante: data.control_volante || 5,
    uso_espejos: data.uso_espejos || 5,
    respeto_senalizacion: data.respeto_senalizacion || 5,
    maniobras_estacionamiento: data.maniobras_estacionamiento || 5,
    confianza_general: data.confianza_general || 5,
    listo_examen: data.listo_examen || 'si',
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
      promedio: parseFloat(((ev.control_volante + ev.uso_espejos + ev.respeto_senalizacion + ev.maniobras_estacionamiento + ev.confianza_general) / 5).toFixed(1)),
      listo_examen: ev.listo_examen,
      observaciones: obsLimpia,
    };
  });
};

module.exports = {
  obtenerClasesHoy,
  obtenerEstudiantes,
  guardarEvaluacion,
  obtenerEvaluacionesEstudiante,
};
