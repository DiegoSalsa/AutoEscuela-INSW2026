// ─────────────────────────────────────────────
// Validación nativa para Dashboard (sin librerías externas)
// ─────────────────────────────────────────────

/**
 * Middleware que valida req.query.sedeId.
 * - Si no viene, pasa directo (es opcional).
 * - Si viene, debe ser un número entero mayor a 0.
 */
const validarSedeId = (req, res, next) => {
  const { sedeId } = req.query;

  // sedeId es opcional; si no viene, continuar
  if (sedeId === undefined || sedeId === '') {
    return next();
  }

  const parsed = Number(sedeId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return res.status(400).json({
      error: 'El ID de la sede debe ser un número entero válido'
    });
  }

  // Reemplazar el string original por el entero parseado
  req.query.sedeId = parsed;
  next();
};

module.exports = { validarSedeId };
