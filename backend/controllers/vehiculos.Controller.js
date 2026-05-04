const vehiculoService = require('../services/vehiculos.Service');
const { AppDataSource } = require('../db/data-source'); // Importamos la DB

const getFlota = async (req, res) => {
  try {
    const data = await vehiculoService.getFlotaService(req.query.sedeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la flota' });
  }
};

const updateEstadoVehiculo = async (req, res) => {
  try {
    const vehiculo = await vehiculoService.updateEstadoService(req.params.id, req.body.estado);
    if (!vehiculo) return res.status(404).json({ error: 'No encontrado' });
    res.json({ mensaje: 'Actualizado', vehiculo });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// NUEVA FUNCIÓN: Actualiza los KM y libera el auto en tiempo real
const registrarFinDeSesion = async (req, res) => {
    try {
        const { id } = req.params;
        const { kmRecorridos } = req.body;
        
        const repo = AppDataSource.getRepository('Vehiculo');
        const auto = await repo.findOneBy({ id: parseInt(id) });

        if (auto) {
            auto.kilometraje_actual = (auto.kilometraje_actual || 0) + (kmRecorridos || 0);
            auto.estado = "disponible";
            await repo.save(auto);
            return res.json({ mensaje: "Kilometraje actualizado", auto });
        }
        res.status(404).json({ error: "Vehículo no encontrado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Exportamos todo correctamente sin usar "export const"
module.exports = { getFlota, updateEstadoVehiculo, registrarFinDeSesion };