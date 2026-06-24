const { EntitySchema } = require('typeorm');

const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', nullable: true },
    email: { type: 'varchar', nullable: true },
    telefono: { type: 'varchar', nullable: true },
    rut: { type: 'varchar', nullable: true },
    rol: { type: 'varchar', nullable: true },
    estado: { type: 'varchar', default: 'activo', nullable: true },
    sede_id: { type: 'int', nullable: true },
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
