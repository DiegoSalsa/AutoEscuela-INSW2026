const { EntitySchema } = require('typeorm');

const Vehiculo = new EntitySchema({
  name: 'Vehiculo',
  tableName: 'vehiculos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    patente: { type: 'varchar' },
    modelo: { type: 'varchar' },
    estado: { type: 'varchar', default: 'disponible' },
    sede_id: { type: 'int' },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
  },
});

module.exports = Vehiculo;
