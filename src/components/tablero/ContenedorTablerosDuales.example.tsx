import { useState } from 'react';
import { ContenedorTablerosDuales } from './ContenedorTablerosDuales';
import { Movimiento } from './VisualizadorTablero';

/**
 * Ejemplo 1: Layout dual básico sin error seleccionado
 */
export function EjemploSinError() {
  const FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 1: Sin Error Seleccionado</h2>
      <p>Muestra solo el tablero de partida y un placeholder</p>
      <ContenedorTablerosDuales
        posiciónPartidaFEN={FEN}
        hayErrorSeleccionado={false}
      />
    </div>
  );
}

/**
 * Ejemplo 2: Layout dual con error detectado
 */
export function EjemploConError() {
  const FEN_ANTES = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4';
  const FEN_DESPUES = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 5';
  
  const movimientoError: Movimiento = { desde: 'f1', hacia: 'c4' };
  const mejorJugada: Movimiento = { desde: 'd2', hacia: 'd3' };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 2: Con Error Detectado</h2>
      <p>Izquierda: Partida real con error (rojo). Derecha: Mejor alternativa (verde)</p>
      <ContenedorTablerosDuales
        posiciónPartidaFEN={FEN_DESPUES}
        posiciónAlternativaFEN={FEN_ANTES}
        movimientoError={movimientoError}
        mejorJugada={mejorJugada}
        evaluaciónDespués={-120}
        evaluaciónAntes={25}
        hayErrorSeleccionado={true}
      />
    </div>
  );
}

/**
 * Ejemplo 3: Layout dual con navegación
 */
export function EjemploConNavegacion() {
  interface Posicion {
    fen: string;
    esError: boolean;
    fenAntes?: string;
    movimientoError?: Movimiento;
    mejorJugada?: Movimiento;
    evalDespues: number;
    evalAntes?: number;
  }

  const posiciones: Posicion[] = [
    {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      esError: false,
      evalDespues: 0,
    },
    {
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      esError: false,
      evalDespues: 50,
    },
    {
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      esError: false,
      evalDespues: 45,
    },
    {
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
      esError: false,
      evalDespues: 35,
    },
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 5',
      esError: true,
      fenAntes: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4',
      movimientoError: { desde: 'f1', hacia: 'c4' },
      mejorJugada: { desde: 'd2', hacia: 'd3' },
      evalDespues: -120,
      evalAntes: 25,
    },
  ];

  const [jugadaActual, setJugadaActual] = useState(4); // Empezar en el error
  const posicionActual = posiciones[jugadaActual];

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 3: Con Navegación</h2>
      <p>Navegue por la partida. La jugada 5 tiene un error detectado.</p>
      <ContenedorTablerosDuales
        posiciónPartidaFEN={posicionActual.fen}
        posiciónAlternativaFEN={posicionActual.fenAntes}
        movimientoError={posicionActual.movimientoError}
        mejorJugada={posicionActual.mejorJugada}
        evaluaciónDespués={posicionActual.evalDespues}
        evaluaciónAntes={posicionActual.evalAntes}
        numeroJugada={jugadaActual}
        totalJugadas={posiciones.length}
        onCambiarPosición={setJugadaActual}
        hayErrorSeleccionado={posicionActual.esError}
      />
    </div>
  );
}

/**
 * Ejemplo 4: Layout dual desde perspectiva negra
 */
export function EjemploOrientacionNegra() {
  const FEN_ANTES = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2P2N2/PP1P1PPP/RNBQKB1R b KQkq - 0 4';
  const FEN_DESPUES = 'r1bqkb1r/pppp2pp/2n2n2/4pp2/4P3/2P2N2/PP1P1PPP/RNBQKB1R w KQkq f6 0 5';
  
  const movimientoError: Movimiento = { desde: 'f7', hacia: 'f5' };
  const mejorJugada: Movimiento = { desde: 'f8', hacia: 'e7' };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 4: Desde Perspectiva Negra</h2>
      <p>Tableros orientados con negras abajo</p>
      <ContenedorTablerosDuales
        posiciónPartidaFEN={FEN_DESPUES}
        posiciónAlternativaFEN={FEN_ANTES}
        movimientoError={movimientoError}
        mejorJugada={mejorJugada}
        evaluaciónDespués={120}
        evaluaciónAntes={-15}
        orientación="black"
        hayErrorSeleccionado={true}
      />
    </div>
  );
}

