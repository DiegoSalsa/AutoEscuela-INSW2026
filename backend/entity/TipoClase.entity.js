const { EntitySchema } = require('typeorm');

const TipoClase = new EntitySchema({
  name: 'TipoClase',
  tableName: 'tipos_clase',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', length: 100 },
    descripcion: { type: 'varchar', length: 255, nullable: true },
    duracion_min: { type: 'int', default: 60 },
    color: { type: 'varchar', length: 7, default: "'#2563eb'" },
  },
});

module.exports = TipoClase;
