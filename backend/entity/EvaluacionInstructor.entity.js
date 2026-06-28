const { EntitySchema } = require('typeorm');

const EvaluacionInstructor = new EntitySchema({
  name: 'EvaluacionInstructor',
  tableName: 'evaluaciones_instructor',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    reserva_id: { type: 'int', nullable: true },
    instructor_id: { type: 'int', nullable: true },
    estudiante_id: { type: 'int', nullable: true },
    control_volante: { type: 'int', default: 5, nullable: true },
    uso_espejos: { type: 'int', default: 5, nullable: true },
    respeto_senalizacion: { type: 'int', default: 5, nullable: true },
    maniobras_estacionamiento: { type: 'int', default: 5, nullable: true },
    confianza_general: { type: 'int', default: 5, nullable: true },
    listo_examen: { type: 'varchar', length: 20, default: 'si', nullable: true },
    observaciones: { type: 'text', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
  relations: {
    reserva: {
      type: 'many-to-one',
      target: 'Reserva',
      joinColumn: { name: 'reserva_id' },
    },
    instructor: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'instructor_id' },
    },
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' },
    },
  },
});

module.exports = EvaluacionInstructor;
