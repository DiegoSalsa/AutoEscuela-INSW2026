const { Router } = require('express');
const router = Router();

const dashboardRoutes = require('./dashboard.Routes');
const reservasRoutes = require('./reservas.Routes');
const estudiantesRoutes = require('./estudiantes.Routes');
const demoRoutes = require('./demo.Routes');
const vehiculosRoutes = require('./vehiculos.Routes');
const instructorRoutes = require('./instructor.Routes');
const authRoutes = require('./auth.Routes');
const { authorizeRol } = require('../middleware/auth.middleware');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reservas', reservasRoutes);
router.use('/estudiantes', estudiantesRoutes);
router.use('/demo', demoRoutes);
router.use('/vehiculos', vehiculosRoutes);
router.use('/instructor', authorizeRol('admin', 'instructor'), instructorRoutes);

module.exports = router;
