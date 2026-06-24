const { AppDataSource } = require('../db/data-source');
const { httpError } = require('../helpers/error.helper');
const { aplicarFiltros } = require('../helpers/db.helper');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

const TIEMPO_TRASLADO_MIN = parseInt(process.env.TIEMPO_TRASLADO_MIN, 10) || 60;
const TIME_ZONE = 'America/Santiago';

// Conversiones de zona horaria
const toUTC = (localDateString) => {
  if (!localDateString) return null;
  const d = new Date(localDateString);
  if (isNaN(d.getTime())) return null;
  return fromZonedTime(localDateString, TIME_ZONE);
};

const toLocal = (utcDate) => {
  if (!utcDate) return null;
  const d = new Date(utcDate);
  if (isNaN(d.getTime())) return null;
  return toZonedTime(d, TIME_ZONE);
};

// Validación de traslado entre sedes
const validarTrasladoVehicular = async (repoReserva, vehiculoId, sedeId, fechaInicio, fechaFin) => {
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

// Crear reserva
const crearReservaTransaccional = async (reservaData) => {
  let { estudianteId, instructorId, vehiculoId, sedeId, tipoClaseId, fechaInicio, fechaFin } = reservaData;

  fechaInicio = toUTC(fechaInicio);
  fechaFin = toUTC(fechaFin);
  if (!fechaInicio || !fechaFin) throw httpError('Fechas inválidas', 400);

  try {
    return await AppDataSource.manager.transaction("SERIALIZABLE", async (manager) => {
      const repoUsuario = manager.getRepository('Usuario');
      const repoVehiculo = manager.getRepository('Vehiculo');
      const repoReserva = manager.getRepository('Reserva');
      const repoTipoClase = manager.getRepository('TipoClase');

      const [estudiante, instructor, tipoClase] = await Promise.all([
        repoUsuario.findOne({ where: { id: estudianteId, rol: 'estudiante', estado: 'activo', sede_id: sedeId } }),
        repoUsuario.findOne({ where: { id: instructorId, rol: 'instructor', estado: 'activo', sede_id: sedeId } }),
        repoTipoClase.findOne({ where: { id: tipoClaseId } })
      ]);

      if (!estudiante) throw httpError('El estudiante no existe, no está activo o no pertenece a esta sede.', 404);
      if (!instructor) throw httpError('El instructor no existe, no está activo o no pertenece a esta sede.', 404);
      if (!tipoClase) throw httpError('El tipo de clase no existe.', 404);

      let vehiculo = null;
      if (vehiculoId) {
        vehiculo = await repoVehiculo.findOne({ where: { id: vehiculoId, sede_id: sedeId, estado: 'disponible' } });
        if (!vehiculo) throw httpError('El vehículo no existe, no está disponible o no pertenece a esta sede.', 404);
        await validarTrasladoVehicular(repoReserva, vehiculoId, sedeId, fechaInicio, fechaFin);
      }

      const fechaFinDate = new Date(fechaFin);
      fechaFinDate.setMinutes(fechaFinDate.getMinutes() + 15);
      const fechaFinBuffer = fechaFinDate.toISOString();

      const condicionesConflicto = ['r.instructor_id = :instructorId', 'r.estudiante_id = :estudianteId'];
      const paramsConflicto = { instructorId, estudianteId, fechaInicio, fechaFinBuffer };
      if (vehiculoId) {
        condicionesConflicto.push('r.vehiculo_id = :vehiculoId');
        paramsConflicto.vehiculoId = vehiculoId;
      }

      const conflicto = await repoReserva.createQueryBuilder('r')
        .where("r.estado IN ('confirmada', 'en_progreso', 'proxima')")
        .andWhere(`(${condicionesConflicto.join(' OR ')})`, paramsConflicto)
        .andWhere('(r.fecha_inicio < :fechaFinBuffer AND r.fecha_fin > :fechaInicio)', { fechaInicio, fechaFinBuffer })
        .getOne();

      if (conflicto) {
        throw httpError('Conflicto de horario: el instructor, vehículo o estudiante ya tiene una reserva en ese lapso.', 409);
      }

      const nuevaReserva = repoReserva.create({
        estudiante_id: estudianteId,
        instructor_id: instructorId,
        vehiculo_id: vehiculoId || null,
        sede_id: sedeId,
        tipo_clase_id: tipoClaseId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'confirmada',
      });

      return await repoReserva.save(nuevaReserva);
    });
  } catch (error) {
    if (error.code === '40001' || error.driverError?.code === '40001') {
      throw httpError('Lo sentimos, alguien acaba de tomar este cupo. Por favor elige otro horario en el calendario', 409);
    }
    throw error;
  }
};

// Obtener reservas (con conversión de fechas a local)
const obtenerReservas = async (filtros) => {
  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .leftJoin('r.sede', 's')
    .leftJoin('r.estudiante', 'e')
    .leftJoin('r.instructor', 'i')
    .leftJoin('r.vehiculo', 'v')
    .leftJoin('r.tipoClase', 'tc')
    .select([
      'r.id AS id',
      'r.fecha_inicio AS fecha_inicio',
      'r.fecha_fin AS fecha_fin',
      'r.estado AS estado',
      'r.sede_id AS sede_id',
      'r.tipo_clase_id AS tipo_clase_id',
      's.nombre AS sede_nombre',
      's.direccion AS sede_direccion',
      'e.id AS estudiante_id',
      'e.nombre AS estudiante_nombre',
      'i.id AS instructor_id',
      'i.nombre AS instructor_nombre',
      'v.id AS vehiculo_id',
      'v.patente AS patente',
      'v.modelo AS modelo',
      'tc.nombre AS tipo_clase_nombre',
      'tc.color AS tipo_clase_color',
    ]);

  if (filtros.fechaInicio) qb.andWhere('r.fecha_inicio >= :fechaInicio', { fechaInicio: toUTC(filtros.fechaInicio) });
  if (filtros.fechaFin) qb.andWhere('r.fecha_fin <= :fechaFin', { fechaFin: toUTC(filtros.fechaFin) });

  aplicarFiltros(qb, filtros, {
    sedeId: 'r.sede_id',
    instructorId: 'r.instructor_id',
    vehiculoId: 'r.vehiculo_id',
    estudianteId: 'r.estudiante_id',
  });

  const resultados = await qb.orderBy('r.fecha_inicio', 'ASC').getRawMany();

  // LOG importante: cuántas reservas teóricas (sin vehículo) hay
  const teoricas = resultados.filter(r => !r.vehiculo_id);
  console.log(`[RESERVAS] Total: ${resultados.length}, Teóricas: ${teoricas.length}`);
  if (teoricas.length > 0) {
    console.log('IDs de teóricas:', teoricas.map(r => ({ id: r.id, tipo: r.tipo_clase_nombre })));
  }

  // Convertir fechas a hora local para el frontend
  return resultados.map(r => ({
    ...r,
    fecha_inicio: r.fecha_inicio ? toLocal(new Date(r.fecha_inicio)).toISOString() : null,
    fecha_fin: r.fecha_fin ? toLocal(new Date(r.fecha_fin)).toISOString() : null,
  }));
};

const obtenerReservaPorId = async (id) => {
  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select([
      'r.id', 'r.fecha_inicio', 'r.fecha_fin', 'r.estado',
      'r.sede_id', 'r.estudiante_id', 'r.instructor_id', 'r.vehiculo_id', 'r.tipo_clase_id',
    ])
    .where('r.id = :id', { id });

  const reserva = await qb.getOne();
  if (!reserva) throw httpError('Reserva no encontrada.', 404);

  return {
    ...reserva,
    fecha_inicio: reserva.fecha_inicio ? toLocal(reserva.fecha_inicio).toISOString() : null,
    fecha_fin: reserva.fecha_fin ? toLocal(reserva.fecha_fin).toISOString() : null,
  };
};

const actualizarReservaTransaccional = async (id, data, esAdmin = false) => {
  let { estudianteId, instructorId, vehiculoId, sedeId, tipoClaseId, fechaInicio, fechaFin } = data;
  fechaInicio = toUTC(fechaInicio);
  fechaFin = toUTC(fechaFin);
  if (!fechaInicio || !fechaFin) throw httpError('Fechas inválidas', 400);

  try {
    return await AppDataSource.manager.transaction('SERIALIZABLE', async (manager) => {
      const repoReserva = manager.getRepository('Reserva');
      const repoUsuario = manager.getRepository('Usuario');
      const repoVehiculo = manager.getRepository('Vehiculo');
      const repoTipoClase = manager.getRepository('TipoClase');

      const reserva = await repoReserva.findOne({ where: { id } });
      if (!reserva) throw httpError('Reserva no encontrada.', 404);
      if (['cancelada', 'expirada'].includes(reserva.estado)) {
        throw httpError('No se puede modificar una reserva cancelada o expirada.', 409);
      }
      if (!esAdmin) validar48Horas(reserva.fecha_inicio);

      const [estudiante, instructor, tipoClase] = await Promise.all([
        repoUsuario.findOne({ where: { id: estudianteId, rol: 'estudiante', estado: 'activo', sede_id: sedeId } }),
        repoUsuario.findOne({ where: { id: instructorId, rol: 'instructor', estado: 'activo', sede_id: sedeId } }),
        repoTipoClase.findOne({ where: { id: tipoClaseId } }),
      ]);
      if (!estudiante) throw httpError('El estudiante no existe o no pertenece a esta sede.', 404);
      if (!instructor) throw httpError('El instructor no existe o no pertenece a esta sede.', 404);
      if (!tipoClase) throw httpError('El tipo de clase no existe.', 404);

      if (vehiculoId) {
        const vehiculo = await repoVehiculo.findOne({ where: { id: vehiculoId, sede_id: sedeId } });
        if (!vehiculo) throw httpError('El vehículo no existe o no pertenece a esta sede.', 404);
        await validarTrasladoVehicular(repoReserva, vehiculoId, sedeId, fechaInicio, fechaFin);
      }

      const fechaFinDate = new Date(fechaFin);
      fechaFinDate.setMinutes(fechaFinDate.getMinutes() + 15);
      const fechaFinBuffer = fechaFinDate.toISOString();

      const condicionesConflicto = ['r.instructor_id = :instructorId', 'r.estudiante_id = :estudianteId'];
      const paramsConflicto = { id, instructorId, estudianteId, fechaInicio, fechaFinBuffer };
      if (vehiculoId) {
        condicionesConflicto.push('r.vehiculo_id = :vehiculoId');
        paramsConflicto.vehiculoId = vehiculoId;
      }

      const conflicto = await repoReserva.createQueryBuilder('r')
        .where('r.id != :id', { id })
        .andWhere("r.estado IN ('confirmada', 'en_progreso', 'proxima')")
        .andWhere(`(${condicionesConflicto.join(' OR ')})`, paramsConflicto)
        .andWhere('(r.fecha_inicio < :fechaFinBuffer AND r.fecha_fin > :fechaInicio)', { fechaInicio, fechaFinBuffer })
        .getOne();

      if (conflicto) {
        throw httpError('Conflicto de horario: uno de los recursos ya tiene una reserva en ese lapso.', 409);
      }

      repoReserva.merge(reserva, {
        estudiante_id: estudianteId,
        instructor_id: instructorId,
        vehiculo_id: vehiculoId || null,
        sede_id: sedeId,
        tipo_clase_id: tipoClaseId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
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

const cancelarReserva = async (id, esAdmin = false) => {
  const repo = AppDataSource.getRepository('Reserva');
  const reserva = await repo.findOne({ where: { id } });
  if (!reserva) throw httpError('Reserva no encontrada.', 404);
  if (['cancelada', 'expirada'].includes(reserva.estado)) {
    throw httpError('La reserva ya está cancelada o expirada.', 409);
  }
  if (!esAdmin) validar48Horas(reserva.fecha_inicio);
  reserva.estado = 'cancelada';
  return repo.save(reserva);
};

const validar48Horas = (fechaInicio) => {
  const hoy = new Date();
  const diaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diaClase = new Date(new Date(fechaInicio).getFullYear(), new Date(fechaInicio).getMonth(), new Date(fechaInicio).getDate());
  const diffDias = (diaClase - diaHoy) / (1000 * 60 * 60 * 24);
  if (diffDias < 3) {
    throw httpError(
      'Solo puedes modificar o cancelar una reserva con al menos 2 días de anticipación al día de la clase. Si tu clase es el día 10, puedes hacer cambios hasta el día 7.',
      409
    );
  }
};

const obtenerHorariosOcupados = async (filtros) => {
  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select([
      'r.fecha_inicio AS fecha_inicio',
      'r.fecha_fin AS fecha_fin',
      'r.instructor_id AS instructor_id',
      'r.vehiculo_id AS vehiculo_id',
      'r.estudiante_id AS estudiante_id',
    ])
    .where("r.estado IN ('confirmada', 'en_progreso', 'proxima')");

  if (filtros.fechaInicio) {
    const fiUTC = toUTC(filtros.fechaInicio);
    if (fiUTC) qb.andWhere('r.fecha_inicio >= :fechaInicio', { fechaInicio: fiUTC });
  }
  if (filtros.fechaFin) {
    const ffUTC = toUTC(filtros.fechaFin);
    if (ffUTC) qb.andWhere('r.fecha_fin <= :fechaFin', { fechaFin: ffUTC });
  }
  if (filtros.sedeId) qb.andWhere('r.sede_id = :sedeId', { sedeId: filtros.sedeId });

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

  if (condicionesRecursos.length === 0) return [];

  qb.andWhere(`(${condicionesRecursos.join(' OR ')})`, paramsRecursos);
  return qb.getRawMany();
};

const obtenerDiasOcupados = async (filtros) => {
  const { mes, anio, sedeId, instructorId, vehiculoId, estudianteId } = filtros;
  if (!mes || !anio) return [];

  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

  const qb = AppDataSource.getRepository('Reserva').createQueryBuilder('r')
    .select(['EXTRACT(DAY FROM r.fecha_inicio) AS dia', 'COUNT(*) AS total_bloques'])
    .where("r.estado IN ('confirmada', 'en_progreso', 'proxima')")
    .andWhere('r.fecha_inicio >= :fechaInicio', { fechaInicio })
    .andWhere('r.fecha_inicio <= :fechaFin', { fechaFin });

  if (sedeId) qb.andWhere('r.sede_id = :sedeId', { sedeId });

  const condicionesRecursos = [];
  const paramsRecursos = {};
  if (instructorId) { condicionesRecursos.push('r.instructor_id = :instructorId'); paramsRecursos.instructorId = instructorId; }
  if (vehiculoId) { condicionesRecursos.push('r.vehiculo_id = :vehiculoId'); paramsRecursos.vehiculoId = vehiculoId; }
  if (estudianteId) { condicionesRecursos.push('r.estudiante_id = :estudianteId'); paramsRecursos.estudianteId = estudianteId; }

  if (condicionesRecursos.length === 0) return [];

  qb.andWhere(`(${condicionesRecursos.join(' OR ')})`, paramsRecursos);
  const resultados = await qb.groupBy('EXTRACT(DAY FROM r.fecha_inicio)').having('COUNT(*) >= 11').getRawMany();
  return resultados.map(r => parseInt(r.dia, 10));
};

const suspenderReservasVehiculo = async (vehiculoId, manager) => {
  const repo = manager ? manager.getRepository('Reserva') : AppDataSource.getRepository('Reserva');
  const resultado = await repo.createQueryBuilder()
    .update()
    .set({ estado: 'pendiente' })
    .where('vehiculo_id = :vehiculoId', { vehiculoId })
    .andWhere("estado = 'confirmada'")
    .andWhere('fecha_inicio > NOW()')
    .execute();
  return resultado.affected || 0;
};

module.exports = {
  crearReservaTransaccional,
  actualizarReservaTransaccional,
  cancelarReserva,
  obtenerReservaPorId,
  obtenerReservas,
  obtenerHorariosOcupados,
  obtenerDiasOcupados,
  suspenderReservasVehiculo,
};