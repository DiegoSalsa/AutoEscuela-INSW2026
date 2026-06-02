import React, { useState } from 'react';
import { X, CheckCircle, Gauge } from 'lucide-react';

const ModalFinalizarSesion = ({ vehiculoId, patente, abierto, alCerrar, alCompletar }) => {
  const [kmRecorridos, setKmRecorridos] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!abierto) return null;

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      // Llamada al endpoint que definimos en el backend[cite: 3]
      const respuesta = await fetch(`/api/vehiculos/${vehiculoId}/finalizar-sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kmRecorridos: parseInt(kmRecorridos) }),
      });

      if (respuesta.ok) {
        alert(`Sesión finalizada. Kilometraje actualizado para ${patente}`);
        alCompletar(); // Recarga los datos del dashboard[cite: 1]
        alCerrar();
      }
    } catch (error) {
      console.error("Error al actualizar kilometraje:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center">
            <CheckCircle className="mr-2" size={20} /> Finalizar Sesión
          </h2>
          <button onClick={alCerrar} className="hover:bg-blue-700 rounded-full p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              Vas a liberar el vehículo: <strong>{patente}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Gauge size={16} className="mr-2 text-gray-400" /> Kilómetros recorridos en esta clase:
            </label>
            <input
              type="number"
              required
              min="1"
              value={kmRecorridos}
              onChange={(e) => setKmRecorridos(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej: 15"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                cargando ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {cargando ? 'Guardando...' : 'Confirmar y Liberar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalFinalizarSesion;