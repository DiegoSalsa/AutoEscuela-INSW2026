const { AppDataSource, Usuario, ModuloTeorico, EstudianteModuloProgreso } = require('../db/data-source');

// horas por defecto 
const HORAS_REQUERIDAS = 40;

// GET /api/estudiantes/:id - perfil estudiante + horas practicas + modulos
async function getPerfilEstudiante(estudianteId) {
  try {
    const usuarioRepository = AppDataSource.getRepository('Usuario');
    const moduloRepository = AppDataSource.getRepository('ModuloTeorico');
    const progresoRepository = AppDataSource.getRepository('EstudianteModuloProgreso');

    // 1. obtener datos del estudiante
    const estudiante = await usuarioRepository.findOne({
      where: { id: estudianteId },
      relations: ['sede'],
    });

    if (!estudiante) {
      const error = new Error('Estudiante no encontrado');
      error.status = 404;
      throw error;
    }

    // 2. calcular horas practicas completadas
    const queryHoras = AppDataSource.createQueryBuilder()
      .select('COALESCE(SUM(EXTRACT(EPOCH FROM (r.fecha_fin - r.fecha_inicio)) / 3600), 0)', 'horas_completadas')
      .addSelect('COUNT(r.id)', 'total_clases')
      .from('reservas', 'r')
      .where('r.estudiante_id = :estudianteId', { estudianteId });

    const horasResult = await queryHoras.getRawOne();
    const horasCompletadas = parseFloat(parseFloat(horasResult.horas_completadas).toFixed(2));
    const totalClases = parseInt(horasResult.total_clases, 10);

    // 3. obtener ultimas 3 clases
    const ultimasClases = await AppDataSource.createQueryBuilder()
      .select('r.id', 'id')
      .addSelect('r.fecha_inicio', 'fecha_inicio')
      .addSelect('r.fecha_fin', 'fecha_fin')
      .addSelect('r.estado', 'estado')
      .addSelect('i.nombre', 'instructor_nombre')
      .addSelect('v.modelo', 'vehiculo_modelo')
      .addSelect('v.patente', 'vehiculo_patente')
      .from('reservas', 'r')
      .leftJoin('usuarios', 'i', 'r.instructor_id = i.id')
      .leftJoin('vehiculos', 'v', 'r.vehiculo_id = v.id')
      .where('r.estudiante_id = :estudianteId', { estudianteId })
      .orderBy('r.fecha_inicio', 'DESC')
      .limit(3)
      .getRawMany();

    // 4. obtener modulos y progreso del estudiante
    const progreso = await progresoRepository.find({
      where: { estudiante_id: estudianteId },
      relations: ['modulo'],
    });

    const modulosAprobados = progreso.filter(p => p.aprobado).length;
    const totalModulos = progreso.length;

    return {
      id: estudiante.id,
      nombre: estudiante.nombre,
      email: estudiante.email,
      telefono: estudiante.telefono,
      rut: estudiante.rut,
      estado: estudiante.estado,
      created_at: estudiante.created_at,
      sede: {
        id: estudiante.sede?.id || estudiante.sede_id,
        nombre: estudiante.sede?.nombre || 'Sede desconocida',
      },
      horasPracticas: {
        completadas: horasCompletadas,
        requeridas: HORAS_REQUERIDAS,
        falta: Math.max(0, HORAS_REQUERIDAS - horasCompletadas),
        porcentaje: Math.round((horasCompletadas / HORAS_REQUERIDAS) * 100),
      },
      totalClases: totalClases,
      ultimasClases: ultimasClases.map(clase => ({
        id: clase.id,
        fecha_inicio: clase.fecha_inicio,
        fecha_fin: clase.fecha_fin,
        estado: clase.estado,
        instructor_nombre: clase.instructor_nombre,
        vehiculo_modelo: clase.vehiculo_modelo,
        vehiculo_patente: clase.vehiculo_patente,
      })),
      modulosTeoricos: {
        aprobados: modulosAprobados,
        total: totalModulos,
        progreso: progreso.map(p => ({
          id: p.id,
          modulo_id: p.modulo_id,
          modulo_nombre: p.modulo?.nombre,
          aprobado: p.aprobado,
          calificacion: p.calificacion,
          fecha_aprobacion: p.fecha_aprobacion,
        })),
      },
    };

  } catch (error) {
    throw error;
  }
}

