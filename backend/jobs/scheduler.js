const cron = require('node-cron');
const { AppDataSource } = require('../db/data-source');
const { emitirEventoReserva } = require('../services/socket');
const { enviarRecordatorio } = require('../services/notificaciones.Service');

// Iniciar tareas programadas (cron jobs) del sistema de reservas
const iniciarScheduler = () => {
  console.log('Scheduler iniciado');

  // Cada 5 min: expirar reservas pendientes cuya fecha ya paso
  cron.schedule('*/5 * * * *', async () => {
    try {
      const repo = AppDataSource.getRepository('Reserva');
      const resultado = await repo.createQueryBuilder()
        .update('Reserva')
        .set({ estado: 'expirada' })
        .where("estado = 'pendiente'")
        .andWhere("fecha_inicio <= NOW()")
        .returning('*')
        .execute();

      const afectadas = resultado.raw || [];
      if (afectadas.length > 0) {
        console.log(`${afectadas.length} reserva(s) pendiente(s) expirada(s)`);
        afectadas.forEach((r) => emitirEventoReserva('reserva:expirada', r));
      }
    } catch (err) {
      console.error('Error en job expirar pendientes:', err.message);
    }
  });

  // Cada 1 min: activar reservas confirmadas que ya comenzaron -> en_progreso
  cron.schedule('* * * * *', async () => {
    try {
      const repo = AppDataSource.getRepository('Reserva');
      const resultado = await repo.createQueryBuilder()
        .update('Reserva')
        .set({ estado: 'en_progreso' })
        .where("estado = 'confirmada'")
        .andWhere('fecha_inicio <= NOW()')
        .returning('*')
        .execute();

      const afectadas = resultado.raw || [];
      if (afectadas.length > 0) {
        console.log(`${afectadas.length} reserva(s) activada(s) -> en_progreso`);
        afectadas.forEach((r) => emitirEventoReserva('reserva:actualizada', r));
      }
    } catch (err) {
      console.error('Error en job activar en curso:', err.message);
    }
  });

  // Cada 1 min: finalizar reservas en progreso que ya terminaron -> completada
  cron.schedule('* * * * *', async () => {
    try {
      const repo = AppDataSource.getRepository('Reserva');
      const resultado = await repo.createQueryBuilder()
        .update('Reserva')
        .set({ estado: 'completada' })
        .where("estado = 'en_progreso'")
        .andWhere('fecha_fin <= NOW()')
        .returning('*')
        .execute();

      const afectadas = resultado.raw || [];
      if (afectadas.length > 0) {
        console.log(`${afectadas.length} reserva(s) finalizada(s) -> completada`);
        afectadas.forEach((r) => emitirEventoReserva('reserva:actualizada', r));
      }
    } catch (err) {
      console.error('Error en job finalizar completadas:', err.message);
    }
  });

  // Cada 30 min: enviar email de recordatorio 1 hora antes de la clase
  cron.schedule('*/30 * * * *', async () => {
    try {
      const repo = AppDataSource.getRepository('Reserva');
      const reservas = await repo.createQueryBuilder('r')
        .innerJoin('usuarios', 'e', 'r.estudiante_id = e.id')
        .innerJoin('sedes', 's', 'r.sede_id = s.id')
        .leftJoin('tipos_clase', 'tc', 'r.tipo_clase_id = tc.id')
        .select([
          'r.*',
          'e.email AS estudiante_email',
          's.nombre AS sede_nombre',
          's.direccion AS sede_direccion',
          'tc.nombre AS tipo_clase_nombre',
          'tc.color AS tipo_clase_color',
        ])
        .where("r.estado = 'confirmada'")
        .andWhere("r.fecha_inicio BETWEEN NOW() AND NOW() + INTERVAL '1 hour'")
        .getRawMany();

      for (const r of reservas) {
        if (r.estudiante_email) {
          const sede = { nombre: r.sede_nombre, direccion: r.sede_direccion };
          const tipoClase = { nombre: r.tipo_clase_nombre || 'Clase General', color: r.tipo_clase_color || '#002366' };
          enviarRecordatorio(r, r.estudiante_email, sede, tipoClase);
        }
      }
      if (reservas.length > 0) {
        console.log(`${reservas.length} recordatorio(s) enviado(s)`);
      }
    } catch (err) {
      console.error('Error en job recordatorios:', err.message);
    }
  });
};

module.exports = { iniciarScheduler };
