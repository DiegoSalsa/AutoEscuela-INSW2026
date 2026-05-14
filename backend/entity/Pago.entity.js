const { EntitySchema } = require('typeorm');

const Pago = new EntitySchema({
  name: 'Pago',
  tableName: 'pagos',
  columns: {
    id:             { primary: true, type: 'int', generated: true },
    estudiante_id:  { type: 'int' },
    concepto:       { type: 'varchar', length: 80 },
    monto:          { type: 'decimal', precision: 10, scale: 2 },
    fecha:          { type: 'date' },
    sede_id:        { type: 'int' },
  },
  relations: {
    estudiante: { type: 'many-to-one', target: 'Usuario', joinColumn: { name: 'estudiante_id' } },
    sede:       { type: 'many-to-one', target: 'Sede', joinColumn: { name: 'sede_id' } },
  },
});

module.exports = Pago;
