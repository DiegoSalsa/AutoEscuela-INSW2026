const { EntitySchema } = require('typeorm');

const EstudianteModuloProgreso = new EntitySchema({
  name: 'EstudianteModuloProgreso',
  tableName: 'estudiante_modulo_progreso',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estudiante_id: { nullable: true, type: 'int' },
    modulo_id: { nullable: true, type: 'int' },
    aprobado: { nullable: true, type: 'boolean', default: false },
    calificacion: { type: 'int', nullable: true },
    fecha_aprobacion: { type: 'timestamp', nullable: true },
    created_at: { nullable: true, type: 'timestamp', createDate: true },
    updated_at: { nullable: true, type: 'timestamp', updateDate: true },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' , nullable: true },
    },
    modulo: { nullable: true,
      type: 'many-to-one',
      target: 'ModuloTeorico',
      joinColumn: { name: 'modulo_id' },
    },
  },
});

module.exports = EstudianteModuloProgreso;
