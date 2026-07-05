const { EntitySchema } = require('typeorm');

const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', nullable: true },
    email: { type: 'varchar', nullable: true },
    password_hash: { type: 'varchar', nullable: true },
    telefono: { type: 'varchar', nullable: true },
    rut: { type: 'varchar', nullable: true },
    rol: { type: 'varchar', nullable: true },
    estado: { type: 'varchar', default: 'activo', nullable: true },
    sede_id: { type: 'int', nullable: true },
    tipo_clase: { type: 'varchar', length: 10, nullable: true },
    especialidad: { type: 'varchar', nullable: true },
    anios_experiencia: { type: 'int', default: 0, nullable: true },
    calificacion_promedio: { type: 'decimal', precision: 2, scale: 1, default: 0, nullable: true },
    total_clases_completadas: { type: 'int', default: 0, nullable: true },
    turno: { type: 'varchar', nullable: true },
    demo_seed: { type: 'varchar', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
  },
});

module.exports = Usuario;
