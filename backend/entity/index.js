// Barrel file — exporta todas las entidades del proyecto
const Sede = require('./Sede.entity');
const Usuario = require('./Usuario.entity');
const Vehiculo = require('./Vehiculo.entity');
const TipoClase = require('./TipoClase.entity');
const Reserva = require('./Reserva.entity');
const MetaKPI = require('./MetaKPI.entity');
const ModuloTeorico = require('./ModuloTeorico.entity');
const EstudianteModuloProgreso = require('./EstudianteModuloProgreso.entity');
const ResultadoExamen = require('./ResultadoExamen.entity');

module.exports = {
  Sede,
  Usuario,
  Vehiculo,
  TipoClase,
  Reserva,
  MetaKPI,
  ModuloTeorico,
  EstudianteModuloProgreso,
  ResultadoExamen,
};
