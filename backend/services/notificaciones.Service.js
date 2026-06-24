const { Resend } = require('resend');

let resend = null;


const initMailer = async () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    resend = new Resend(apiKey);
    console.log('✅ Resend configurado correctamente');
  } else {
    console.warn('⚠️ RESEND_API_KEY no configurada — emails se mostrarán solo en consola (modo desarrollo)');

  }
};

const FROM = () => process.env.EMAIL_FROM || 'AutoDrive Academy <onboarding@resend.dev>';

const enviarEmail = async (to, subject, html) => {
  const emailDestino = process.env.TEST_EMAIL_OVERRIDE || to;
  if (!emailDestino) {
    console.warn('No hay destinatario');
    return;
  }

  if (!resend) {
    console.log('═══════════════════════════════════════════');
    console.log(`📧 EMAIL (modo dev) a ${emailDestino}: ${subject}`);
    console.log('═══════════════════════════════════════════');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM(),
      to: emailDestino,
      subject,
      html,
    });
    if (error) {
      console.error('❌ Error Resend:', error.message);
      return;
    }
    console.log(`✅ Email enviado (ID: ${data.id}) a ${emailDestino}`);
  } catch (err) {
    console.error('❌ Excepción:', err.message);
  }
};

// ──────────────── Template base (sin cambios, solo asegura que esté) ────────────────
const emailWrapper = (contenido) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background: linear-gradient(135deg, #002366 0%, #1A237E 50%, #283593 100%); padding: 32px 40px; text-align: center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;">AutoDrive Academy</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Sistema de Agendamiento</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">${contenido}</td></tr>
        <tr><td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px;">
          AutoDrive Academy · contacto@autodrive.cl · +56 9 1234 5678<br>Este correo fue generado automáticamente. No responder.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ──────────────── Bloques reutilizables (sin cambios) ────────────────
const bloqueInfoSede = (sede) => {
  if (!sede || !sede.nombre) return '';
  return `<table width="100%" style="background-color:#f0f9ff;border-radius:10px;padding:16px 20px;margin-top:16px;">
    <tr><td><p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1e3a5f;">${sede.nombre}</p>${sede.direccion ? `<p style="margin:0;font-size:13px;color:#64748b;">${sede.direccion}</p>` : ''}</td></tr>
  </table>`;
};

const bloqueInfoTipoClase = (tipoClase) => {
  if (!tipoClase || !tipoClase.nombre) return '';
  const color = tipoClase.color || '#2563eb';
  return `<tr><td style="padding:10px 16px;font-weight:600;color:#374151;">Tipo de clase:</td>
    <td style="padding:10px 16px;"><span style="display:inline-block;background-color:${color}15;color:${color};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${color}30;">${tipoClase.nombre}</span></td></tr>`;
};


// Funciones de envío específicas
const enviarConfirmacion = async (reserva, emailEstudiante, sede, tipoClase) => {
  const fecha = new Date(reserva.fecha_inicio);
  const fechaFormateada = fecha.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const horaInicio = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const horaFin = new Date(reserva.fecha_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const subject = `Reserva Confirmada — ${fechaFormateada}`;
  const contenido = `
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="margin:16px 0 4px;color:#166534;font-size:22px;">Reserva Confirmada</h2>
      <p style="margin:0;color:#6b7280;">Tu clase ha sido agendada exitosamente.</p>
    </div>
    <table style="background-color:#f8fafc;border-radius:10px;overflow:hidden;margin:16px 0;width:100%;">
      <tr><td style="padding:10px 16px;font-weight:600;">Fecha:</td><td style="padding:10px 16px;text-transform:capitalize;">${fechaFormateada}</td></tr>
      <tr><td style="padding:10px 16px;font-weight:600;">Horario:</td><td style="padding:10px 16px;">${horaInicio} — ${horaFin}</td></tr>
      ${bloqueInfoTipoClase(tipoClase)}
    </table>
    ${bloqueInfoSede(sede)}
    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;text-align:center;">Recuerda llegar 10 minutos antes de tu clase.</p>
  `;
  await enviarEmail(emailEstudiante, subject, emailWrapper(contenido));
};

const enviarCancelacion = async (reserva, emailEstudiante, sede) => {
  const fecha = new Date(reserva.fecha_inicio);
  const fechaFormateada = fecha.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const subject = `Reserva Cancelada — ${fechaFormateada}`;
  const contenido = `
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="margin:16px 0 4px;color:#991b1b;font-size:22px;">Reserva Cancelada</h2>
      <p style="margin:0;color:#6b7280;">Tu reserva del ${fechaFormateada} ha sido cancelada.</p>
    </div>
    ${bloqueInfoSede(sede)}
    <div style="text-align:center;margin-top:24px;"><p style="color:#374151;">Puedes agendar una nueva clase en cualquier momento.</p></div>
  `;
  await enviarEmail(emailEstudiante, subject, emailWrapper(contenido));
};

const enviarModificacion = async (reserva, emailEstudiante, sede, tipoClase) => {
  const fecha = new Date(reserva.fecha_inicio);
  const fechaFormateada = fecha.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const horaInicio = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const horaFin = new Date(reserva.fecha_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const subject = `Reserva Modificada — ${fechaFormateada}`;
  const contenido = `
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="margin:16px 0 4px;color:#1e40af;font-size:22px;">Reserva Modificada</h2>
      <p style="margin:0;color:#6b7280;">Tu reserva ha sido actualizada con los siguientes datos.</p>
    </div>
    <table style="background-color:#f8fafc;border-radius:10px;overflow:hidden;margin:16px 0;width:100%;">
      <tr><td style="padding:10px 16px;font-weight:600;">Fecha:</td><td style="padding:10px 16px;text-transform:capitalize;">${fechaFormateada}</td></tr>
      <tr><td style="padding:10px 16px;font-weight:600;">Horario:</td><td style="padding:10px 16px;">${horaInicio} — ${horaFin}</td></tr>
      ${bloqueInfoTipoClase(tipoClase)}
    </table>
    ${bloqueInfoSede(sede)}
    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;text-align:center;">Si no realizaste este cambio, contacta a la autoescuela.</p>
  `;
  await enviarEmail(emailEstudiante, subject, emailWrapper(contenido));
};

const enviarRecordatorio = async (reserva, emailEstudiante, sede) => {
  const fecha = new Date(reserva.fecha_inicio);
  const horaInicio = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const fechaFormateada = fecha.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const subject = `Recordatorio: Tu clase es en 1 hora`;
  const contenido = `
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="margin:16px 0 4px;color:#92400e;font-size:22px;">Tu clase empieza pronto</h2>
      <p style="margin:0;color:#6b7280;">Tienes una clase programada para las <strong>${horaInicio}</strong> hrs.</p>
    </div>
    <table style="background-color:#fffbeb;border-radius:10px;padding:16px 20px;margin:16px 0;border-left:4px solid #f59e0b;width:100%;">
      <tr><td><p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#92400e;">${fechaFormateada}</p><p style="margin:0;font-size:13px;color:#78716c;">Recuerda llegar con tiempo a la sede.</p></td></tr>
    </table>
    ${bloqueInfoSede(sede)}
  `;
  await enviarEmail(emailEstudiante, subject, emailWrapper(contenido));
};

module.exports = {
  initMailer,
  enviarConfirmacion,
  enviarCancelacion,
  enviarModificacion,
  enviarRecordatorio,
};