import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService, obtenerInventarioFlota } from '../../service/dashboard.Service.js';
import TarjetaVehiculo from '../../components/TarjetaVehiculo.jsx';
import ModalFinalizarSesion from '../../components/ModalFinalizarSesion';
import { Users, Car, AlertCircle } from 'lucide-react';

export default function ResumenTab({ sedeActiva }) {
  const [kpis, setKpis] = useState({ estudiantesActivos: 0, clasesCompletadas: 0, vehiculosDisponibles: '0/0' });
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [autoSeleccionado, setAutoSeleccionado] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [k, v] = await Promise.all([
        dashboardService.getDashboardKPIs(sedeActiva),
        obtenerInventarioFlota()
      ]);
      
      setKpis(k || { estudiantesActivos: 0, clasesCompletadas: 0, vehiculosDisponibles: '0/0' });

      // ---Esto imprimira los datos en la consola del navegador ---
      console.log("Vehículos recibidos del backend:", v);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Normalizamos a medianoche para comparar solo fechas

      const vehiculosProcesados = (v || []).map(auto => {
        const nuevasAlertas = [];
        
        // 1. Buscamos el kilometraje actual 
        const kmActual = Number(auto.kilometraje_actual || auto.kilometrajeActual || 0);
        // 2. Buscamos el kilometraje para el próximo mantenimiento
        const kmMantenimiento = Number(auto.km_proximo_mantenimiento || auto.kmProximoMantenimiento || 10000);

        console.log(`🚗 Auto: ${auto.patente} | Actual: ${kmActual} | Límite usado: ${kmMantenimiento}`);

        // Alerta de Kilometraje 
        if (kmActual >= kmMantenimiento) {
              nuevasAlertas.push({ mensaje: "Mantenimiento Necesario" });
            }

        // 2. Logica de fecha de revision tecnica
        if (auto.fecha_revision_tecnica) {
          const fechaRevision = new Date(auto.fecha_revision_tecnica);
          if (fechaRevision < hoy) {
            nuevasAlertas.push({ mensaje: "Revisión Vencida" });
          }
        }

        const estadoVisual = nuevasAlertas.length > 0 ? "mantenimiento" : auto.estado;

        return { ...auto, alertas: nuevasAlertas, 
            estado: estadoVisual
         };
      });

      const filtrados = sedeActiva === 'all' 
        ? vehiculosProcesados 
        : vehiculosProcesados.filter(x => String(x.sede_id) === String(sedeActiva));

      setVehiculos(filtrados);
    } catch (error) {
      console.error("Error en Dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [sedeActiva]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (loading) return <p className="p-8 text-center text-gray-500 font-medium">Actualizando flota...</p>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* KPI CARDS  */}
        <div className="lg:w-[58%] bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estudiantes Activos</p><p className="text-2xl font-black text-gray-800">{kpis.estudiantesActivos}</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Car size={24}/></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Flota Total</p><p className="text-2xl font-black text-gray-800">{kpis.vehiculosDisponibles}</p></div>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-[10px] border-orange-500 text-orange-600 text-3xl font-black shadow-inner">
              {kpis.clasesCompletadas}
            </div>
            <p className="text-[10px] mt-3 font-black uppercase text-gray-400">Clases Hoy</p>
          </div>
        </div>

        {/* PANEL DE ALERTAS CRITICAS */}
        <div className="lg:w-[42%] bg-white rounded-2xl border border-gray-200 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-red-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Alertas de Flota</h2>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[180px] pr-2">
            {vehiculos.flatMap(v => (v.alertas || []).map((alerta, i) => (
              <div key={`${v.patente}-${i}`} className="p-3 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center transition-all hover:bg-red-100">
                <span className="text-xs font-bold text-red-800">{v.patente}</span>
                <span className="text-[10px] font-medium text-red-600 bg-white px-2 py-1 rounded-full shadow-sm">{alerta.mensaje}</span>
              </div>
            )))}
            {vehiculos.every(v => !v.alertas || v.alertas.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <p className="text-sm italic">Toda la flota operativa</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECCION DE INVENTARIO */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Car className="text-primary" /> Control de Unidades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiculos.map((auto) => (
            <TarjetaVehiculo 
              key={auto.id} 
              vehiculo={auto} 
              alFinalizar={() => {
                setAutoSeleccionado(auto);
                setModalAbierto(true);
              }} 
            />
          ))}
        </div>
      </div>

      {/* MODAL DE LIBERACION DE KM */}
      {autoSeleccionado && (
        <ModalFinalizarSesion 
          abierto={modalAbierto}
          vehiculoId={autoSeleccionado.id}
          patente={autoSeleccionado.patente}
          alCerrar={() => setModalAbierto(false)}
          alCompletar={cargarDatos}
        />
      )}
    </div>
  );
}
