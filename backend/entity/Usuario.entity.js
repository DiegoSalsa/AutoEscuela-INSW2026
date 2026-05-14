const { EntitySchema } = require('typeorm');

const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar' },
    email: { type: 'varchar', nullable: true },
    telefono: { type: 'varchar', nullable: true },
    rut: { type: 'varchar', nullable: true },
    rol: { type: 'varchar' },
    estado: { type: 'varchar', default: 'activo' },
    sede_id: { type: 'int' },
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
