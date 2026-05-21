const { Router } = require('express');
const router = Router();

const dashboardRoutes = require('./dashboard.Routes');
const reservasRoutes = require('./reservas.Routes');
const estudiantesRoutes = require('./estudiantes.Routes');

router.use('/dashboard', dashboardRoutes);
router.use('/reservas', reservasRoutes);
router.use('/estudiantes', estudiantesRoutes);

module.exports = router;
