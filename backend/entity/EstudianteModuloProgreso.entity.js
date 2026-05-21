const { EntitySchema } = require('typeorm');

const EstudianteModuloProgreso = new EntitySchema({
  name: 'EstudianteModuloProgreso',
  tableName: 'estudiante_modulo_progreso',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estudiante_id: { type: 'int' },
    modulo_id: { type: 'int' },
    aprobado: { type: 'boolean', default: false },
    calificacion: { type: 'int', nullable: true },
    fecha_aprobacion: { type: 'timestamp', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' },
    },
    modulo: {
      type: 'many-to-one',
      target: 'ModuloTeorico',
      joinColumn: { name: 'modulo_id' },
    },
  },
});

module.exports = EstudianteModuloProgreso;
