const nodemailer = require('nodemailer');

let transporter = null;

/*
  Inicializar transporter de Nodemailer
  Si no hay SMTP configurado, crea una cuenta Ethereal de prueba
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

//  Template base compartido por todos los emails
const emailWrapper = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #002366 0%, #1A237E 50%, #283593 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                🚗 AutoDrive Academy
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
                Sistema de Agendamiento
              </p>
            </td>
          </tr>

          <!-- Contenido dinámico -->
          <tr>
            <td style="padding: 32px 40px;">
              ${contenido}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
                    <strong style="color: #64748b;">AutoDrive Academy</strong><br>
                    📧 contacto@autodrive.cl · 📞 +56 9 1234 5678<br>
                    Este correo fue generado automáticamente. No responder.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

//  Bloque reutilizable de información de sede
const bloqueInfoSede = (sede) => {
  if (!sede || !sede.nombre) return '';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 10px; padding: 16px 20px; margin-top: 16px; border-left: 4px solid #2563eb;">
      <tr>
        <td>
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1e3a5f;">
            📍 ${sede.nombre}
          </p>
          ${sede.direccion ? `<p style="margin: 0; font-size: 13px; color: #64748b;">📌 ${sede.direccion}</p>` : ''}
        </td>
      </tr>
    </table>
  `;
};


//  Bloque reutilizable de tipo de clase
const bloqueInfoTipoClase = (tipoClase) => {
  if (!tipoClase || !tipoClase.nombre) return '';
  const color = tipoClase.color || '#2563eb';
  return `
    <tr>
      <td style="padding: 10px 16px; font-weight: 600; color: #374151; vertical-align: top;">📚 Tipo de clase:</td>
      <td style="padding: 10px 16px; color: #1f2937;">
        <span style="display: inline-block; background-color: ${color}15; color: ${color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid ${color}30;">
          ${tipoClase.nombre}
        </span>
      </td>
    </tr>
  `;
};

//  Enviar confirmación de reserva

const enviarConfirmacion = (reserva, emailEstudiante, sede, tipoClase) => {
  const fechaFormateada = new Date(reserva.fecha_inicio).toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const horaInicio = new Date(reserva.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const horaFin = new Date(reserva.fecha_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const subject = `✅ Reserva Confirmada — ${fechaFormateada}`;
  const contenido = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">
        ✅
      </div>
      <h2 style="margin: 16px 0 4px 0; color: #166534; font-size: 22px;">¡Reserva Confirmada!</h2>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Tu clase ha sido agendada exitosamente.</p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; overflow: hidden; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 16px; font-weight: 600; color: #374151; border-bottom: 1px solid #e2e8f0;">📅 Fecha:</td>
        <td style="padding: 10px 16px; color: #1f2937; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${fechaFormateada}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-weight: 600; color: #374151; border-bottom: 1px solid #e2e8f0;">🕐 Horario:</td>
        <td style="padding: 10px 16px; color: #1f2937; border-bottom: 1px solid #e2e8f0;">${horaInicio} — ${horaFin}</td>
      </tr>
      ${bloqueInfoTipoClase(tipoClase)}
      <tr>
        <td style="padding: 10px 16px; font-weight: 600; color: #374151;">🆔 Reserva:</td>
        <td style="padding: 10px 16px; color: #1f2937; font-family: monospace;">#${reserva.id}</td>
      </tr>
    </table>

    ${bloqueInfoSede(sede)}

    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px; text-align: center;">
      Recuerda llegar 10 minutos antes de tu clase. ¡Te esperamos! 🎓
    </p>
  `;

  // Fire-and-forget: no bloqueamos la API
  enviarEmail(emailEstudiante, subject, emailWrapper(contenido)).catch(() => {});
};

//  Enviar notificación de cancelación

const enviarCancelacion = (reserva, emailEstudiante, sede, tipoClase) => {
  const fechaFormateada = new Date(reserva.fecha_inicio).toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const subject = `❌ Reserva Cancelada — ${fechaFormateada}`;
  const contenido = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #fee2e2; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">
        ❌
      </div>
      <h2 style="margin: 16px 0 4px 0; color: #991b1b; font-size: 22px;">Reserva Cancelada</h2>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        La reserva <strong>#${reserva.id}</strong> del ${fechaFormateada} ha sido cancelada.
      </p>
    </div>

    ${bloqueInfoSede(sede)}

    <div style="text-align: center; margin-top: 24px;">
      <p style="color: #374151; font-size: 14px;">Puedes agendar una nueva clase en cualquier momento.</p>
    </div>
  `;

  enviarEmail(emailEstudiante, subject, emailWrapper(contenido)).catch(() => {});
};

//  Enviar recordatorio (1 hora antes de la clase)
const enviarRecordatorio = (reserva, emailEstudiante, sede, tipoClase) => {
  const horaInicio = new Date(reserva.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const fechaFormateada = new Date(reserva.fecha_inicio).toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const subject = `⏰ Recordatorio: Tu clase es en 1 hora`;
  const contenido = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #fef3c7; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">
        ⏰
      </div>
      <h2 style="margin: 16px 0 4px 0; color: #92400e; font-size: 22px;">¡Tu clase empieza pronto!</h2>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Tienes una clase programada para las <strong>${horaInicio}</strong> hrs.
      </p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 10px; padding: 16px 20px; margin: 16px 0; border-left: 4px solid #f59e0b;">
      <tr>
        <td>
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #92400e;">
            📅 ${fechaFormateada}
          </p>
          <p style="margin: 0; font-size: 13px; color: #78716c;">
            Recuerda llegar con tiempo a la sede.
          </p>
        </td>
      </tr>
    </table>

    ${bloqueInfoSede(sede)}
  `;

  enviarEmail(emailEstudiante, subject, emailWrapper(contenido)).catch(() => {});
};

module.exports = { initMailer, enviarConfirmacion, enviarCancelacion, enviarRecordatorio };
