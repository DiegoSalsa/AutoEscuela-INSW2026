const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretodevelopment';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // { id, rol, sedeId, estudianteId }
      return next();
    } catch (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
  }

  // FALLBACK PARA EL PROTOTIPO (el frontend aún no envía JWT, envía x-rol)
  const rol = req.headers['x-rol'];
  if (rol) {
    req.user = { rol };
    return next();
  }

  return res.status(401).json({ error: 'Token o rol no proporcionado' });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Silencioso
    }
  } else {
    // FALLBACK
    const rol = req.headers['x-rol'];
    if (rol) req.user = { rol };
  }
  next();
};

module.exports = { authenticate, optionalAuth };
