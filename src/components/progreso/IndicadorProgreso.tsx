/**
 * IndicadorProgreso - Componente para mostrar progreso del análisis en tiempo real
 * 
 * Muestra:
 * - Barra de progreso visual con porcentaje
 * - Jugada actual / Total de jugadas
 * - Tiempo restante estimado
 * - Errores encontrados hasta el momento
 * - Botones Pausar/Reanudar según estado
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 9.1, 9.2, 9.3, 10.3, 10.4
 */

import { useEffect, useState } from 'react';
import type { ProgresoAnálisis } from '../../types/error';
import './IndicadorProgreso.css';

interface IndicadorProgresoProps {
  /** Función para obtener el progreso actual del analizador */
  obtenerProgreso: () => ProgresoAnálisis;
  /** Callback para pausar el análisis */
  onPausar?: () => void;
  /** Callback para reanudar el análisis */
  onReanudar?: () => void;
  /** Intervalo de actualización en ms (default: 500ms) */
  intervaloActualizacion?: number;
}

/**
 * Formatea milisegundos a formato legible "Xm Ys"
 */
function formatearTiempo(ms: number): string {
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const segsRestantes = segundos % 60;

  if (minutos > 0) {
    return `${minutos}m ${segsRestantes}s`;
  }
  return `${segsRestantes}s`;
}

/**
 * Componente que muestra el progreso del análisis en tiempo real
 * Se actualiza cada 500ms mediante polling al método obtenerProgreso() del AnalizadorPartida
 */
export function IndicadorProgreso({
  obtenerProgreso,
  onPausar,
  onReanudar,
  intervaloActualizacion = 500
}: IndicadorProgresoProps) {
  const [progreso, setProgreso] = useState<ProgresoAnálisis>(obtenerProgreso());

  // Polling cada 500ms para actualizar el progreso
  useEffect(() => {
    const intervalo = setInterval(() => {
      const nuevoProgreso = obtenerProgreso();
      setProgreso(nuevoProgreso);
    }, intervaloActualizacion);

    return () => clearInterval(intervalo);
  }, [obtenerProgreso, intervaloActualizacion]);

  // Calcular porcentaje de progreso
  const porcentaje = progreso.totalJugadas > 0
    ? Math.min(100, Math.floor((progreso.jugadaActual / progreso.totalJugadas) * 100))
    : 0;

  // Determinar si mostrar botones
  const mostrarBotones = progreso.estado === 'analizando' || progreso.estado === 'pausado';
  const puedeReanudar = progreso.estado === 'pausado';
  const puedePausar = progreso.estado === 'analizando';

  return (
    <div className="indicador-progreso">
      {/* Encabezado con estado y porcentaje */}
      <div className="progreso-header">
        <h3 className="progreso-titulo">
          {progreso.estado === 'analizando' && '⚙️ Analizando partida...'}
          {progreso.estado === 'pausado' && '⏸️ Análisis pausado'}
          {progreso.estado === 'completado' && '✅ Análisis completado'}
          {progreso.estado === 'error' && '❌ Error en análisis'}
          {progreso.estado === 'inactivo' && '⏳ Esperando...'}
        </h3>
        <span className="progreso-porcentaje">{porcentaje}%</span>
      </div>

      {/* Barra de progreso visual */}
      <div className="progreso-barra-contenedor">
        <div
          className="progreso-barra-relleno"
          style={{ width: `${porcentaje}%` }}
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Información detallada */}
      <div className="progreso-detalles">
        <div className="progreso-info-item">
          <span className="progreso-label">Jugada:</span>
          <span className="progreso-valor">
            {progreso.jugadaActual} / {progreso.totalJugadas}
          </span>
        </div>

        <div className="progreso-info-item">
          <span className="progreso-label">Errores encontrados:</span>
          <span className="progreso-valor progreso-errores">
            {progreso.erroresEncontrados}
          </span>
        </div>

        {progreso.estado === 'analizando' && progreso.tiempoRestanteEstimado > 0 && (
          <div className="progreso-info-item">
            <span className="progreso-label">Tiempo restante:</span>
            <span className="progreso-valor">
              ~{formatearTiempo(progreso.tiempoRestanteEstimado)}
            </span>
          </div>
        )}
      </div>

      {/* Botones de control */}
      {mostrarBotones && (
        <div className="progreso-controles">
          {puedePausar && onPausar && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onPausar}
              aria-label="Pausar análisis"
            >
              ⏸️ Pausar
            </button>
          )}
          
          {puedeReanudar && onReanudar && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onReanudar}
              aria-label="Reanudar análisis"
            >
              ▶️ Reanudar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
