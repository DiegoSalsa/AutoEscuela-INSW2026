/**
 * Valida que una fecha cumpla con las reglas de negocio de la autoescuela.
 * @param {Date|string} fecha — La fecha a validar
 * @returns {{ valido: boolean, mensaje?: string }}
 */
const validarReglasNegocioFechas = (fecha) => {
  const d = new Date(fecha);

  //Bloquear domingos
  if (d.getDay() === 0) {
    return {
      valido: false,
      mensaje: 'La autoescuela no atiende los días domingo',
    };
  }

  const horas = d.getHours();
  const minutos = d.getMinutes();
  const tiempo = horas + minutos / 60; // representación decimal (ej: 13:30 → 13.5)

  // Fuera del horario de atención (antes de 08:00 o después de 20:00)
  if (tiempo < 8 || tiempo > 20) {
    return {
      valido: false,
      mensaje: 'Fuera del horario de atención (lunes a sábado de 08:00 a 20:00)',
    };
  }

  // Cae dentro del bloque de colación (13:00–14:00)
  if (tiempo >= 13 && tiempo < 14) {
    return {
      valido: false,
      mensaje: 'El horario 13:00–14:00 está bloqueado por colación',
    };
  }

  return { valido: true };
};

/**
 * Suma un buffer de minutos a una fecha (ej: 15 min de limpieza).
 * @param {Date|string} fecha — Fecha base
 * @param {number} minutos — Minutos a sumar (default: 15)
 * @returns {Date} Nueva fecha con el buffer sumado
 */
const sumarBufferLimpieza = (fecha, minutos = 15) => {
  const d = new Date(fecha);
  d.setMinutes(d.getMinutes() + minutos);
  return d;
};

module.exports = { validarReglasNegocioFechas, sumarBufferLimpieza };
