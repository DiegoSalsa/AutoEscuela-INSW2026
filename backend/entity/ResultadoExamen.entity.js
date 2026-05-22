const { EntitySchema } = require('typeorm');

const ResultadoExamen = new EntitySchema({
  name: 'ResultadoExamen',
  tableName: 'resultados_examen',
  columns: {
    id:             { primary: true, type: 'int', generated: true },
    estudiante_id:  { nullable: true, type: 'int' },
    aprobado:       { nullable: true, type: 'boolean' },
    tipo_examen:    { nullable: true, type: 'varchar', length: 30, default: 'practico' },
    fecha:          { nullable: true, type: 'date' },
    sede_id:        { nullable: true, type: 'int' },
  },
  relations: {
    estudiante: { type: 'many-to-one', target: 'Usuario', joinColumn: { name: 'estudiante_id' , nullable: true } },
    sede:       { nullable: true, type: 'many-to-one', target: 'Sede', joinColumn: { name: 'sede_id' } },
  },
});

module.exports = ResultadoExamen;
