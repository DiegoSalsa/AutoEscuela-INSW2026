import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './PanelDetalles.css';

export default function PanelDetalles({ selecciones, tipoClaseId, fecha, hora, isLoading, error, exito, onConfirmar }) {
  
  const handleConfirm = () => {
    onConfirmar();
  };

  const isReady = selecciones.sedeId && selecciones.estudianteId && selecciones.instructorId && selecciones.vehiculoId && tipoClaseId && fecha && hora;

  return (
    <div className="panel-detalles">
      <h3 className="panel-title">Detalles del servicio</h3>
      
      {!isReady && !exito && (
        <p className="text-muted text-sm">Completa todas las selecciones (sede, personas, fecha y hora) para continuar.</p>
      )}

      {isReady && !exito && (
        <div className="resumen">
          <p className="resumen-item">
            <strong>Fecha:</strong> {format(fecha, "d 'de' MMMM, yyyy", { locale: es })}
          </p>
          <p className="resumen-item">
            <strong>Hora:</strong> {hora.horaInicio} - {hora.horaFin}
          </p>
          <p className="resumen-item">
            <strong>Sede ID:</strong> {selecciones.sedeId}
          </p>
          <p className="resumen-item text-muted text-sm mt-4">
            Al confirmar, se enviará un correo con los detalles de la reserva.
          </p>

          {error && <div className="alert-error">{error}</div>}

          <button 
            className="btn-confirmar" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Confirmando...' : 'Confirmar Reserva'}
          </button>
        </div>
      )}

      {exito && (
        <div className="alert-success">
          <h4>¡Reserva Confirmada!</h4>
          <p>La clase ha sido agendada correctamente. Se ha enviado un correo al estudiante.</p>
        </div>
      )}
    </div>
  );
}
