/**
 * Ejemplo de uso de DetectorErrores
 * Feature: lichess-game-analysis
 * 
 * Este archivo muestra cómo utilizar la clase DetectorErrores
 * para identificar errores significativos en una partida de ajedrez.
 */

import { DetectorErrores } from './DetectorErrores';
import type { Evaluación } from '../../types/evaluacion';
import type { Jugada } from '../../types/partida';

// Crear una instancia del detector
const detector = new DetectorErrores();

// Ejemplo 1: Error de las blancas (pierde material)
console.log('=== Ejemplo 1: Error de las blancas ===');

const evaluaciónAntes1: Evaluación = {
  fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  centipawns: 20,
  mejorJugada: 'e4d5',
  mejorJugadaSAN: 'exd5',
  profundidad: 15,
  tiempoEvaluación: 1200
};

const evaluaciónDespués1: Evaluación = {
  fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/7P/PPPP1PP1/RNBQKBNR b KQkq - 0 2',
  centipawns: -180,
  mejorJugada: 'd5e4',
  mejorJugadaSAN: 'dxe4',
  profundidad: 15,
  tiempoEvaluación: 1300
};

const jugada1: Jugada = {
  numeroJugada: 5,
  turno: 'white',
  jugadaSAN: 'h3?',
  jugadaUCI: 'h2h3',
  fen: evaluaciónDespués1.fen
};

const error1 = detector.detectarError(evaluaciónAntes1, evaluaciónDespués1, jugada1, 5);

if (error1) {
  console.log(`Error detectado en jugada ${error1.numeroJugada}`);
  console.log(`Turno: ${error1.turno}`);
  console.log(`Jugada realizada: ${error1.jugadaRealizada.jugadaSAN}`);
  console.log(`Mejor jugada: ${error1.mejorJugadaSAN}`);
  console.log(`Pérdida: ${error1.pérdidaCentipawns} centipawns`);
} else {
  console.log('No se detectó error');
}

// Ejemplo 2: Error de las negras
console.log('\n=== Ejemplo 2: Error de las negras ===');

const evaluaciónAntes2: Evaluación = {
  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  centipawns: -30,
  mejorJugada: 'e7e5',
  mejorJugadaSAN: 'e5',
  profundidad: 15,
  tiempoEvaluación: 1100
};

const evaluaciónDespués2: Evaluación = {
  fen: 'rnbqkbnr/pppppp1p/6p1/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  centipawns: 150,
  mejorJugada: 'd2d4',
  mejorJugadaSAN: 'd4',
  profundidad: 15,
  tiempoEvaluación: 1250
};

const jugada2: Jugada = {
  numeroJugada: 6,
  turno: 'black',
  jugadaSAN: 'g6?',
  jugadaUCI: 'g7g6',
  fen: evaluaciónDespués2.fen
};

const error2 = detector.detectarError(evaluaciónAntes2, evaluaciónDespués2, jugada2, 6);

if (error2) {
  console.log(`Error detectado en jugada ${error2.numeroJugada}`);
  console.log(`Turno: ${error2.turno}`);
  console.log(`Jugada realizada: ${error2.jugadaRealizada.jugadaSAN}`);
  console.log(`Mejor jugada: ${error2.mejorJugadaSAN}`);
  console.log(`Pérdida: ${error2.pérdidaCentipawns} centipawns`);
} else {
  console.log('No se detectó error');
}

// Ejemplo 3: No hay error (jugada razonable)
console.log('\n=== Ejemplo 3: Jugada correcta (sin error) ===');

const evaluaciónAntes3: Evaluación = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  centipawns: 15,
  mejorJugada: 'e2e4',
  mejorJugadaSAN: 'e4',
  profundidad: 15,
  tiempoEvaluación: 1000
};

const evaluaciónDespués3: Evaluación = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1',
  centipawns: 20,
  mejorJugada: 'e7e5',
  mejorJugadaSAN: 'e5',
  profundidad: 15,
  tiempoEvaluación: 1050
};

const jugada3: Jugada = {
  numeroJugada: 8,
  turno: 'white',
  jugadaSAN: 'Nf3',
  jugadaUCI: 'g1f3',
  fen: evaluaciónDespués3.fen
};

const error3 = detector.detectarError(evaluaciónAntes3, evaluaciónDespués3, jugada3, 8);

if (error3) {
  console.log(`Error detectado en jugada ${error3.numeroJugada}`);
  console.log(`Pérdida: ${error3.pérdidaCentipawns} centipawns`);
} else {
  console.log('No se detectó error - jugada correcta ✓');
}

// Ejemplo 4: Jugadas de apertura ignoradas
console.log('\n=== Ejemplo 4: Jugadas de apertura (1-3) ignoradas ===');

const evaluaciónAntes4: Evaluación = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  centipawns: 0,
  mejorJugada: 'e2e4',
  mejorJugadaSAN: 'e4',
  profundidad: 15,
  tiempoEvaluación: 1000
};

const evaluaciónDespués4: Evaluación = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/7P/PPPPPPP1/RNBQKBNR b KQkq - 0 1',
  centipawns: -200, // Gran pérdida
  mejorJugada: 'e7e5',
  mejorJugadaSAN: 'e5',
  profundidad: 15,
  tiempoEvaluación: 1100
};

const jugada4: Jugada = {
  numeroJugada: 1,
  turno: 'white',
  jugadaSAN: 'h3',
  jugadaUCI: 'h2h3',
  fen: evaluaciónDespués4.fen
};

const error4 = detector.detectarError(evaluaciónAntes4, evaluaciónDespués4, jugada4, 1);

if (error4) {
  console.log(`Error detectado en jugada ${error4.numeroJugada}`);
} else {
  console.log('Jugada de apertura ignorada (jugada 1) ✓');
}
