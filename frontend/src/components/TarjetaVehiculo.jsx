import React from 'react';
import { AlertTriangle, Car } from 'lucide-react';

const TarjetaVehiculo = ({ vehiculo, alFinalizar }) => {
  // Si el backend envio alertas, el auto "esta mal" y se pone rojo
  const tieneAlertas = vehiculo.alertas && vehiculo.alertas.length > 0;

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      tieneAlertas 
        ? 'bg-red-50 border-red-500 shadow-red-100' // Alerta preventiva - rojo claro
        : 'bg-white border-gray-100 shadow-sm' // Sin alertas - blanco
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${tieneAlertas ? 'bg-red-100' : 'bg-blue-50'}`}>
          <Car className={tieneAlertas ? 'text-red-600' : 'text-blue-600'} size={24} />
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
          vehiculo.estado === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {vehiculo.estado}
        </span>
      </div>

      <h3 className="font-bold text-gray-800 text-lg">{vehiculo.patente}</h3>
      <p className="text-gray-500 text-sm mb-4">{vehiculo.sede_nombre}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Kilometraje:</span>
          <span className="font-semibold">{vehiculo.kilometraje_actual} km</span>
        </div>

        {/* Seccion de Alertas Criticas */}
        {tieneAlertas && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg animate-pulse">
            {vehiculo.alertas.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-red-700 text-xs font-bold">
                <AlertTriangle size={14} />
                <span>{err.mensaje}</span>
              </div>
            ))}
          </div>
        )}

        {/* Boton para liberar auto y actualizar km */}
        {vehiculo.estado === 'en_sesion' && (
          <button 
            onClick={alFinalizar}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Liberar Vehículo
          </button>
        )}
      </div>
    </div>
  );
};

export default TarjetaVehiculo;