import { VisualizadorTablero } from './VisualizadorTablero';
import type { Movimiento, TipoResaltado } from './VisualizadorTablero';
import './ContenedorTablerosDuales.css';

/**
 * Props del componente ContenedorTablerosDuales
 */
export interface ContenedorTablerosDualesProps {
  /** Posición FEN del tablero de la partida real (después del error) */
  posiciónPartidaFEN: string;
  /** Posición FEN del tablero de alternativa (antes del error) */
  posiciónAlternativaFEN?: string;
  /** Movimiento que causó el error (para highlight rojo) */
  movimientoError?: Movimiento;
  /** Mejor jugada alternativa (para highlight verde) */
  mejorJugada?: Movimiento;
  /** Orientación de los tableros */
  orientación?: 'white' | 'black';
  /** Número de jugada actual */
  numeroJugada?: number;
  /** Total de jugadas disponibles */
  totalJugadas?: number;
  /** Evaluación después del error (tablero partida) */
  evaluaciónDespués?: number;
  /** Evaluación antes del error (tablero alternativa) */
  evaluaciónAntes?: number;
  /** Callback cuando se cambia de posición en la navegación */
  onCambiarPosición?: (numeroPosición: number) => void;
  /** Si hay un error seleccionado para mostrar el segundo tablero */
  hayErrorSeleccionado?: boolean;
}

/**
 * Componente ContenedorTablerosDuales
 * 
 * Muestra dos tableros de ajedrez lado a lado (o apilados en móvil):
 * 1. Tablero izquierdo/superior: Partida real con jugada de error resaltada en rojo
 * 2. Tablero derecho/inferior: Alternativa con mejor jugada resaltada en verde
 * 
 * **Características:**
 * - Layout responsive: vertical en móvil (<768px), horizontal en desktop (>=768px)
 * - Sincronización de navegación entre ambos tableros
 * - Highlights diferenciados por contexto
 * - Segundo tablero oculto cuando no hay error seleccionado
 * 
 * **Validaciones:** Requisitos 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 11.1, 11.2, 11.3
 */
export function ContenedorTablerosDuales({
  posiciónPartidaFEN,
  posiciónAlternativaFEN,
  movimientoError,
  mejorJugada,
  orientación = 'white',
  numeroJugada,
  totalJugadas,
  evaluaciónDespués,
  evaluaciónAntes,
  onCambiarPosición,
  hayErrorSeleccionado = false,
}: ContenedorTablerosDualesProps) {
  return (
    <div className="contenedor-tableros-duales">
      {/* Tablero de la partida real */}
      <div className="contenedor-tableros-duales__tablero">
        <VisualizadorTablero
          posiciónFEN={posiciónPartidaFEN}
          orientación={orientación}
          movimientoResaltado={movimientoError}
          tipoResaltado="error"
          numeroJugada={numeroJugada}
          totalJugadas={totalJugadas}
          onCambiarPosición={onCambiarPosición}
          modo="partida"
          título={
            numeroJugada !== undefined
              ? `Partida Real - Jugada ${numeroJugada + 1}`
              : 'Partida Real'
          }
          evaluación={evaluaciónDespués}
        />
      </div>

      {/* Tablero de la alternativa (solo visible si hay error seleccionado) */}
      {hayErrorSeleccionado && posiciónAlternativaFEN && (
        <div className="contenedor-tableros-duales__tablero">
          <VisualizadorTablero
            posiciónFEN={posiciónAlternativaFEN}
            orientación={orientación}
            movimientoResaltado={mejorJugada}
            tipoResaltado="mejorJugada"
            modo="explicación"
            título="Mejor Alternativa"
            evaluación={evaluaciónAntes}
          />
        </div>
      )}

      {/* Mensaje cuando no hay error seleccionado */}
      {!hayErrorSeleccionado && (
        <div className="contenedor-tableros-duales__placeholder">
          <div className="contenedor-tableros-duales__placeholder-contenido">
            <p className="contenedor-tableros-duales__placeholder-titulo">
              Navegue a una jugada con error
            </p>
            <p className="contenedor-tableros-duales__placeholder-texto">
              Aquí se mostrará la mejor alternativa con highlight verde
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
