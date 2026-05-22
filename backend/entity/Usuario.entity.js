const { EntitySchema } = require('typeorm');

const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', length: 255, nullable: true },
    email: { type: 'varchar', length: 255, nullable: true },
    telefono: { type: 'varchar', length: 50, nullable: true },
    rut: { type: 'varchar', length: 20, nullable: true },
    rol: { nullable: true, type: 'varchar', length: 50 },
    estado: { nullable: true, type: 'varchar', length: 50, default: 'activo' },
    sede_id: { nullable: true, type: 'int' },
    created_at: { nullable: true, type: 'timestamp', createDate: true },
    updated_at: { nullable: true, type: 'timestamp', updateDate: true },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' , nullable: true },
    },
  },
});

module.exports = Usuario;
