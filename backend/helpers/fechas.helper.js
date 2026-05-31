// Valida que una fecha cumpla con las reglas de negocio de la autoescuela
// Retorna { valido: boolean, mensaje?: string }
const validarReglasNegocioFechas = (fecha) => {
  const d = new Date(fecha);

  // Bloquear domingos
  if (d.getDay() === 0) {
    return {
      valido: false,
      mensaje: 'La autoescuela no atiende los días domingo',
    };
  }

  const horas = d.getHours();
  const minutos = d.getMinutes();
  const tiempo = horas + minutos / 60;

  // Fuera del horario de atencion (antes de 08:00 o despues de 20:00)
  if (tiempo < 8 || tiempo > 20) {
    return {
      valido: false,
      mensaje: 'Fuera del horario de atención (lunes a sábado de 08:00 a 20:00)',
    };
  }

  // Cae dentro del bloque de colacion (13:00-14:00)
  if (tiempo >= 13 && tiempo < 14) {
    return {
      valido: false,
      mensaje: 'El horario 13:00–14:00 está bloqueado por colación',
    };
  }

  return { valido: true };
};

// Suma un buffer de minutos a una fecha (ej: 15 min de limpieza del vehiculo)
const sumarBufferLimpieza = (fecha, minutos = 15) => {
  const d = new Date(fecha);
  d.setMinutes(d.getMinutes() + minutos);
  return d;
};

module.exports = { validarReglasNegocioFechas, sumarBufferLimpieza };
