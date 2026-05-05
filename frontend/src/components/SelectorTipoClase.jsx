import { useState, useEffect } from 'react';
import { getTiposClase } from '../service/reservas.Service';
import './SelectorTipoClase.css';

export default function SelectorTipoClase({ tipoSeleccionado, onSelect }) {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getTiposClase()
      .then((data) => setTipos(data))
      .catch((err) => console.error('Error al cargar tipos de clase:', err))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="tipo-clase-section">
        <h3>Tipo de clase</h3>
        <p className="text-muted text-sm">Cargando tipos de clase...</p>
      </div>
    );
  }

  if (tipos.length === 0) {
    return null;
  }

  return (
    <div className="tipo-clase-section">
      <h3>Tipo de clase</h3>
      <div className="tipo-clase-grid">
        {tipos.map((tipo) => (
          <div
            key={tipo.id}
            className={`tipo-clase-card${tipoSeleccionado === tipo.id ? ' seleccionado' : ''}`}
            style={{ '--tc-color': tipo.color || '#2563eb' }}
            onClick={() => onSelect(tipo.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(tipo.id)}
          >
            <span className="tipo-clase-nombre">{tipo.nombre}</span>
            {tipo.descripcion && (
              <span className="tipo-clase-desc">{tipo.descripcion}</span>
            )}
            <div className="tipo-clase-meta">
              <span className="tipo-clase-badge" style={{ backgroundColor: tipo.color || '#2563eb' }}>
                {tipo.duracion_min} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
