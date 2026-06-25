const demoService = require('../services/demo.Service');

function demoHabilitado() {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_SEED === 'true';
}

function esClear(req) {
  return req.body?.action === 'clear'
    || req.query?.action === 'clear'
    || req.get('x-demo-action') === 'clear';
}

async function seedAcademico(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    if (esClear(req)) {
      const data = await demoService.limpiarAcademicoDemo();
      return res.json(data);
    }
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
    if (esClear(req)) {
      const data = await demoService.limpiarFlotaDemo();
      return res.json(data);
    }
    const data = await demoService.seedFlotaDemo();
    res.status(201).json(data);
  } catch (error) {
    console.error('Error en seedFlota:', error.message);
    res.status(500).json({ error: 'Error al cargar datos demo de flota' });
  }
}

async function seedInstructores(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    if (esClear(req)) {
      const data = await demoService.limpiarInstructoresDemo();
      return res.json(data);
    }
    const data = await demoService.seedInstructoresDemo();
    res.status(201).json(data);
  } catch (error) {
    console.error('Error en seedInstructores:', error.message);
    res.status(500).json({ error: 'Error al cargar datos demo de instructores' });
  }
}

async function limpiarAcademico(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    const data = await demoService.limpiarAcademicoDemo();
    res.json(data);
  } catch (error) {
    console.error('Error en limpiarAcademico:', error.message);
    res.status(500).json({ error: 'Error al eliminar datos demo academicos' });
  }
}

async function limpiarFlota(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    const data = await demoService.limpiarFlotaDemo();
    res.json(data);
  } catch (error) {
    console.error('Error en limpiarFlota:', error.message);
    res.status(500).json({ error: 'Error al eliminar datos demo de flota' });
  }
}

async function limpiarInstructores(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    const data = await demoService.limpiarInstructoresDemo();
    res.json(data);
  } catch (error) {
    console.error('Error en limpiarInstructores:', error.message);
    res.status(500).json({ error: 'Error al eliminar datos demo de instructores' });
  }
}

async function limpiarTodo(req, res) {
  if (!demoHabilitado()) {
    return res.status(403).json({ error: 'Seeds demo deshabilitados en produccion' });
  }

  try {
    const data = await demoService.limpiarTodoDemo();
    res.json(data);
  } catch (error) {
    console.error('Error en limpiarTodo:', error.message);
    res.status(500).json({ error: 'Error al eliminar todos los datos demo' });
  }
}

module.exports = {
  seedAcademico,
  seedFlota,
  seedInstructores,
  limpiarAcademico,
  limpiarFlota,
  limpiarInstructores,
  limpiarTodo,
};
