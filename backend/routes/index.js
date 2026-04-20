const { Router } = require('express');
const router = Router();

const dashboardRoutes = require('./dashboardRoutes');
const reservasRoutes = require('./reservasRoutes');

router.use('/dashboard', dashboardRoutes);
router.use('/reservas', reservasRoutes);

module.exports = router;