// GET /api/estudiantes?sedeId=&q=busqueda - buscador global de estudiantes
async function buscarEstudiantes(sedeId, q) {
  try {
    let query = AppDataSource.createQueryBuilder()
      .select('u.id', 'id')
      .addSelect('u.nombre', 'nombre')
      .addSelect('u.email', 'email')
      .addSelect('u.rut', 'rut')
      .addSelect('u.sede_id', 'sede_id')
      .addSelect('u.estado', 'estado')
      .addSelect('s.nombre', 'sede_nombre')
      .addSelect('COUNT(r.id)', 'total_clases')
      .addSelect('COALESCE(SUM(EXTRACT(EPOCH FROM (r.fecha_fin - r.fecha_inicio)) / 3600), 0)', 'horas_totales')
      .from('usuarios', 'u')
      .leftJoin('sedes', 's', 'u.sede_id = s.id')
      .leftJoin('reservas', 'r', "u.id = r.estudiante_id AND r.estado = 'completada'")
      .where("u.rol = 'estudiante'")
      .groupBy('u.id, s.id')
      .orderBy('u.nombre', 'ASC')
      .limit(50);

    // filtro por sede
    if (sedeId) {
      query.andWhere('u.sede_id = :sedeId', { sedeId });
    }

    // filtro por búsqueda (nombre, email, rut)
    if (q) {
      query.andWhere(
        '(u.nombre ILIKE :q OR u.email ILIKE :q OR u.rut ILIKE :q)',
        { q: `%${q}%` }
      );
    }

    const resultados = await query.getRawMany();

    return resultados.map(row => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      rut: row.rut,
      estado: row.estado,
      sede: {
        id: row.sede_id,
        nombre: row.sede_nombre,
      },
      totalClases: parseInt(row.total_clases, 10),
      horasTotales: parseFloat(parseFloat(row.horas_totales).toFixed(2)),
    }));

  } catch (error) {
    throw error;
  }
}

// POST /api/estudiantes - crear nuevo estudiante
async function crearEstudiante(estudianteData) {
  const { nombre, email, telefono, rut, sedeId } = estudianteData;
  const usuarioRepository = AppDataSource.getRepository('Usuario');
  const sedeRepository = AppDataSource.getRepository('Sede');

  try {
    // 1. validar que la sede exista
    const sedeExiste = await sedeRepository.findOne({
      where: { id: sedeId },
    });

    if (!sedeExiste) {
      const error = new Error('La sede no existe');
      error.status = 404;
      throw error;
    }

    // 2. validar que el email no exista
    const emailExiste = await usuarioRepository.findOne({
      where: { email: email },
    });

    if (emailExiste) {
      const error = new Error('El email ya está registrado');
      error.status = 409;
      throw error;
    }

    // 3. validar que el rut no exista
    const rutExiste = await usuarioRepository.findOne({
      where: { rut: rut },
    });

    if (rutExiste) {
      const error = new Error('El RUT ya está registrado');
      error.status = 409;
      throw error;
    }

    // 4. crear el nuevo estudiante
    const nuevoEstudiante = usuarioRepository.create({
      nombre,
      email,
      telefono,
      rut,
      sede_id: sedeId,
      rol: 'estudiante',
      estado: 'activo',
    });

    const resultado = await usuarioRepository.save(nuevoEstudiante);

    return {
      id: resultado.id,
      nombre: resultado.nombre,
      email: resultado.email,
      telefono: resultado.telefono,
      rut: resultado.rut,
      estado: resultado.estado,
      sede_id: resultado.sede_id,
      created_at: resultado.created_at,
      mensaje: 'Estudiante registrado exitosamente',
    };

  } catch (error) {
    throw error;
  }
}

