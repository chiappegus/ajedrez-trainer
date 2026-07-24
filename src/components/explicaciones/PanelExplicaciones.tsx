/**
 * PanelExplicaciones - Panel para mostrar explicaciones educativas de errores de ajedrez
 * 
 * Muestra:
 * - Explicación concisa generada por IA con loading y fade-in
 * - Botón "Profundizar explicación" para generar explicación extendida (300 palabras)
 * - Botón "Mostrar en tablero" que abre modal con tablero interactivo de variante
 * - Navegación entre errores (lista resumen, botón volver)
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.10
 */

import { useState } from 'react';
import type { ErrorDetectado } from '../../types/error';
import { sanAFigurine } from '../../utils/notacion';
import { ModalVariante } from './ModalVariante';
import './PanelExplicaciones.css';

/**
 * Formatea una explicación larga en párrafos para mejor legibilidad.
 * Divide cada ~2-3 oraciones en un párrafo separado.
 */
function formatearExplicacion(texto: string): React.ReactNode[] {
  if (!texto) return [];

  // Dividir por punto seguido de espacio
  const oraciones = texto.split(/(?<=\.)\s+/);
  const parrafos: string[] = [];
  let parrafoActual = '';

  for (let i = 0; i < oraciones.length; i++) {
    parrafoActual += (parrafoActual ? ' ' : '') + oraciones[i];
    // Cada 3 oraciones crear un nuevo párrafo
    if ((i + 1) % 3 === 0 || i === oraciones.length - 1) {
      parrafos.push(parrafoActual);
      parrafoActual = '';
    }
  }

  return parrafos.map((p, idx) => <p key={idx}>{p}</p>);
}

interface PanelExplicacionesProps {
  /** Error actual que se está mostrando */
  error: ErrorDetectado;
  /** Lista completa de errores detectados para navegación */
  todosLosErrores: ErrorDetectado[];
  /** Índice del error actual en la lista */
  índiceActual: number;
  /** Callback para navegar a un error específico */
  onSeleccionarError: (índice: number) => void;
  /** Callback para volver a la lista de errores */
  onVolver: () => void;
  /** Callback para generar explicación extendida */
  onGenerarExplicaciónExtendida: (error: ErrorDetectado) => Promise<string>;
}

/**
 * Componente que muestra explicaciones educativas de errores de ajedrez
 * 
 * Funcionalidades:
 * - Muestra explicación concisa con animación fade-in
 * - Botón para generar explicación extendida (más detallada)
 * - Botón para abrir modal con tablero interactivo de la variante
 * - Lista de resumen de errores con navegación rápida
 * - Estado de carga durante generación de explicaciones
 * 
 * @example
 * ```tsx
 * <PanelExplicaciones
 *   error={errorActual}
 *   todosLosErrores={errores}
 *   índiceActual={0}
 *   onSeleccionarError={(idx) => setÍndiceActual(idx)}
 *   onVolver={() => setMostrarPanel(false)}
 *   onGenerarExplicaciónExtendida={async (err) => {
 *     return await generador.generarExplicaciónExtendida(err);
 *   }}
 * />
 * ```
 */
