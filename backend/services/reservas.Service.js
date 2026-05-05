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
  const { estudianteId, instructorId, vehiculoId, sedeId, tipoClaseId, fechaInicio, fechaFin } = reservaData;

  try {
    return await AppDataSource.manager.transaction("SERIALIZABLE", async (manager) => {
      const repoUsuario  = manager.getRepository('Usuario');
      const repoVehiculo = manager.getRepository('Vehiculo');
      const repoReserva  = manager.getRepository('Reserva');
      const repoTipoClase = manager.getRepository('TipoClase');

      //  validar estudiante, instructor y vehículo en paralelo
      const [estudiante, instructor, vehiculo, tipoClase] = await Promise.all([
        repoUsuario.findOne({
          where: { id: estudianteId, rol: 'estudiante', estado: 'activo', sede_id: sedeId },
        }),
        repoUsuario.findOne({
          where: { id: instructorId, rol: 'instructor', estado: 'activo', sede_id: sedeId },
        }),
        repoVehiculo.findOne({
          where: { id: vehiculoId, sede_id: sedeId, estado: 'disponible' },
        }),
        repoTipoClase.findOne({
          where: { id: tipoClaseId },
        })
      ]);

      if (!estudiante) throw httpError('El estudiante no existe, no está activo o no pertenece a esta sede.', 404);
      if (!instructor) throw httpError('El instructor no existe, no está activo o no pertenece a esta sede.', 404);
      if (!vehiculo)   throw httpError('El vehículo no existe, no está disponible o no pertenece a esta sede.', 404);
      if (!tipoClase)  throw httpError('El tipo de clase no existe.', 404);

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
          tipo_clase_id: tipoClaseId,
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
      'r.id              AS id',
      'r.fecha_inicio    AS fecha_inicio',
      'r.fecha_fin       AS fecha_fin',
      'r.estado          AS estado',
      'r.sede_id         AS sede_id',
      'r.tipo_clase_id   AS tipo_clase_id',
      's.nombre          AS sede_nombre',
      's.direccion        AS sede_direccion',
      'e.id              AS estudiante_id',
      'e.nombre          AS estudiante_nombre',
      'i.id              AS instructor_id',
      'i.nombre          AS instructor_nombre',
      'v.id              AS vehiculo_id',
      'v.patente         AS patente',
      'v.modelo          AS modelo',
      'tc.nombre         AS tipo_clase_nombre',
      'tc.color          AS tipo_clase_color',
    ])
    .innerJoin('sedes',       's',  'r.sede_id        = s.id')
    .innerJoin('usuarios',    'e',  'r.estudiante_id  = e.id')
    .innerJoin('usuarios',    'i',  'r.instructor_id  = i.id')
    .innerJoin('vehiculos',   'v',  'r.vehiculo_id    = v.id')
    .leftJoin('tipos_clase', 'tc', 'r.tipo_clase_id  = tc.id');

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

  // Siempre aplicamos la sede
  if (filtros.sedeId) qb.andWhere('r.sede_id = :sedeId', { sedeId: filtros.sedeId });

  // Si hay recursos seleccionados, buscamos si ALGUNO de ellos está ocupado en ese horario
  const condicionesRecursos = [];
  const paramsRecursos = {};
  
  if (filtros.instructorId) {
    condicionesRecursos.push('r.instructor_id = :instructorId');
    paramsRecursos.instructorId = filtros.instructorId;
  }
  if (filtros.vehiculoId) {
    condicionesRecursos.push('r.vehiculo_id = :vehiculoId');
    paramsRecursos.vehiculoId = filtros.vehiculoId;
  }
  if (filtros.estudianteId) {
    condicionesRecursos.push('r.estudiante_id = :estudianteId');
    paramsRecursos.estudianteId = filtros.estudianteId;
  }

  if (condicionesRecursos.length > 0) {
    // Si hay recursos, solo traemos las reservas donde ESTOS recursos estén involucrados (OR)
    qb.andWhere(`(${condicionesRecursos.join(' OR ')})`, paramsRecursos);
  } else {
    // Si no se ha seleccionado ningún recurso (ni instructor, ni vehículo, ni estudiante),
    // devolvemos un arreglo vacío para no bloquear TODO el calendario de la sede.
    // El calendario solo mostrará ocupaciones relativas a los recursos que el usuario escoja.
    return [];
  }

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

// Valida que el DÍA de la clase esté a al menos 2 días calendario de diferencia
// (es decir, hoy debe ser como máximo el día D-3, donde D es el día de la clase).
// Ejemplo: clase el 10/05 → puede modificar hasta el 7/05 inclusive.
//          El 8/05 y el 9/05 quedan bloqueados sin importar la hora.
const validar48Horas = (fechaInicio) => {
  const hoy      = new Date();
  const diaHoy   = new Date(hoy.getFullYear(),   hoy.getMonth(),   hoy.getDate());        // medianoche hoy
  const diaClase = new Date(new Date(fechaInicio).getFullYear(),
                            new Date(fechaInicio).getMonth(),
                            new Date(fechaInicio).getDate()); // medianoche día de la clase

  const diffDias = (diaClase - diaHoy) / (1000 * 60 * 60 * 24); // diferencia en días exactos

  if (diffDias < 3) {
    throw httpError(
      'Solo puedes modificar o cancelar una reserva con al menos 2 días de anticipación al día de la clase. ' +
      'Si tu clase es el día 10, puedes hacer cambios hasta el día 7.',
      409
    );
  }
};

// Actualiza una reserva existente (nuevos recursos u horario)
const actualizarReservaTransaccional = async (id, data, esAdmin = false) => {
  const { estudianteId, instructorId, vehiculoId, sedeId, tipoClaseId, fechaInicio, fechaFin } = data;

  try {
    return await AppDataSource.manager.transaction('SERIALIZABLE', async (manager) => {
      const repoReserva  = manager.getRepository('Reserva');
      const repoUsuario  = manager.getRepository('Usuario');
      const repoVehiculo = manager.getRepository('Vehiculo');
      const repoTipoClase = manager.getRepository('TipoClase');

      // Buscar la reserva original
      const reserva = await repoReserva.findOne({ where: { id } });
      if (!reserva) throw httpError('Reserva no encontrada.', 404);
      if (['cancelada', 'expirada'].includes(reserva.estado)) {
        throw httpError('No se puede modificar una reserva cancelada o expirada.', 409);
      }

      // Regla de 48h (solo para no-admins)
      if (!esAdmin) validar48Horas(reserva.fecha_inicio);

      // Validar nuevos recursos
      const [estudiante, instructor, vehiculo, tipoClase] = await Promise.all([
        repoUsuario.findOne({ where: { id: estudianteId, rol: 'estudiante', estado: 'activo', sede_id: sedeId } }),
        repoUsuario.findOne({ where: { id: instructorId, rol: 'instructor', estado: 'activo', sede_id: sedeId } }),
        repoVehiculo.findOne({ where: { id: vehiculoId, sede_id: sedeId } }),
        repoTipoClase.findOne({ where: { id: tipoClaseId } }),
      ]);
      if (!estudiante) throw httpError('El estudiante no existe o no pertenece a esta sede.', 404);
      if (!instructor) throw httpError('El instructor no existe o no pertenece a esta sede.', 404);
      if (!vehiculo)   throw httpError('El vehículo no existe o no pertenece a esta sede.', 404);
      if (!tipoClase)  throw httpError('El tipo de clase no existe.', 404);

      // Verificar conflictos excluyendo la misma reserva
      const conflicto = await repoReserva.createQueryBuilder('r')
        .where('r.id != :id', { id })
        .andWhere("r.estado IN ('confirmada', 'en_progreso', 'proxima')")
        .andWhere(
          '(r.instructor_id = :instructorId OR r.vehiculo_id = :vehiculoId OR r.estudiante_id = :estudianteId)',
          { instructorId, vehiculoId, estudianteId }
        )
        .andWhere(
          "(r.fecha_inicio, r.fecha_fin) OVERLAPS (:fechaInicio::timestamp, (:fechaFin::timestamp + INTERVAL '15 minutes'))",
          { fechaInicio, fechaFin }
        )
        .getOne();

      if (conflicto) {
        throw httpError('Conflicto de horario: uno de los recursos ya tiene una reserva en ese lapso.', 409);
      }

      // Aplicar cambios
      repoReserva.merge(reserva, {
        estudiante_id: estudianteId,
        instructor_id: instructorId,
        vehiculo_id:   vehiculoId,
        sede_id:       sedeId,
        tipo_clase_id: tipoClaseId,
        fecha_inicio:  fechaInicio,
        fecha_fin:     fechaFin,
      });

      return repoReserva.save(reserva);
    });
  } catch (error) {
    if (error.code === '40001' || error.driverError?.code === '40001') {
      throw httpError('Conflicto de concurrencia. Intenta nuevamente.', 409);
    }
    throw error;
  }
};

// Cancela una reserva (cambia estado a 'cancelada')
const cancelarReserva = async (id, esAdmin = false) => {
  const repo = AppDataSource.getRepository('Reserva');
  const reserva = await repo.findOne({ where: { id } });

  if (!reserva) throw httpError('Reserva no encontrada.', 404);
  if (['cancelada', 'expirada'].includes(reserva.estado)) {
    throw httpError('La reserva ya está cancelada o expirada.', 409);
  }

  // Regla de 48h solo para no-admins
  if (!esAdmin) validar48Horas(reserva.fecha_inicio);

  reserva.estado = 'cancelada';
  return repo.save(reserva);
};

// Obtiene una reserva completa por ID (para prellenar formulario de edición)
const obtenerReservaPorId = async (id) => {
  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select([
      'r.id', 'r.fecha_inicio', 'r.fecha_fin', 'r.estado',
      'r.sede_id', 'r.estudiante_id', 'r.instructor_id', 'r.vehiculo_id', 'r.tipo_clase_id',
    ])
    .where('r.id = :id', { id });

  const reserva = await qb.getOne();
  if (!reserva) throw httpError('Reserva no encontrada.', 404);
  return reserva;
};

module.exports = {
  crearReservaTransaccional,
  actualizarReservaTransaccional,
  cancelarReserva,
  obtenerReservaPorId,
  obtenerReservas,
  obtenerHorariosOcupados,
  suspenderReservasVehiculo,
};