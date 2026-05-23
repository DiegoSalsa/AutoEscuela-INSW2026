const { EntitySchema } = require('typeorm');

const ModuloTeorico = new EntitySchema({
  name: 'ModuloTeorico',
  tableName: 'modulos_teoricos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { nullable: true, type: 'varchar', length: 120 },
    descripcion: { type: 'text', nullable: true },
    horas_teoricas: { nullable: true, type: 'int', default: 0 },
    orden: { nullable: true, type: 'int', default: 0 },
    created_at: { nullable: true, type: 'timestamp', createDate: true },
    updated_at: { nullable: true, type: 'timestamp', updateDate: true },
  },
});

module.exports = ModuloTeorico;