export function PanelExplicaciones({
  error,
  todosLosErrores,
  índiceActual,
  onSeleccionarError,
  onVolver,
  onGenerarExplicaciónExtendida
}: PanelExplicacionesProps) {
  // Estado para controlar si se está mostrando la lista de errores o el detalle
  const [mostrarLista, setMostrarLista] = useState(false);
  
  // Estado para la explicación extendida
  const [explicaciónExtendida, setExplicaciónExtendida] = useState<string | null>(
    error.explicaciónExtendida || null
  );
  const [cargandoExtendida, setCargandoExtendida] = useState(false);
  const [errorExtendida, setErrorExtendida] = useState<string | null>(null);
  
  // Estado para el modal de variante
  const [mostrarModalVariante, setMostrarModalVariante] = useState(false);

  // Explicación a mostrar (extendida si existe, sino concisa)
  const explicaciónActual = explicaciónExtendida || error.explicación || '';
  const tieneExplicaciónExtendida = !!explicaciónExtendida;

  /**
   * Genera la explicación extendida del error actual
   */
  const handleProfundizarExplicación = async () => {
    if (cargandoExtendida || tieneExplicaciónExtendida) return;

    try {
      setCargandoExtendida(true);
      setErrorExtendida(null);

      const explicación = await onGenerarExplicaciónExtendida(error);
      setExplicaciónExtendida(explicación);
      
      // Actualizar el error con la explicación extendida
      error.explicaciónExtendida = explicación;
    } catch (err) {
      console.error('Error generando explicación extendida:', err);
      setErrorExtendida('No se pudo generar la explicación extendida. Intenta de nuevo.');
    } finally {
      setCargandoExtendida(false);
    }
  };

  /**
   * Navega a un error específico desde la lista
   */
  const handleSeleccionarErrorDesdeLista = (índice: number) => {
    setMostrarLista(false);
    setExplicaciónExtendida(null); // Reset explicación extendida al cambiar de error
    setErrorExtendida(null);
    onSeleccionarError(índice);
  };

  /**
   * Formatea el turno para mostrar en español
   */
  const formatearTurno = (turno: 'white' | 'black'): string => {
    return turno === 'white' ? 'Blancas' : 'Negras';
  };

  // Vista de lista de errores
  if (mostrarLista) {
    return (
      <div className="panel-explicaciones">
        <div className="panel-header">
          <button
            type="button"
            className="btn-volver"
            onClick={() => setMostrarLista(false)}
            aria-label="Volver al error actual"
          >
            ← Volver al error actual
          </button>
          <h2>Lista de errores detectados ({todosLosErrores.length})</h2>
        </div>

        <div className="lista-errores">
          {todosLosErrores.map((err, índice) => (
            <button
              key={`error-${err.numeroJugada}-${err.turno}`}
              type="button"
              className={`item-error ${índice === índiceActual ? 'actual' : ''}`}
              onClick={() => handleSeleccionarErrorDesdeLista(índice)}
            >
              <div className="item-error-info">
                <span className="item-numero">Jugada {err.numeroJugada}</span>
                <span className="item-turno">{formatearTurno(err.turno)}</span>
              </div>
              <div className="item-error-detalles">
                <span className="item-jugada">
                  Jugó: {sanAFigurine(err.jugadaRealizada.jugadaSAN)}
                </span>
                <span className="item-perdida">
                  Pérdida: {err.pérdidaCentipawns >= 9000 ? '♔ Mate' : `${Math.round(err.pérdidaCentipawns)} cp`}
                </span>
              </div>
              {índice === índiceActual && (
                <span className="item-actual-badge">Actual</span>
              )}
            </button>
          ))}
        </div>

        <div className="panel-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onVolver}
          >
            Volver a análisis
          </button>
        </div>
      </div>
    );
  }

  // Vista de detalle de error
  return (
    <div className="panel-explicaciones">
      <div className="panel-header">
        <div className="navegacion-errores">
          <button
            type="button"
            className="btn-navegacion"
            onClick={() => setMostrarLista(true)}
            aria-label="Ver lista de errores"
          >
            ☰ Lista de errores
          </button>
          <span className="contador-errores">
            Error {índiceActual + 1} de {todosLosErrores.length}
          </span>
          <div className="botones-navegacion">
            <button
              type="button"
              className="btn-navegacion"
              onClick={() => onSeleccionarError(índiceActual - 1)}
              disabled={índiceActual === 0}
              aria-label="Error anterior"
            >
              ←
            </button>
            <button
              type="button"
              className="btn-navegacion"
              onClick={() => onSeleccionarError(índiceActual + 1)}
              disabled={índiceActual === todosLosErrores.length - 1}
              aria-label="Error siguiente"
            >
              →
            </button>
          </div>
        </div>

        <div className="info-error">
          <h2>Jugada {error.numeroJugada} - {formatearTurno(error.turno)}</h2>
          <div className="resumen-error">
            <div className="resumen-item">
              <span className="resumen-label">Jugada realizada:</span>
              <span className="resumen-valor jugada-error">
                {sanAFigurine(error.jugadaRealizada.jugadaSAN)}
              </span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Mejor jugada:</span>
              <span className="resumen-valor jugada-mejor">
                {sanAFigurine(error.mejorJugadaSAN || '')}
              </span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Pérdida:</span>
              <span className="resumen-valor perdida">
                {error.pérdidaCentipawns >= 9000 ? '♔ Mate' : `${Math.round(error.pérdidaCentipawns)} cp`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-contenido">
        {!explicaciónActual && (
          <div className="sin-explicacion">
            <p>No hay explicación disponible para este error.</p>
          </div>
        )}

        {explicaciónActual && (
          <div className="explicacion-texto fade-in">
            {formatearExplicacion(explicaciónActual)}
          </div>
        )}

        {errorExtendida && (
          <div className="error-generacion">
            <p className="texto-error">{errorExtendida}</p>
          </div>
        )}
      </div>

      <div className="panel-acciones">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleProfundizarExplicación}
          disabled={cargandoExtendida || tieneExplicaciónExtendida}
          aria-label="Generar explicación extendida"
        >
          {cargandoExtendida ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              Generando explicación detallada...
            </>
          ) : tieneExplicaciónExtendida ? (
            '✓ Explicación extendida mostrada'
          ) : (
            'Profundizar explicación'
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setMostrarModalVariante(true)}
          aria-label="Mostrar variante en tablero interactivo"
        >
          📋 Mostrar en tablero
        </button>

        <button
          type="button"
          className="btn btn-tertiary"
          onClick={onVolver}
          aria-label="Volver al análisis completo"
        >
          ← Volver a análisis
        </button>
      </div>

      {mostrarModalVariante && (
        <ModalVariante
          error={error}
          onCerrar={() => setMostrarModalVariante(false)}
        />
      )}
    </div>
  );
}
