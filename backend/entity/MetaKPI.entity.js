const { EntitySchema } = require('typeorm');

const MetaKPI = new EntitySchema({
  name: 'MetaKPI',
  tableName: 'metas_kpi',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    metrica_nombre: {
      type: 'varchar',
      length: 120,
    },
    valor_esperado: {
      type: 'int',
    },
    mes_anio: {
      type: 'varchar',
      length: 7,
    },
    sede_id: {
      type: 'int',
      nullable: true,
    },
    creado_en: {
      type: 'timestamp',
      createDate: true,
    },
    actualizado_en: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
      nullable: true,
    },
  },
});

module.exports = MetaKPI;
