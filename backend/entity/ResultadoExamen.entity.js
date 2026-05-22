const { EntitySchema } = require('typeorm');

const ResultadoExamen = new EntitySchema({
  name: 'ResultadoExamen',
  tableName: 'resultados_examen',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estudiante_id: { type: 'int', nullable: true },
    aprobado: { type: 'boolean', nullable: true },
    tipo_examen: { type: 'varchar', length: 30, default: 'practico', nullable: true },
    fecha: { type: 'date', nullable: true },
    sede_id: { type: 'int', nullable: true },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' },
    },
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
  },
});

module.exports = ResultadoExamen;
