const pool = require('../db/db');
// Importamos la logica centralizada para no repetir codigo
const { obtenerAlertasVehiculo } = require('./dashboard.Service');

//Obtiene la flota completa con las alertas preventivas calculadas
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

  // Mapeamos los resultados para inyectar las alertas automaticas
  return result.rows.map(vehiculo => {
    return {
      ...vehiculo,
      // Usamos la funcion de dashboard.Service para evaluar km y fechas
      alertas: obtenerAlertasVehiculo(vehiculo)
    };
  });
};

//Actualiza el estado del vehiculo (Disponible, Mantenimiento, En sesion)
const updateEstadoService = async (id, estado) => {
  const query = `UPDATE vehiculos SET estado = $1 WHERE id = $2 RETURNING *`;
  const result = await pool.query(query, [estado, id]);
  return result.rows[0];
};

module.exports = { 
  getFlotaService, 
  updateEstadoService 
};