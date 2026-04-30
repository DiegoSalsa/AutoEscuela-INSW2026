//Helper — Filtros dinámicos para TypeORM QueryBuilder
const aplicarFiltros = (qb, filtros, mapa) => {
  Object.entries(mapa).forEach(([param, columna]) => {
    if (filtros[param] != null) {
      qb.andWhere(`${columna} = :${param}`, { [param]: filtros[param] });
    }
  });
};

module.exports = { aplicarFiltros };
