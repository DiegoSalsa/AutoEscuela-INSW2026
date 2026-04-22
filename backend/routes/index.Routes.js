const { Router } = require('express');
const router = Router();

const dashboardRoutes = require('./dashboard.Routes');
const reservasRoutes = require('./reservas.Routes');

router.use('/dashboard', dashboardRoutes);
router.use('/reservas', reservasRoutes);

module.exports = router;
