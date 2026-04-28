const pool = require('../db/db');

// Servicio para obtener la flota de vehiculos
const getFlotaService = async (sedeId) => {
  let query = `
    SELECT v.*, s.nombre as sede_nombre
    FROM vehiculos v
    JOIN sedes s ON v.sede_id = s.id
  `;
  const params = [];
  if (sedeId) {
    query += ` WHERE v.sede_id = $1`;
    params.push(sedeId);
  }
  query += ` ORDER BY v.id ASC`;

  const result = await pool.query(query, params);

  // MOTOR DE REGLAS (Movido al servicio para mayor limpieza)
  return result.rows.map(v => {
    const alertaMantenimiento = v.kilometraje_actual >= v.km_proximo_mantenimiento;
    let alertaRevision = false;
    if (v.fecha_revision_tecnica) {
      const hoy = new Date();
      const fechaRev = new Date(v.fecha_revision_tecnica);
      const diffDias = Math.ceil((fechaRev - hoy) / (1000 * 60 * 60 * 24));
      if (diffDias <= 30) alertaRevision = true;
    }

    return {
      ...v,
      alertas_preventivas: {
        requiere_mantenimiento: alertaMantenimiento,
        requiere_revision: alertaRevision,
        critico: alertaMantenimiento || alertaRevision
      }
    };
  });
};

// Servicio para actualizar el estado del vehiculo
const updateEstadoService = async (id, estado) => {
  const query = `UPDATE vehiculos SET estado = $1 WHERE id = $2 RETURNING *`;
  const result = await pool.query(query, [estado, id]);
  return result.rows[0];
};

module.exports = { getFlotaService, updateEstadoService };