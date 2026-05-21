const { EntitySchema } = require('typeorm');

const Reserva = new EntitySchema({
  name: 'Reserva',
  tableName: 'reservas',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estado: { type: 'varchar', default: 'confirmada' },
    fecha_inicio: { type: 'timestamp' },
    fecha_fin: { type: 'timestamp' },
    estudiante_id: { type: 'int' },
    instructor_id: { type: 'int' },
    vehiculo_id: { type: 'int', nullable: true },
    sede_id: { type: 'int' },
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
      nullable: true,
    },
  },
});

module.exports = Reserva;
