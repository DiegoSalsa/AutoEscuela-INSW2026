const { EntitySchema } = require('typeorm');

const ModuloTeorico = new EntitySchema({
  name: 'ModuloTeorico',
  tableName: 'modulos_teoricos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', length: 120 },
    descripcion: { type: 'text', nullable: true },
    horas_teoricas: { type: 'int', default: 0 },
    orden: { type: 'int', default: 0 },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
});

module.exports = ModuloTeorico;
