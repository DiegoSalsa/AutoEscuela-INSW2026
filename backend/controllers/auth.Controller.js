const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../db/data-source');

const JWT_SECRET = process.env.JWT_SECRET || 'secretodevelopment';
const DEFAULT_PASS = 'autoescuela123';

// Asegurar que existan los usuarios administrativos básicos (Admin y Recepción)
const asegurarCuentasBase = async (repo) => {
  let admin = await repo.findOne({ where: { email: 'admin@autodrive.cl' } });
  if (!admin) {
    admin = await repo.save(repo.create({
      nombre: 'Administrador Central',
      email: 'admin@autodrive.cl',
      rol: 'admin',
      estado: 'activo',
      password_hash: DEFAULT_PASS
    }));
  }

  let recepcion = await repo.findOne({ where: { email: 'recepcion@autodrive.cl' } });
  if (!recepcion) {
    recepcion = await repo.save(repo.create({
      nombre: 'Recepción Operativa',
      email: 'recepcion@autodrive.cl',
      rol: 'recepcionista',
      estado: 'activo',
      sede_id: 1,
      password_hash: DEFAULT_PASS
    }));
  }

  return { admin, recepcion };
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Debe proporcionar correo y contraseña.' });
    }

    const repo = AppDataSource.getRepository('Usuario');
    await asegurarCuentasBase(repo);

    const usuario = await repo.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas: correo no registrado.' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ error: 'Esta cuenta se encuentra inactiva o suspendida.' });
    }

    // Validación de contraseña (permite autoescuela123 por defecto o comparación con hash)
    const passValida = password === DEFAULT_PASS || password === usuario.password_hash;
    if (!passValida) {
      return res.status(401).json({ error: 'Credenciales inválidas: contraseña incorrecta.' });
    }

    const payload = {
      id: usuario.id,
      rol: usuario.rol,
      sedeId: usuario.sede_id || null,
      estudianteId: usuario.rol === 'estudiante' ? usuario.id : null,
      instructorId: usuario.rol === 'instructor' ? usuario.id : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: usuario.id,
        label: usuario.nombre || usuario.email,
        email: usuario.email,
        rol: usuario.rol,
        sedeId: usuario.sede_id || null,
        estudianteId: usuario.rol === 'estudiante' ? usuario.id : null,
        instructorId: usuario.rol === 'instructor' ? usuario.id : null,
        tipo_clase: usuario.tipo_clase || usuario.especialidad || null,
      }
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error interno en el servidor de autenticación.' });
  }
};

module.exports = { login };
