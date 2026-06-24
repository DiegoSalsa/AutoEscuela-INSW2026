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
      nullable: true,
    },
    valor_esperado: {
      type: 'int',
      nullable: true,
    },
    mes_anio: {
      type: 'varchar',
      length: 7,
      nullable: true,
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
    },
  },
});

module.exports = MetaKPI;
