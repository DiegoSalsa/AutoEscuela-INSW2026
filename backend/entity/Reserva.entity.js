const { EntitySchema } = require('typeorm');

const Reserva = new EntitySchema({
  name: 'Reserva',
  tableName: 'reservas',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estado: { type: 'varchar', length: 50, default: 'confirmada', nullable: true },
    fecha_inicio: { type: 'timestamp', nullable: true },
    fecha_fin: { type: 'timestamp', nullable: true },
    estudiante_id: { type: 'int', nullable: true },
    instructor_id: { type: 'int', nullable: true },
    vehiculo_id: { type: 'int', nullable: true },
    sede_id: { type: 'int', nullable: true },
    tipo_clase_id: { type: 'int', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' },
    },
    instructor: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'instructor_id' },
    },
    vehiculo: {
      type: 'many-to-one',
      target: 'Vehiculo',
      joinColumn: { name: 'vehiculo_id' },
    },
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
    tipoClase: {
      type: 'many-to-one',
      target: 'TipoClase',
      joinColumn: { name: 'tipo_clase_id' },
    },
  },
});

module.exports = Reserva;
