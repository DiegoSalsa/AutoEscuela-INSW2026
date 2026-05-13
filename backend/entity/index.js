// Barrel file — exporta todas las entidades del proyecto
const Sede = require('./Sede');
const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');
const TipoClase = require('./TipoClase');
const Reserva = require('./Reserva');
const MetaKPI = require('./MetaKPI');
const ModuloTeorico = require('./ModuloTeorico');
const EstudianteModuloProgreso = require('./EstudianteModuloProgreso');
const ResultadoExamen = require('./ResultadoExamen');
const Pago = require('./Pago');

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
  Pago,
};
