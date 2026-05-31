const NodeCache = require('node-cache');

// TTL de 24 horas para las keys de idempotencia
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

const idempotency = (req, res, next) => {
  const key = req.headers['idempotency-key'];

  // Si no envía header, la petición procede normalmente (retrocompatible)
  if (!key) return next();

  // Validar formato UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(key)) {
    return res.status(400).json({
      error: 'Idempotency-Key debe ser un UUID v4 válido',
    });
  }

  // Si la key ya existe, retornar respuesta cacheada
  const cached = cache.get(key);
  if (cached) {
    return res.status(cached.status).json(cached.body);
  }

  // Interceptar res.json para cachear la respuesta antes de enviarla
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cache.set(key, { status: res.statusCode, body });
    return originalJson(body);
  };

  next();
};

module.exports = { idempotency };
