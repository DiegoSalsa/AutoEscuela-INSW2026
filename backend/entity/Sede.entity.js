const { EntitySchema } = require('typeorm');

const Sede = new EntitySchema({
  name: 'Sede',
  tableName: 'sedes',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', nullable: true },
    direccion: { type: 'varchar', nullable: true },
  },
});

module.exports = Sede;
