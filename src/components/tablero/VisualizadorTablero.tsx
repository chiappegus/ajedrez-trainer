import { memo } from 'react';
import { Chessboard } from 'react-chessboard';
import './VisualizadorTablero.css';

/**
 * Tipo de highlight para resaltar casillas en el tablero
 * - 'error': Marca jugadas con error (rojo)
 * - 'mejorJugada': Marca la mejor alternativa (verde)
 * - 'últimoMovimiento': Marca el último movimiento (amarillo)
 */
export type TipoResaltado = 'error' | 'mejorJugada' | 'últimoMovimiento';

/**
 * Representa un movimiento en el tablero
 */
export interface Movimiento {
  desde: string; // Casilla origen (ej: 'e2')
  hacia: string; // Casilla destino (ej: 'e4')
}

/**
 * Props del componente VisualizadorTablero
 */
export interface VisualizadorTableroProps {
  /** Posición del tablero en notación FEN */
  posiciónFEN: string;
  /** Orientación del tablero (blancas abajo o negras abajo) */
  orientación?: 'white' | 'black';
  /** Movimiento a resaltar con highlight */
  movimientoResaltado?: Movimiento;
  /** Tipo de highlight a aplicar al movimiento */
  tipoResaltado?: TipoResaltado;
  /** Callback cuando se cambia de posición (navegación) */
  onCambiarPosición?: (numeroPosición: number) => void;
  /** Modo de visualización: 'partida' o 'explicación' */
  modo?: 'partida' | 'explicación';
  /** Título del tablero */
  título?: string;
  /** Número de jugada actual (para mostrar en la UI) */
  numeroJugada?: number;
  /** Total de jugadas disponibles (para navegación) */
  totalJugadas?: number;
  /** Evaluación de la posición actual en centipawns */
  evaluación?: number;
}

/**
 * Genera estilos CSS personalizados para resaltar casillas según el tipo
 */
function generarEstilosHighlight(
  movimiento?: Movimiento,
  tipo?: TipoResaltado
): Record<string, React.CSSProperties> {
  if (!movimiento || !tipo) {
    return {};
  }

  let color: string;
  switch (tipo) {
    case 'error':
      color = 'rgba(255, 0, 0, 0.4)'; // Rojo para errores
      break;
    case 'mejorJugada':
      color = 'rgba(0, 255, 0, 0.4)'; // Verde para mejores jugadas
      break;
    case 'últimoMovimiento':
      color = 'rgba(255, 255, 0, 0.3)'; // Amarillo para último movimiento
      break;
  }

  return {
    [movimiento.desde]: {
      backgroundColor: color,
      borderRadius: '50%',
    },
    [movimiento.hacia]: {
      backgroundColor: color,
      borderRadius: '50%',
    },
  };
}

/**
 * Componente VisualizadorTablero
 * 
 * Renderiza un tablero de ajedrez con estilo Lichess, incluyendo:
 * - Colores característicos de Lichess (#f0d9b5 y #b58863)
 * - Highlights de casillas según contexto (error, mejor jugada, último movimiento)
 * - Navegación jugada por jugada
 * - Tamaño responsivo adaptativo
 * - Animaciones suaves (300ms)
 * 
 * **Validaciones:** Requisitos 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 11.1, 11.2, 11.5, 13.1, 13.2, 13.3, 13.4, 13.5
 */
export const VisualizadorTablero = memo(function VisualizadorTablero({
  posiciónFEN,
  orientación = 'white',
  movimientoResaltado,
  tipoResaltado,
  modo = 'partida',
  título,
  evaluación,
}: VisualizadorTableroProps) {
  const estilosResaltado = generarEstilosHighlight(movimientoResaltado, tipoResaltado);

  const formatearEvaluación = (centipawns: number): string => {
    if (Math.abs(centipawns) >= 10000) {
      // Evaluación de mate
      const movimientosParaMate = Math.round(centipawns / 10000);
      return `#${movimientosParaMate}`;
    }
    // Evaluación normal en peones (dividir por 100)
    const peones = (centipawns / 100).toFixed(2);
    return peones.startsWith('-') ? peones : `+${peones}`;
  };

  return (
    <div className="visualizador-tablero" data-modo={modo}>
      {título && (
        <div className="visualizador-tablero__header">
          <h3 className="visualizador-tablero__titulo">{título}</h3>
          {evaluación !== undefined && (
            <div className="visualizador-tablero__evaluacion">
              {formatearEvaluación(evaluación)}
            </div>
          )}
        </div>
      )}

      <div className="visualizador-tablero__contenedor">
        <Chessboard
          options={{
            position: posiciónFEN,
            boardOrientation: orientación,
            squareStyles: estilosResaltado,
            allowDragging: false,
            animationDurationInMs: 300,
            showNotation: true,
            darkSquareStyle: { backgroundColor: '#b58863' },
            lightSquareStyle: { backgroundColor: '#f0d9b5' },
            boardStyle: {
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            },
          }}
        />
      </div>
    </div>
  );
});
