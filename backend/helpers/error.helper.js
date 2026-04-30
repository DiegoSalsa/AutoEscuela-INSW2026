// Helper — Lanzar errores HTTP con código de estado
const httpError = (mensaje, status, extra = {}) => {
  const error = new Error(mensaje);
  error.status = status;
  Object.assign(error, extra);
  return error;
};

module.exports = { httpError };
