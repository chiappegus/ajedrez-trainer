/**
 * ModalVariante - Modal con tablero interactivo para mostrar variante de mejor jugada
 * 
 * Muestra un tablero interactivo donde el usuario puede avanzar y retroceder
 * la secuencia de la mejor jugada alternativa paso a paso.
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.7, 8.8
 */

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { ErrorDetectado } from '../../types/error';
import { sanAFigurine } from '../../utils/notacion';
import './ModalVariante.css';

interface ModalVarianteProps {
  /** Error con información de la variante */
  error: ErrorDetectado;
  /** Callback para cerrar el modal */
  onCerrar: () => void;
}

/**
 * Modal que muestra un tablero interactivo con la variante de la mejor jugada
 * 
 * Permite al usuario:
 * - Ver la posición antes del error
 * - Avanzar paso a paso la mejor jugada
 * - Retroceder para revisar la variante
 * - Navegar con controles anterior/siguiente
 * 
 * @example
 * ```tsx
 * <ModalVariante
 *   error={errorDetectado}
 *   onCerrar={() => setMostrarModal(false)}
 * />
 * ```
 */
export function ModalVariante({ error, onCerrar }: ModalVarianteProps) {
  const [posiciónActual, setPosiciónActual] = useState(0);
  const [_juego] = useState(() => {
    // Inicializar juego con la posición antes del error
    const chess = new Chess(error.fenAntes);
    return chess;
  });
  const [historia, setHistoria] = useState<string[]>([error.fenAntes]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Construir la secuencia de la variante al montar
  useEffect(() => {
    const secuencia: string[] = [error.fenAntes];
    const chessTemp = new Chess(error.fenAntes);

    // Agregar la mejor jugada
    try {
      chessTemp.move(error.mejorJugada); // UCI format
      secuencia.push(chessTemp.fen());

      // Si hay variante adicional, agregar esas jugadas
      if (error.variante && error.variante.length > 0) {
        for (const jugadaUCI of error.variante) {
          try {
            chessTemp.move(jugadaUCI);
            secuencia.push(chessTemp.fen());
          } catch {
            // Si alguna jugada falla, detener
            break;
          }
        }
      }
    } catch (err) {
      console.error('Error construyendo variante:', err);
    }

    setHistoria(secuencia);
  }, [error]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      } else if (e.key === 'ArrowLeft') {
        handleAnterior();
      } else if (e.key === 'ArrowRight') {
        handleSiguiente();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posiciónActual, historia.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar modal al hacer clic fuera
  const handleClickFuera = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onCerrar();
    }
  };

  const handleAnterior = () => {
    if (posiciónActual > 0) {
      setPosiciónActual(posiciónActual - 1);
    }
  };

  const handleSiguiente = () => {
    if (posiciónActual < historia.length - 1) {
      setPosiciónActual(posiciónActual + 1);
    }
  };

  const handleIrAlInicio = () => {
    setPosiciónActual(0);
  };

  const handleIrAlFinal = () => {
    setPosiciónActual(historia.length - 1);
  };

  const formatearTurno = (turno: 'white' | 'black'): string => {
    return turno === 'white' ? 'Blancas' : 'Negras';
  };

  return (
    <div className="modal-overlay" onClick={handleClickFuera}>
      <div className="modal-contenido" ref={modalRef}>
        <div className="modal-header">
          <h2>Variante de mejor jugada</h2>
          <button
            type="button"
            className="btn-cerrar-modal"
            onClick={onCerrar}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-info">
          <div className="info-jugada">
            <span className="info-label">Jugada:</span>
            <span className="info-valor">{error.numeroJugada} - {formatearTurno(error.turno)}</span>
          </div>
          <div className="info-jugada">
            <span className="info-label">Mejor alternativa:</span>
            <span className="info-valor jugada-mejor">{sanAFigurine(error.mejorJugadaSAN || '')}</span>
          </div>
          <div className="info-posicion">
            <span className="info-label">Posición:</span>
            <span className="info-valor">
              {posiciónActual === 0 ? 'Inicial' : `Después de ${posiciónActual} ${posiciónActual === 1 ? 'jugada' : 'jugadas'}`}
            </span>
          </div>
        </div>

        <div className="modal-tablero">
          <Chessboard
            options={{
              position: historia[posiciónActual],
              darkSquareStyle: { backgroundColor: '#b58863' },
              lightSquareStyle: { backgroundColor: '#f0d9b5' },
              allowDragging: false,
              animationDurationInMs: 300,
              showNotation: true,
              boardStyle: {
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }
            }}
          />
        </div>

        <div className="modal-controles">
          <div className="controles-navegacion">
            <button
              type="button"
              className="btn-control"
              onClick={handleIrAlInicio}
              disabled={posiciónActual === 0}
              aria-label="Ir al inicio de la variante"
            >
              ⏮ Inicio
            </button>
            <button
              type="button"
              className="btn-control"
              onClick={handleAnterior}
              disabled={posiciónActual === 0}
              aria-label="Jugada anterior"
            >
              ◀ Anterior
            </button>
            <span className="contador-posiciones" data-testid="position-counter">
              {posiciónActual + 1} / {historia.length}
            </span>
            <button
              type="button"
              className="btn-control"
              onClick={handleSiguiente}
              disabled={posiciónActual === historia.length - 1}
              aria-label="Jugada siguiente"
            >
              Siguiente ▶
            </button>
            <button
              type="button"
              className="btn-control"
              onClick={handleIrAlFinal}
              disabled={posiciónActual === historia.length - 1}
              aria-label="Ir al final de la variante"
            >
              Final ⏭
            </button>
          </div>

          <div className="ayuda-teclado">
            <span>💡 Usa las teclas ← → para navegar, Esc para cerrar</span>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
