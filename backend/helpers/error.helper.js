// Lanzar errores HTTP con codigo de estado personalizado
const httpError = (mensaje, status, extra = {}) => {
  const error = new Error(mensaje);
  error.status = status;
  Object.assign(error, extra);
  return error;
};

module.exports = { httpError };
