// validacion nativa para dashboard (sin librerias externas)

// middleware que valida req.query.sedeId
// si no viene, pasa directo (es opcional)
// si viene, debe ser un numero entero mayor a 0
const validarSedeId = (req, res, next) => {
  const { sedeId } = req.query;

  // sedeId es opcional, si no viene seguimos
  if (sedeId === undefined || sedeId === '') {
    return next();
  }

  const parsed = Number(sedeId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return res.status(400).json({
      error: 'El ID de la sede debe ser un número entero válido'
    });
  }

  // reemplazar el string original por el entero parseado
  req.query.sedeId = parsed;
  next();
};

module.exports = { validarSedeId };
