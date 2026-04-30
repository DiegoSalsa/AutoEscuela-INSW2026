const { AppDataSource } = require('../db/data-source');
const { httpError } = require('../helpers/error.helper');
const { aplicarFiltros } = require('../helpers/db.helper');

// Tiempo mínimo de traslado entre sedes (en minutos)
const TIEMPO_TRASLADO_MIN = parseInt(process.env.TIEMPO_TRASLADO_MIN, 10) || 60;


// Valida la restricción de traslado vehicular (tiempo mínimo entre sedes)
const validarTrasladoVehicular = async (repoReserva, vehiculoId, sedeId, fechaInicio, fechaFin) => {
  // Buscar la reserva inmediatamente ANTERIOR del vehículo
  const anterior = await repoReserva.createQueryBuilder('r')
    .where('r.vehiculo_id = :vehiculoId', { vehiculoId })
    .andWhere("r.estado IN ('confirmada', 'en_progreso', 'proxima')")
    .andWhere('r.fecha_fin <= :fechaInicio', { fechaInicio })
    .orderBy('r.fecha_fin', 'DESC')
    .getOne();

  if (anterior && anterior.sede_id !== sedeId) {
    const finAnterior = new Date(anterior.fecha_fin).getTime();
    const inicioNueva = new Date(fechaInicio).getTime();
    const diferenciaMin = (inicioNueva - finAnterior) / (1000 * 60);

    if (diferenciaMin < TIEMPO_TRASLADO_MIN) {
      throw httpError(
        `El vehículo tiene una reserva previa en otra sede que finaliza a las ${new Date(anterior.fecha_fin).toLocaleTimeString('es-CL')}. ` +
        `Se requieren al menos ${TIEMPO_TRASLADO_MIN} minutos de traslado entre sedes.`,
        409
      );
    }
  }

  // Buscar la reserva inmediatamente POSTERIOR del vehículo
  const posterior = await repoReserva.createQueryBuilder('r')
    .where('r.vehiculo_id = :vehiculoId', { vehiculoId })
    .andWhere("r.estado IN ('confirmada', 'en_progreso', 'proxima')")
    .andWhere('r.fecha_inicio >= :fechaFin', { fechaFin })
    .orderBy('r.fecha_inicio', 'ASC')
    .getOne();

  if (posterior && posterior.sede_id !== sedeId) {
    const finNueva = new Date(fechaFin).getTime();
    const inicioPosterior = new Date(posterior.fecha_inicio).getTime();
    const diferenciaMin = (inicioPosterior - finNueva) / (1000 * 60);

    if (diferenciaMin < TIEMPO_TRASLADO_MIN) {
      throw httpError(
        `El vehículo tiene una reserva posterior en otra sede que inicia a las ${new Date(posterior.fecha_inicio).toLocaleTimeString('es-CL')}. ` +
        `Se requieren al menos ${TIEMPO_TRASLADO_MIN} minutos de traslado entre sedes.`,
        409
      );
    }
  }
};

//Crea una reserva utilizando una transacción SERIALIZABLE para evitar condiciones de carrera.
const crearReservaTransaccional = async (reservaData) => {
  const { estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin } = reservaData;

  try {
    return await AppDataSource.manager.transaction("SERIALIZABLE", async (manager) => {
      const repoUsuario  = manager.getRepository('Usuario');
      const repoVehiculo = manager.getRepository('Vehiculo');
      const repoReserva  = manager.getRepository('Reserva');

      //  validar estudiante, instructor y vehículo en paralelo
      const [estudiante, instructor, vehiculo] = await Promise.all([
        repoUsuario.findOne({
          where: { id: estudianteId, rol: 'estudiante', estado: 'activo', sede_id: sedeId },
        }),
        repoUsuario.findOne({
          where: { id: instructorId, rol: 'instructor', estado: 'activo', sede_id: sedeId },
        }),
        repoVehiculo.findOne({
          where: { id: vehiculoId, sede_id: sedeId, estado: 'disponible' },
        })
      ]);

      if (!estudiante) throw httpError('El estudiante no existe, no está activo o no pertenece a esta sede.', 404);
      if (!instructor) throw httpError('El instructor no existe, no está activo o no pertenece a esta sede.', 404);
      if (!vehiculo)   throw httpError('El vehículo no existe, no está disponible o no pertenece a esta sede.', 404);

      // restricción de traslado vehicular (anti-teletransportación)
      await validarTrasladoVehicular(repoReserva, vehiculoId, sedeId, fechaInicio, fechaFin);

      // verificar conflictos de horario con OVERLAPS
      const conflicto = await repoReserva.createQueryBuilder('r')
        .where("r.estado IN ('confirmada', 'en_progreso', 'proxima')")
        .andWhere(
          '(r.instructor_id = :instructorId OR r.vehiculo_id = :vehiculoId OR r.estudiante_id = :estudianteId)',
          { instructorId, vehiculoId, estudianteId }
        )
        .andWhere(
          '(r.fecha_inicio, r.fecha_fin) OVERLAPS (:fechaInicio::timestamp, (:fechaFin::timestamp + INTERVAL \'15 minutes\'))',
          { fechaInicio, fechaFin }
        )
        .getOne();

      if (conflicto) {
        throw httpError(
          'Conflicto de horario: el instructor, vehículo o estudiante ya tiene una reserva en ese lapso.',
          409
        );
      }

      // 5. insertar reserva
      return repoReserva.save(
        repoReserva.create({
          estudiante_id: estudianteId,
          instructor_id: instructorId,
          vehiculo_id:   vehiculoId,
          sede_id:       sedeId,
          fecha_inicio:  fechaInicio,
          fecha_fin:     fechaFin,
          estado:        'confirmada',
        })
      );
    });
  } catch (error) {
    // Error de serialización de PostgreSQL (condición de carrera detectada)
    if (error.code === '40001' || error.driverError?.code === '40001') {
      throw httpError('Lo sentimos, alguien acaba de tomar este cupo. Por favor elige otro horario en el calendario', 409);
    }
    throw error;
  }
};

