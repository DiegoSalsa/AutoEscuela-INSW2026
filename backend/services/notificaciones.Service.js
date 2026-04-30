const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Inicializar transporter de Nodemailer
 * Si no hay SMTP configurado, crea una cuenta Ethereal de prueba
 */
const initMailer = async () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    // Usar SMTP configurado en .env
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10) || 587,
      secure: parseInt(smtpPort, 10) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    console.log(`Nodemailer configurado con SMTP: ${smtpHost}`);
  } else {
    // Crear cuenta Ethereal de prueba automáticamente
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('Nodemailer en modo prueba (Ethereal)');
      console.log(`Usuario Ethereal: ${testAccount.user}`);
    } catch (err) {
      console.warn('No se pudo inicializar Nodemailer:', err.message);
    }
  }
};

const FROM = () => process.env.SMTP_FROM || '"AutoDrive Academy" <noreply@autodrive.cl>';

// Enviar email de forma asíncrona 
const enviarEmail = async (to, subject, html) => {
  if (!transporter || !to) return;
  try {
    const info = await transporter.sendMail({
      from: FROM(),
      to,
      subject,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Preview email: ${previewUrl}`);
    }
  } catch (err) {
    console.error('Error al enviar email:', err.message);
  }
};

// Enviar confirmación de reserva
const enviarConfirmacion = (reserva, emailEstudiante) => {
  const subject = `✅ Reserva Confirmada — ${new Date(reserva.fecha_inicio).toLocaleDateString('es-CL')}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">¡Reserva Confirmada!</h2>
      <p>Tu clase ha sido agendada exitosamente.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; font-weight: bold;">📅 Inicio:</td><td style="padding: 8px;">${new Date(reserva.fecha_inicio).toLocaleString('es-CL')}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">🏁 Fin:</td><td style="padding: 8px;">${new Date(reserva.fecha_fin).toLocaleString('es-CL')}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">📍 Sede:</td><td style="padding: 8px;">${reserva.sede_id}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">🆔 Reserva:</td><td style="padding: 8px;">#${reserva.id}</td></tr>
      </table>
      <p style="color: #6b7280; font-size: 12px;">AutoDrive Academy — Sistema de Agendamiento</p>
    </div>
  `;
  // Fire-and-forget: no bloqueamos la API
  enviarEmail(emailEstudiante, subject, html).catch(() => {});
};

// Enviar notificación de cancelación

const enviarCancelacion = (reserva, emailEstudiante) => {
  const subject = `❌ Reserva Cancelada — ${new Date(reserva.fecha_inicio).toLocaleDateString('es-CL')}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Reserva Cancelada</h2>
      <p>La reserva #${reserva.id} del ${new Date(reserva.fecha_inicio).toLocaleString('es-CL')} ha sido cancelada.</p>
      <p>Puedes agendar una nueva clase en cualquier momento.</p>
      <p style="color: #6b7280; font-size: 12px;">AutoDrive Academy — Sistema de Agendamiento</p>
    </div>
  `;
  enviarEmail(emailEstudiante, subject, html).catch(() => {});
};

// Enviar recordatorio (1 hora antes de la clase)
const enviarRecordatorio = (reserva, emailEstudiante) => {
  const subject = `⏰ Recordatorio: Tu clase es en 1 hora`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">¡Tu clase empieza pronto!</h2>
      <p>Tienes una clase programada para las <strong>${new Date(reserva.fecha_inicio).toLocaleString('es-CL')}</strong>.</p>
      <p>Recuerda llegar con tiempo a la sede.</p>
      <p style="color: #6b7280; font-size: 12px;">AutoDrive Academy — Sistema de Agendamiento</p>
    </div>
  `;
  enviarEmail(emailEstudiante, subject, html).catch(() => {});
};

module.exports = { initMailer, enviarConfirmacion, enviarCancelacion, enviarRecordatorio };
