const { EntitySchema } = require('typeorm');

const Sede = new EntitySchema({
  name: 'Sede',
  tableName: 'sedes',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', length: 255, nullable: true },
    direccion: { type: 'varchar', length: 255, nullable: true },
  },
});

module.exports = Sede;
