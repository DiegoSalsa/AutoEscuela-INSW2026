const { EntitySchema } = require('typeorm');

const Pago = new EntitySchema({
  name: 'Pago',
  tableName: 'pagos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estudiante_id: { type: 'int', nullable: true },
    concepto: { type: 'varchar', length: 80, nullable: true },
    monto: { type: 'decimal', precision: 10, scale: 2, nullable: true },
    fecha: { type: 'date', nullable: true },
    sede_id: { type: 'int', nullable: true },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' },
    },
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
  },
});

module.exports = Pago;
