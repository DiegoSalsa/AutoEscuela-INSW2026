const { EntitySchema } = require('typeorm');

const Vehiculo = new EntitySchema({
  name: 'Vehiculo',
  tableName: 'vehiculos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    patente: { type: 'varchar', length: 20, nullable: true },
    modelo: { type: 'varchar', length: 255, nullable: true },
    estado: { type: 'varchar', length: 50, default: 'disponible', nullable: true },
    sede_id: { type: 'int', nullable: true },
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
