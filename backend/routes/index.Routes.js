const { Router } = require('express');
const router = Router();

const dashboardRoutes = require('./dashboard.Routes');
const reservasRoutes = require('./reservas.Routes');
const vehiculosRoutes = require('./vehiculos.Routes');


router.use('/dashboard', dashboardRoutes);
router.use('/reservas', reservasRoutes);
router.use('/vehiculos', vehiculosRoutes);

module.exports = router;
