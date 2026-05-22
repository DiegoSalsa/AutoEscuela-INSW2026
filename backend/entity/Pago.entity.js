const { EntitySchema } = require('typeorm');

const Pago = new EntitySchema({
  name: 'Pago',
  tableName: 'pagos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estudiante_id: { nullable: true, type: 'int' },
    concepto: { nullable: true, type: 'varchar', length: 80 },
    monto: { nullable: true, type: 'decimal', precision: 10, scale: 2 },
    fecha: { nullable: true, type: 'date' },
    sede_id: { nullable: true, type: 'int' },
  },
  relations: {
    estudiante: { type: 'many-to-one', target: 'Usuario', joinColumn: { name: 'estudiante_id' , nullable: true } },
    sede: { nullable: true, type: 'many-to-one', target: 'Sede', joinColumn: { name: 'sede_id' } },
  },
});

module.exports = Pago;
