import { useState } from 'react';
import { VisualizadorTablero, Movimiento } from './VisualizadorTablero';

/**
 * Ejemplo 1: Tablero básico sin navegación
 */
export function EjemploBasico() {
  const FEN_INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 1: Tablero Básico</h2>
      <VisualizadorTablero
        posiciónFEN={FEN_INICIAL}
        título="Posición Inicial"
        evaluación={0}
      />
    </div>
  );
}

/**
 * Ejemplo 2: Tablero con highlight de error
 */
export function EjemploHighlightError() {
  const FEN_DESPUES_ERROR = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 5';
  const movimientoError: Movimiento = {
    desde: 'f1',
    hacia: 'c4',
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 2: Tablero con Error Resaltado</h2>
      <p>El movimiento de error (Bc4?) está resaltado en rojo</p>
      <VisualizadorTablero
        posiciónFEN={FEN_DESPUES_ERROR}
        título="Error: Bc4?"
        movimientoResaltado={movimientoError}
        tipoResaltado="error"
        evaluación={-120}
      />
    </div>
  );
}

/**
 * Ejemplo 3: Tablero con mejor jugada resaltada
 */
export function EjemploMejorJugada() {
  const FEN_ANTES_ERROR = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4';
  const mejorJugada: Movimiento = {
    desde: 'd2',
    hacia: 'd3',
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 3: Tablero con Mejor Jugada</h2>
      <p>La mejor jugada alternativa (d3) está resaltada en verde</p>
      <VisualizadorTablero
        posiciónFEN={FEN_ANTES_ERROR}
        título="Mejor alternativa: d3"
        movimientoResaltado={mejorJugada}
        tipoResaltado="mejorJugada"
        evaluación={25}
      />
    </div>
  );
}

/**
 * Ejemplo 4: Tablero con navegación completa
 */
export function EjemploConNavegacion() {
  const posiciones = [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  ];

  const evaluaciones = [0, 50, 45, 35, 30];
  const [jugadaActual, setJugadaActual] = useState(0);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 4: Tablero con Navegación</h2>
      <p>Use los controles para navegar por la partida</p>
      <VisualizadorTablero
        posiciónFEN={posiciones[jugadaActual]}
        título="Partida Ejemplo"
        numeroJugada={jugadaActual}
        totalJugadas={posiciones.length}
        evaluación={evaluaciones[jugadaActual]}
        onCambiarPosición={setJugadaActual}
        orientación="white"
      />
    </div>
  );
}

/**
 * Ejemplo 5: Tablero con orientación negra
 */
export function EjemploOrientacionNegra() {
  const FEN_MEDIO_JUEGO = 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 8';

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 5: Tablero desde Perspectiva Negra</h2>
      <VisualizadorTablero
        posiciónFEN={FEN_MEDIO_JUEGO}
        título="Desde las Negras"
        orientación="black"
        evaluación={-15}
      />
    </div>
  );
}

/**
 * Ejemplo 6: Tablero en modo explicación
 */
export function EjemploModoExplicacion() {
  const FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 5';
  const mejorJugada: Movimiento = { desde: 'd2', hacia: 'd3' };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 6: Modo Explicación</h2>
      <p>Tablero más compacto para mostrar en paneles de explicación</p>
      <VisualizadorTablero
        posiciónFEN={FEN}
        título="Mejor jugada"
        movimientoResaltado={mejorJugada}
        tipoResaltado="mejorJugada"
        modo="explicación"
      />
    </div>
  );
}

/**
 * Ejemplo 7: Evaluación de mate
 */
export function EjemploMate() {
  const FEN_MATE_EN_2 = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1';

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 7: Evaluación de Mate</h2>
      <p>Mate en 2 para las blancas</p>
      <VisualizadorTablero
        posiciónFEN={FEN_MATE_EN_2}
        título="Mate en 2"
        evaluación={20000}
      />
    </div>
  );
}

/**
 * Renderizar todos los ejemplos
 */
export function TodosLosEjemplos() {
  return (
    <div>
      <h1 style={{ textAlign: 'center', padding: '2rem' }}>
        Ejemplos de VisualizadorTablero
      </h1>
      <EjemploBasico />
      <hr />
      <EjemploHighlightError />
      <hr />
      <EjemploMejorJugada />
      <hr />
      <EjemploConNavegacion />
      <hr />
      <EjemploOrientacionNegra />
      <hr />
      <EjemploModoExplicacion />
      <hr />
      <EjemploMate />
    </div>
  );
}
