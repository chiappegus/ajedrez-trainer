/**
 * Ejemplos de uso de EvaluadorJugadas
 * Feature: lichess-game-analysis
 * 
 * Este archivo muestra cómo usar la clase EvaluadorJugadas
 * para evaluar posiciones de ajedrez.
 */

import { EvaluadorJugadas } from './EvaluadorJugadas';
import { MotorStockfish } from '../stockfish/MotorStockfish';

/**
 * Ejemplo 1: Configuración básica y evaluación de posición inicial
 */
async function ejemplo1_EvaluacionBasica() {
  // Crear instancia del motor Stockfish
  const motor = new MotorStockfish();
  await motor.inicializar();

  // Crear evaluador con el motor
  const evaluador = new EvaluadorJugadas(motor);

  // Posición inicial del ajedrez
  const fenInicial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // Evaluar posición con profundidad por defecto (15 plies)
  const evaluación = await evaluador.evaluarPosición(fenInicial);

  console.log('Evaluación de posición inicial:');
  console.log(`  Centipawns: ${evaluación.centipawns}`);
  console.log(`  Mejor jugada: ${evaluación.mejorJugadaSAN} (${evaluación.mejorJugada})`);
  console.log(`  Profundidad: ${evaluación.profundidad}`);
  console.log(`  Tiempo: ${evaluación.tiempoEvaluación}ms`);

  motor.detener();
}

/**
 * Ejemplo 2: Cambiar profundidad de análisis
 */
async function ejemplo2_CambiarProfundidad() {
  const motor = new MotorStockfish();
  await motor.inicializar();

  const evaluador = new EvaluadorJugadas(motor);

  // Configurar profundidad más profunda para análisis crítico
  evaluador.establecerProfundidad(20);

  const fenTactico = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

  const evaluación = await evaluador.evaluarPosición(fenTactico);

  console.log('Evaluación con profundidad 20:');
  console.log(`  Centipawns: ${evaluación.centipawns}`);
  console.log(`  Mejor jugada: ${evaluación.mejorJugadaSAN}`);
  console.log(`  Profundidad: ${evaluación.profundidad}`);

  motor.detener();
}

/**
 * Ejemplo 3: Evaluar secuencia de posiciones
 */
async function ejemplo3_EvaluarSecuencia() {
  const motor = new MotorStockfish();
  await motor.inicializar();

  const evaluador = new EvaluadorJugadas(motor);

  // Secuencia de posiciones de una apertura
  const secuenciaFens = [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2'
  ];

  // Evaluar toda la secuencia
  const evaluaciones = await evaluador.evaluarSecuencia(secuenciaFens);

  console.log('Evaluaciones de secuencia:');
  evaluaciones.forEach((eval, index) => {
    console.log(`\nJugada ${index + 1}:`);
    console.log(`  Evaluación: ${eval.centipawns}cp`);
    console.log(`  Mejor jugada: ${eval.mejorJugadaSAN}`);
    console.log(`  Tiempo: ${eval.tiempoEvaluación}ms`);
  });

  motor.detener();
}

/**
 * Ejemplo 4: Detectar cambio de evaluación entre jugadas
 */
async function ejemplo4_DetectarCambioEvaluacion() {
  const motor = new MotorStockfish();
  await motor.inicializar();

  const evaluador = new EvaluadorJugadas(motor);

  // Posición antes de un error
  const fenAntes = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
  
  // Posición después de un error (jugada mala)
  const fenDespues = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPPQPPP/RNB1K2R b KQkq - 5 4';

  const evalAntes = await evaluador.evaluarPosición(fenAntes);
  const evalDespues = await evaluador.evaluarPosición(fenDespues);

  const cambio = evalDespues.centipawns - evalAntes.centipawns;

  console.log('Análisis de cambio de evaluación:');
  console.log(`  Antes: ${evalAntes.centipawns}cp (mejor: ${evalAntes.mejorJugadaSAN})`);
  console.log(`  Después: ${evalDespues.centipawns}cp`);
  console.log(`  Cambio: ${cambio > 0 ? '+' : ''}${cambio}cp`);
  
  if (Math.abs(cambio) >= 100) {
    console.log('  ⚠️  ERROR SIGNIFICATIVO DETECTADO (≥100cp)');
  }

  motor.detener();
}

/**
 * Ejemplo 5: Análisis de posición de mate
 */
async function ejemplo5_PosicionMate() {
  const motor = new MotorStockfish();
  await motor.inicializar();

  const evaluador = new EvaluadorJugadas(motor);

  // Posición con mate en 1
  const fenMate = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1';

  const evaluación = await evaluador.evaluarPosición(fenMate);

  console.log('Análisis de posición de mate:');
  console.log(`  Centipawns: ${evaluación.centipawns}`);
  console.log(`  Mejor jugada: ${evaluación.mejorJugadaSAN}`);
  
  if (evaluación.mate !== undefined) {
    console.log(`  ♔ Mate en ${evaluación.mate} jugadas`);
  }

  motor.detener();
}

/**
 * Ejemplo 6: Uso con diferentes profundidades
 */
async function ejemplo6_ComparacionProfundidades() {
  const motor = new MotorStockfish();
  await motor.inicializar();

  const evaluador = new EvaluadorJugadas(motor);

  const fenComplejo = 'r2qkb1r/pp2nppp/3p4/2pPN1B1/2BnP3/3P4/PPP2PPP/R2bK2R w KQkq - 1 11';

  // Análisis superficial
  evaluador.establecerProfundidad(10);
  const evalSuperficial = await evaluador.evaluarPosición(fenComplejo);

  // Análisis profundo
  evaluador.establecerProfundidad(20);
  const evalProfundo = await evaluador.evaluarPosición(fenComplejo);

  console.log('Comparación de profundidades:');
  console.log(`\nAnálisis superficial (profundidad 10):`);
  console.log(`  Evaluación: ${evalSuperficial.centipawns}cp`);
  console.log(`  Mejor jugada: ${evalSuperficial.mejorJugadaSAN}`);
  console.log(`  Tiempo: ${evalSuperficial.tiempoEvaluación}ms`);
  
  console.log(`\nAnálisis profundo (profundidad 20):`);
  console.log(`  Evaluación: ${evalProfundo.centipawns}cp`);
  console.log(`  Mejor jugada: ${evalProfundo.mejorJugadaSAN}`);
  console.log(`  Tiempo: ${evalProfundo.tiempoEvaluación}ms`);

  motor.detener();
}

// Ejecutar ejemplos (descomenta para probar)
// ejemplo1_EvaluacionBasica();
// ejemplo2_CambiarProfundidad();
// ejemplo3_EvaluarSecuencia();
// ejemplo4_DetectarCambioEvaluacion();
// ejemplo5_PosicionMate();
// ejemplo6_ComparacionProfundidades();

export {
  ejemplo1_EvaluacionBasica,
  ejemplo2_CambiarProfundidad,
  ejemplo3_EvaluarSecuencia,
  ejemplo4_DetectarCambioEvaluacion,
  ejemplo5_PosicionMate,
  ejemplo6_ComparacionProfundidades
};
