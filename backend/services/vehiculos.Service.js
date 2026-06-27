const { AppDataSource } = require('../db/data-source');
const { obtenerAlertasVehiculo } = require('./dashboard.Service');
const { subirImagenVehiculo, eliminarImagen } = require('./cloudinary.Service');

const asegurarColumnasVehiculo = async () => {
  await AppDataSource.query(`
    ALTER TABLE vehiculos
      ADD COLUMN IF NOT EXISTS kilometraje_actual int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS km_ultimo_aceite int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS km_ultimos_frenos int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS km_proximo_mantenimiento int DEFAULT 10000,
      ADD COLUMN IF NOT EXISTS fecha_revision_tecnica date DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS imagen_url varchar(500) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS imagen_public_id varchar(255) DEFAULT NULL
  `);
};

// Obtiene la flota completa con las alertas preventivas calculadas.
const getFlotaService = async (sedeId) => {
  await asegurarColumnasVehiculo();

  const qb = AppDataSource.getRepository('Vehiculo').createQueryBuilder('v')
    .select([
      'v.id AS id',
      'v.patente AS patente',
      'v.modelo AS modelo',
      'v.estado AS estado',
      'v.sede_id AS sede_id',
      'v.kilometraje_actual AS kilometraje_actual',
      'v.km_ultimo_aceite AS km_ultimo_aceite',
      'v.km_ultimos_frenos AS km_ultimos_frenos',
      'v.km_proximo_mantenimiento AS km_proximo_mantenimiento',
      'v.fecha_revision_tecnica AS fecha_revision_tecnica',
      'v.imagen_url AS imagen_url',
      'v.imagen_public_id AS imagen_public_id',
      's.nombre AS sede_nombre',
    ])
    .innerJoin('sedes', 's', 'v.sede_id = s.id');

  if (sedeId) qb.where('v.sede_id = :sedeId', { sedeId });
  qb.orderBy('v.id', 'ASC');

  const rows = await qb.getRawMany();
  return rows.map((vehiculo) => ({
    ...vehiculo,
    alertas: obtenerAlertasVehiculo(vehiculo),
  }));
};

// Actualiza el estado del vehiculo (disponible, mantenimiento, en_sesion).
const updateEstadoService = async (id, estado) => {
  const repo = AppDataSource.getRepository('Vehiculo');
  const vehiculo = await repo.findOneBy({ id: parseInt(id, 10) });
  if (!vehiculo) return null;
  vehiculo.estado = estado;
  return repo.save(vehiculo);
};

const subirImagenService = async (id, file) => {
  await asegurarColumnasVehiculo();

  if (!file) {
    const error = new Error('Debes adjuntar una imagen');
    error.status = 400;
    throw error;
  }

  const repo = AppDataSource.getRepository('Vehiculo');
  const vehiculo = await repo.findOneBy({ id: parseInt(id, 10) });
  if (!vehiculo) return null;

  const resultado = await subirImagenVehiculo(file, `vehiculo-${vehiculo.id}`);

  if (vehiculo.imagen_public_id && vehiculo.imagen_public_id !== resultado.public_id) {
    await eliminarImagen(vehiculo.imagen_public_id);
  }

  vehiculo.imagen_url = resultado.secure_url;
  vehiculo.imagen_public_id = resultado.public_id;

  return repo.save(vehiculo);
};

module.exports = {
  getFlotaService,
  updateEstadoService,
  subirImagenService,
};