// Obtiene reservas aplicando filtros dinámicos.
const obtenerReservas = async (filtros) => {
  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select([
      'r.id          AS id',
      'r.fecha_inicio AS fecha_inicio',
      'r.fecha_fin    AS fecha_fin',
      'r.estado       AS estado',
      'r.sede_id      AS sede_id',
      's.nombre       AS sede_nombre',
      'e.id           AS estudiante_id',
      'e.nombre       AS estudiante_nombre',
      'i.id           AS instructor_id',
      'i.nombre       AS instructor_nombre',
      'v.id           AS vehiculo_id',
      'v.patente      AS patente',
      'v.modelo       AS modelo',
    ])
    .innerJoin('sedes',     's', 'r.sede_id        = s.id')
    .innerJoin('usuarios',  'e', 'r.estudiante_id  = e.id')
    .innerJoin('usuarios',  'i', 'r.instructor_id  = i.id')
    .innerJoin('vehiculos', 'v', 'r.vehiculo_id    = v.id');

  // filtros de rango temporal
  if (filtros.fechaInicio) qb.andWhere('r.fecha_inicio >= :fechaInicio', { fechaInicio: filtros.fechaInicio });
  if (filtros.fechaFin)    qb.andWhere('r.fecha_fin <= :fechaFin',       { fechaFin: filtros.fechaFin });

  // filtros de entidad (reutilizables)
  aplicarFiltros(qb, filtros, {
    sedeId:       'r.sede_id',
    instructorId: 'r.instructor_id',
    vehiculoId:   'r.vehiculo_id',
    estudianteId: 'r.estudiante_id',
  });

  return qb.orderBy('r.fecha_inicio', 'ASC').getRawMany();
};

//Obtiene horarios actualmente ocupados.
const obtenerHorariosOcupados = async (filtros) => {
  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select([
      'r.fecha_inicio   AS fecha_inicio',
      'r.fecha_fin      AS fecha_fin',
      'r.instructor_id  AS instructor_id',
      'r.vehiculo_id    AS vehiculo_id',
      'r.estudiante_id  AS estudiante_id',
    ])
    .where("r.estado IN ('confirmada', 'en_progreso', 'proxima')");

  // filtros de rango temporal
  if (filtros.fechaInicio) qb.andWhere('r.fecha_inicio >= :fechaInicio', { fechaInicio: filtros.fechaInicio });
  if (filtros.fechaFin)    qb.andWhere('r.fecha_fin <= :fechaFin',       { fechaFin: filtros.fechaFin });

  // filtros de entidad (reutilizables)
  aplicarFiltros(qb, filtros, {
    sedeId:       'r.sede_id',
    instructorId: 'r.instructor_id',
    vehiculoId:   'r.vehiculo_id',
  });

  return qb.getRawMany();
};

// Suspende (cambia a estado pendiente) reservas futuras de un vehículo específico.
const suspenderReservasVehiculo = async (vehiculoId, manager) => {
  const repo = manager
    ? manager.getRepository('Reserva')
    : AppDataSource.getRepository('Reserva');

  const resultado = await repo.createQueryBuilder()
    .update()
    .set({ estado: 'pendiente' })
    .where('vehiculo_id = :vehiculoId', { vehiculoId })
    .andWhere("estado = 'confirmada'")
    .andWhere('fecha_inicio > NOW()')
    .execute();

  return resultado.affected || 0;
};

module.exports = { crearReservaTransaccional, obtenerReservas, obtenerHorariosOcupados, suspenderReservasVehiculo };