// GET /api/estudiantes/:id/modulos - obtener modulos del estudiante
async function getModulosEstudiante(estudianteId) {
  try {
    const progresoRepository = AppDataSource.getRepository('EstudianteModuloProgreso');

    const progreso = await progresoRepository.find({
      where: { estudiante_id: estudianteId },
      relations: ['modulo'],
      order: { modulo_id: 'ASC' },
    });

    return {
      total: progreso.length,
      aprobados: progreso.filter(p => p.aprobado).length,
      modulos: progreso.map(p => ({
        id: p.id,
        modulo_id: p.modulo_id,
        modulo_nombre: p.modulo?.nombre,
        descripcion: p.modulo?.descripcion,
        horas_teoricas: p.modulo?.horas_teoricas,
        aprobado: p.aprobado,
        calificacion: p.calificacion,
        fecha_aprobacion: p.fecha_aprobacion,
      })),
    };

  } catch (error) {
    throw error;
  }
}

// GET /api/estudiantes/:id/timeline - obtener timeline completa del estudiante
async function getTimelineEstudiante(estudianteId) {
  try {
    const clasesQuery = AppDataSource.createQueryBuilder()
      .select('r.id', 'id')
      .addSelect('r.fecha_inicio', 'fecha_inicio')
      .addSelect('r.fecha_fin', 'fecha_fin')
      .addSelect('r.estado', 'estado')
      .addSelect("'clase'", 'tipo')
      .addSelect('i.nombre', 'instructor_nombre')
      .addSelect('v.patente', 'vehiculo_patente')
      .from('reservas', 'r')
      .leftJoin('usuarios', 'i', 'r.instructor_id = i.id')
      .leftJoin('vehiculos', 'v', 'r.vehiculo_id = v.id')
      .where('r.estudiante_id = :estudianteId', { estudianteId })
      .orderBy('r.fecha_inicio', 'DESC');

    const clases = await clasesQuery.getRawMany();

    return clases.map(clase => ({
      id: clase.id,
      tipo: clase.tipo,
      fecha: clase.fecha_inicio,
      fecha_fin: clase.fecha_fin,
      estado: clase.estado,
      instructor: clase.instructor_nombre,
      vehiculo: clase.vehiculo_patente,
    }));

  } catch (error) {
    throw error;
  }
}

async function actualizarEstudiante(estudianteId, datosActualizar) {
  const { nombre, email, telefono } = datosActualizar;
  const usuarioRepository = AppDataSource.getRepository('Usuario');

  try {
    const estudiante = await usuarioRepository.findOne({
      where: { id: estudianteId },
    });

    if (!estudiante) {
      const error = new Error('Estudiante no encontrado');
      error.status = 404;
      throw error;
    }

    // validar email único si se actualiza
    if (email && email !== estudiante.email) {
      const emailExiste = await usuarioRepository.findOne({
        where: { email: email },
      });

      if (emailExiste) {
        const error = new Error('El email ya está registrado');
        error.status = 409;
        throw error;
      }

      estudiante.email = email;
    }

    // actualizar campos
    if (nombre) estudiante.nombre = nombre;
    if (telefono) estudiante.telefono = telefono;

    const resultado = await usuarioRepository.save(estudiante);

    return {
      id: resultado.id,
      nombre: resultado.nombre,
      email: resultado.email,
      telefono: resultado.telefono,
      rut: resultado.rut,
      estado: resultado.estado,
      updated_at: resultado.updated_at,
      mensaje: 'Estudiante actualizado exitosamente',
    };

  } catch (error) {
    throw error;
  }
}

// GET /api/modulos - obtener todos los módulos teóricos disponibles
async function getModulosTeoricos() {
  try {
    const moduloRepository = AppDataSource.getRepository('ModuloTeorico');

    const modulos = await moduloRepository.find({
      order: { orden: 'ASC' },
    });

    return {
      total: modulos.length,
      modulos: modulos.map(m => ({
        id: m.id,
        nombre: m.nombre,
        descripcion: m.descripcion,
        horas_teoricas: m.horas_teoricas,
        orden: m.orden,
        created_at: m.created_at,
      })),
    };

  } catch (error) {
    throw error;
  }
}