/**
 * Ejemplo 5: Error grave con grandes cambios de evaluación
 */
export function EjemploErrorGrave() {
  const FEN_ANTES = 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 8';
  const FEN_DESPUES = 'r1bq1rk1/ppp2Bpp/2np1n2/2b1p3/4P3/2NP1N2/PPP2PPP/R1BQK2R b KQ - 0 8';
  
  const movimientoError: Movimiento = { desde: 'c4', hacia: 'f7' };
  const mejorJugada: Movimiento = { desde: 'e1', hacia: 'g1' };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 5: Error Grave</h2>
      <p>Sacrificio de alfil sin compensación (-5.00 peones de pérdida)</p>
      <ContenedorTablerosDuales
        posiciónPartidaFEN={FEN_DESPUES}
        posiciónAlternativaFEN={FEN_ANTES}
        movimientoError={movimientoError}
        mejorJugada={mejorJugada}
        evaluaciónDespués={-480}
        evaluaciónAntes={20}
        numeroJugada={7}
        hayErrorSeleccionado={true}
      />
    </div>
  );
}

/**
 * Ejemplo 6: Múltiples errores en una partida
 */
export function EjemploMultiplesErrores() {
  interface ErrorInfo {
    numeroJugada: number;
    fenDespues: string;
    fenAntes: string;
    movimientoError: Movimiento;
    mejorJugada: Movimiento;
    evalDespues: number;
    evalAntes: number;
  }

  const errores: ErrorInfo[] = [
    {
      numeroJugada: 5,
      fenDespues: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 5',
      fenAntes: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4',
      movimientoError: { desde: 'f1', hacia: 'c4' },
      mejorJugada: { desde: 'd2', hacia: 'd3' },
      evalDespues: -120,
      evalAntes: 25,
    },
    {
      numeroJugada: 8,
      fenDespues: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BNP3/2NP4/PPP2PPP/R1BQ1RK1 b - - 1 8',
      fenAntes: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 7 7',
      movimientoError: { desde: 'f3', hacia: 'd4' },
      mejorJugada: { desde: 'e1', hacia: 'g1' },
      evalDespues: -95,
      evalAntes: 10,
    },
  ];

  const [errorActual, setErrorActual] = useState(0);
  const error = errores[errorActual];

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ejemplo 6: Múltiples Errores</h2>
      <p>
        Mostrando error {errorActual + 1} de {errores.length}
      </p>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setErrorActual((prev) => Math.max(0, prev - 1))}
          disabled={errorActual === 0}
          style={{ marginRight: '0.5rem', padding: '0.5rem 1rem' }}
        >
          ← Error Anterior
        </button>
        <button
          onClick={() => setErrorActual((prev) => Math.min(errores.length - 1, prev + 1))}
          disabled={errorActual === errores.length - 1}
          style={{ padding: '0.5rem 1rem' }}
        >
          Error Siguiente →
        </button>
      </div>
      <ContenedorTablerosDuales
        posiciónPartidaFEN={error.fenDespues}
        posiciónAlternativaFEN={error.fenAntes}
        movimientoError={error.movimientoError}
        mejorJugada={error.mejorJugada}
        evaluaciónDespués={error.evalDespues}
        evaluaciónAntes={error.evalAntes}
        numeroJugada={error.numeroJugada}
        hayErrorSeleccionado={true}
      />
    </div>
  );
}

/**
 * Renderizar todos los ejemplos
 */
export function TodosLosEjemplosDuales() {
  return (
    <div>
      <h1 style={{ textAlign: 'center', padding: '2rem' }}>
        Ejemplos de ContenedorTablerosDuales
      </h1>
      <EjemploSinError />
      <hr style={{ margin: '3rem 0' }} />
      <EjemploConError />
      <hr style={{ margin: '3rem 0' }} />
      <EjemploConNavegacion />
      <hr style={{ margin: '3rem 0' }} />
      <EjemploOrientacionNegra />
      <hr style={{ margin: '3rem 0' }} />
      <EjemploErrorGrave />
      <hr style={{ margin: '3rem 0' }} />
      <EjemploMultiplesErrores />
    </div>
  );
}
