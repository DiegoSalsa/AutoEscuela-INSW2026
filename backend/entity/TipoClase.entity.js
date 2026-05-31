const { EntitySchema } = require('typeorm');

const TipoClase = new EntitySchema({
  name: 'TipoClase',
  tableName: 'tipos_clase',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { nullable: true, type: 'varchar', length: 100 },
    descripcion: { type: 'varchar', length: 255, nullable: true },
    duracion_min: { nullable: true, type: 'int', default: 60 },
    color: { nullable: true, type: 'varchar', length: 7, default: () => "'#2563eb'" },
  },
});

module.exports = TipoClase;
