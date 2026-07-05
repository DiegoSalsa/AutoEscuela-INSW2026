const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretodevelopment';

// Middleware requiere token válido
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado o formato inválido' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, rol, sedeId, estudianteId (opcional) }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware opcional si hay token lo decodifica, si no, continúa sin usuario
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            // Silencioso no hay usuario autenticado
        }
    }
    next();
};

// Middleware para autorizar por rol
const authorizeRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        const rol = req.user?.rol || req.headers['x-rol'];
        if (rol && !rolesPermitidos.includes(rol)) {
            return res.status(403).json({ 
                error: `Acceso denegado: el rol '${rol}' no tiene permiso para acceder a esta sección o recurso.` 
            });
        }
        next();
    };
};

module.exports = { authenticate, optionalAuth, authorizeRol };