// POST /api/estudiantes/:id/modulos/:moduloId - asignar módulo a estudiante
async function asignarModuloEstudiante(estudianteId, moduloId) {
  const usuarioRepository = AppDataSource.getRepository('Usuario');
  const moduloRepository = AppDataSource.getRepository('ModuloTeorico');
  const progresoRepository = AppDataSource.getRepository('EstudianteModuloProgreso');

  try {
    // 1. validar que el estudiante exista
    const estudiante = await usuarioRepository.findOne({
      where: { id: estudianteId, rol: 'estudiante' },
    });

    if (!estudiante) {
      const error = new Error('Estudiante no encontrado');
      error.status = 404;
      throw error;
    }

    // 2. validar que el módulo exista
    const modulo = await moduloRepository.findOne({
      where: { id: moduloId },
    });

    if (!modulo) {
      const error = new Error('Módulo teórico no encontrado');
      error.status = 404;
      throw error;
    }

    // 3. verificar que no esté ya asignado
    const yaAsignado = await progresoRepository.findOne({
      where: { estudiante_id: estudianteId, modulo_id: moduloId },
    });

    if (yaAsignado) {
      const error = new Error('El módulo ya está asignado al estudiante');
      error.status = 409;
      throw error;
    }

    // 4. crear asignación
    const nuevoProgreso = progresoRepository.create({
      estudiante_id: estudianteId,
      modulo_id: moduloId,
      aprobado: false,
    });

    const resultado = await progresoRepository.save(nuevoProgreso);

    return {
      id: resultado.id,
      estudiante_id: resultado.estudiante_id,
      modulo_id: resultado.modulo_id,
      aprobado: resultado.aprobado,
      calificacion: resultado.calificacion,
      created_at: resultado.created_at,
      mensaje: 'Módulo asignado exitosamente',
    };

  } catch (error) {
    throw error;
  }
}

// PUT /api/estudiantes/:id/modulos/:moduloId - actualizar progreso del módulo
async function actualizarProgresoModulo(estudianteId, moduloId, datosActualizar) {
  const { aprobado, calificacion } = datosActualizar;
  const progresoRepository = AppDataSource.getRepository('EstudianteModuloProgreso');

  try {
    const progreso = await progresoRepository.findOne({
      where: { estudiante_id: estudianteId, modulo_id: moduloId },
      relations: ['modulo'],
    });

    if (!progreso) {
      const error = new Error('Progreso del módulo no encontrado');
      error.status = 404;
      throw error;
    }

    // actualizar campos
    if (typeof aprobado === 'boolean') {
      progreso.aprobado = aprobado;
      // si se aprueba, registrar fecha
      if (aprobado && !progreso.fecha_aprobacion) {
        progreso.fecha_aprobacion = new Date();
      }
    }

    if (calificacion !== undefined) {
      // validar rango de calificación
      const cal = parseInt(calificacion, 10);
      if (cal < 0 || cal > 100) {
        const error = new Error('La calificación debe estar entre 0 y 100');
        error.status = 400;
        throw error;
      }
      progreso.calificacion = cal;
    }

    const resultado = await progresoRepository.save(progreso);

    return {
      id: resultado.id,
      estudiante_id: resultado.estudiante_id,
      modulo_id: resultado.modulo_id,
      modulo_nombre: progreso.modulo?.nombre,
      aprobado: resultado.aprobado,
      calificacion: resultado.calificacion,
      fecha_aprobacion: resultado.fecha_aprobacion,
      updated_at: resultado.updated_at,
      mensaje: 'Progreso del módulo actualizado exitosamente',
    };

  } catch (error) {
    throw error;
  }
}

module.exports = { 
  getPerfilEstudiante, 
  buscarEstudiantes, 
  crearEstudiante, 
  getModulosEstudiante,
  getTimelineEstudiante,
  actualizarEstudiante,
  getModulosTeoricos,
  asignarModuloEstudiante,
  actualizarProgresoModulo
};
