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
    metrica_nombre: { nullable: true,
      type: 'varchar',
      length: 120,
    },
    valor_esperado: { nullable: true,
      type: 'int',
    },
    mes_anio: { nullable: true,
      type: 'varchar',
      length: 7,
    },
    sede_id: {
      type: 'int',
      nullable: true,
    },
    creado_en: { nullable: true,
      type: 'timestamp',
      createDate: true,
    },
    actualizado_en: { nullable: true,
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' , nullable: true },
      nullable: true,
    },
  },
});

module.exports = MetaKPI;
