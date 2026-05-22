const { EntitySchema } = require('typeorm');

const Vehiculo = new EntitySchema({
  name: 'Vehiculo',
  tableName: 'vehiculos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    patente: { nullable: true, type: 'varchar', length: 20 },
    modelo: { nullable: true, type: 'varchar', length: 255 },
    estado: { nullable: true, type: 'varchar', length: 50, default: 'disponible' },
    sede_id: { nullable: true, type: 'int' },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' , nullable: true },
    },
  },
});

module.exports = Vehiculo;
