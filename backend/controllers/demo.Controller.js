const demoService = require('../services/demo.Service');

function demoHabilitado() {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_SEED === 'true';
}

async function seedAcademico(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    const data = await demoService.seedAcademicoDemo();
    res.status(201).json(data);
  } catch (error) {
    console.error('Error en seedAcademico:', error.message);
    res.status(500).json({ error: 'Error al cargar datos demo academicos' });
  }
}

async function seedFlota(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    const data = await demoService.seedFlotaDemo();
    res.status(201).json(data);
  } catch (error) {
    console.error('Error en seedFlota:', error.message);
    res.status(500).json({ error: 'Error al cargar datos demo de flota' });
  }
}

module.exports = {
  seedAcademico,
  seedFlota,
};
