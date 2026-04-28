const vehiculoService = require('../services/vehiculos.Service');

// get /api/vehiculos y get /api/vehiculos?sedeId=
const getFlota = async (req, res) => {
  try {
    const data = await vehiculoService.getFlotaService(req.query.sedeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la flota' });
  }
};

// put /api/vehiculos/:id/estado
const updateEstadoVehiculo = async (req, res) => {
  try {
    const vehiculo = await vehiculoService.updateEstadoService(req.params.id, req.body.estado);
    if (!vehiculo) return res.status(404).json({ error: 'No encontrado' });
    res.json({ mensaje: 'Actualizado', vehiculo });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

module.exports = { getFlota, updateEstadoVehiculo };