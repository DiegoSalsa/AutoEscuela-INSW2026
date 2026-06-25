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
    kilometraje_actual: { type: 'int', default: 0, nullable: true },
    km_ultimo_aceite: { type: 'int', default: 0, nullable: true },
    km_ultimos_frenos: { type: 'int', default: 0, nullable: true },
    km_proximo_mantenimiento: { type: 'int', default: 10000, nullable: true },
    fecha_revision_tecnica: { type: 'date', nullable: true },
    demo_seed: { type: 'varchar', nullable: true },
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
