/**
 * Ejemplos de uso del MotorStockfish
 * 
 * Este archivo muestra diferentes casos de uso del motor de ajedrez Stockfish
 * ejecutándose en un Web Worker.
 * 
 * Feature: lichess-game-analysis
 */

import { MotorStockfish } from './MotorStockfish';
import type { ResultadoAnálisisStockfish } from './MotorStockfish';

/**
 * Ejemplo 1: Uso básico - Analizar posición inicial
 */
async function ejemploBasico(): Promise<void> {
  console.log('=== Ejemplo 1: Uso Básico ===');
  
  const motor = new MotorStockfish();
  
  try {
    // Inicializar motor
    console.log('Inicializando Stockfish...');
    await motor.inicializar();
    console.log('✓ Stockfish inicializado');
    
    // Posición inicial del tablero
    const fenInicial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Analizar con profundidad 15
    console.log('Analizando posición inicial...');
    const resultado = await motor.analizarPosición(fenInicial, 15);
    
    console.log('Mejor jugada:', resultado.mejorJugada);
    console.log('Evaluación:', resultado.evaluación, 'cp');
    console.log('Profundidad alcanzada:', resultado.profundidad);
    console.log('Tiempo de análisis:', resultado.tiempo, 'ms');
    
  } catch (error) {
    console.error('Error en análisis:', error);
  } finally {
    motor.terminar();
    console.log('Motor terminado');
  }
}

/**
 * Ejemplo 2: Analizar secuencia de jugadas
 */
async function ejemploSecuencia(): Promise<void> {
  console.log('\n=== Ejemplo 2: Secuencia de Posiciones ===');
  
  const motor = new MotorStockfish();
  
  try {
    await motor.inicializar();
    
    // Secuencia de FENs representando una apertura
    const posiciones = [
      {
        nombre: 'Inicial',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      },
      {
        nombre: 'Después de 1.e4',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      },
      {
        nombre: 'Después de 1.e4 e5',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
      }
    ];
    
    const resultados: Array<{
      nombre: string;
      resultado: ResultadoAnálisisStockfish;
    }> = [];
    
    for (const posicion of posiciones) {
      console.log(`\nAnalizando: ${posicion.nombre}`);
      const resultado = await motor.analizarPosición(posicion.fen, 12);
      
      resultados.push({
        nombre: posicion.nombre,
        resultado
      });
      
      console.log(`  Mejor: ${resultado.mejorJugada}, Eval: ${resultado.evaluación} cp`);
    }
    
    // Calcular cambios de evaluación
    console.log('\n--- Cambios de Evaluación ---');
    for (let i = 1; i < resultados.length; i++) {
      const anterior = resultados[i - 1].resultado.evaluación;
      const actual = resultados[i].resultado.evaluación;
      const cambio = actual - anterior;
      
      console.log(
        `${resultados[i - 1].nombre} → ${resultados[i].nombre}: ${cambio > 0 ? '+' : ''}${cambio} cp`
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejemplo 3: Detectar posición de mate
 */
async function ejemploMate(): Promise<void> {
  console.log('\n=== Ejemplo 3: Detección de Mate ===');
  
  const motor = new MotorStockfish();
  
  try {
    await motor.inicializar();
    
    // Mate del pastor (después de Qxf7#)
    const fenMate = 'rnb1kbnr/pppp1ppp/8/8/4q3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
    
    console.log('Analizando posición de mate...');
    const resultado = await motor.analizarPosición(fenMate, 15);
    
    if (resultado.mate !== undefined) {
      console.log(`✓ Mate detectado en ${Math.abs(resultado.mate)} jugadas`);
      console.log(`  (Evaluación normalizada: ${resultado.evaluación} cp)`);
    } else {
      console.log('Evaluación:', resultado.evaluación, 'cp');
    }
    
    console.log('Mejor respuesta:', resultado.mejorJugada);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejemplo 4: Configuración avanzada con opciones UCI
 */
async function ejemploConfiguracion(): Promise<void> {
  console.log('\n=== Ejemplo 4: Configuración Avanzada ===');
  
  const motor = new MotorStockfish();
  
  try {
    await motor.inicializar();
    
    // Configurar opciones UCI
    console.log('Configurando motor...');
    motor.enviarComandoUCI('setoption name Threads value 2');
    motor.enviarComandoUCI('setoption name Hash value 128'); // 128 MB
    motor.enviarComandoUCI('setoption name MultiPV value 1');
    
    // Esperar un poco para que se apliquen las opciones
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
    
    console.log('Analizando con configuración personalizada...');
    const resultado = await motor.analizarPosición(fen, 18);
    
    console.log('Mejor jugada:', resultado.mejorJugada);
    console.log('Evaluación:', resultado.evaluación, 'cp');
    console.log('Nodos analizados:', resultado.nodos?.toLocaleString());
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejemplo 5: Manejo de errores y timeouts
 */
async function ejemploManejoerrores(): Promise<void> {
  console.log('\n=== Ejemplo 5: Manejo de Errores ===');
  
  const motor = new MotorStockfish();
  
  try {
    // Intentar analizar sin inicializar
    console.log('Intentando analizar sin inicializar...');
    try {
      await motor.analizarPosición('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 15);
    } catch (error) {
      console.log('✓ Error capturado correctamente:', (error as Error).message);
    }
    
    // Ahora inicializar correctamente
    await motor.inicializar();
    console.log('Motor inicializado');
    
    // Analizar posición válida
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const resultado = await motor.analizarPosición(fen, 10);
    console.log('✓ Análisis exitoso:', resultado.mejorJugada);
    
    // Intentar analizar dos posiciones simultáneamente
    console.log('\nIntentando análisis simultáneos...');
    const promesa1 = motor.analizarPosición(fen, 15);
    
    // Esperar un poco e intentar otro análisis
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      await motor.analizarPosición(fen, 15);
    } catch (error) {
      console.log('✓ Error de análisis simultáneo capturado:', (error as Error).message);
    }
    
    // Esperar el primer análisis
    await promesa1;
    console.log('Primer análisis completado');
    
  } catch (error) {
    console.error('Error inesperado:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejemplo 6: Detener análisis en progreso
 */
async function ejemploDetener(): Promise<void> {
  console.log('\n=== Ejemplo 6: Detener Análisis ===');
  
  const motor = new MotorStockfish();
  
  try {
    await motor.inicializar();
    
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Iniciar análisis con profundidad alta
    console.log('Iniciando análisis profundo...');
    const promesaAnalisis = motor.analizarPosición(fen, 20);
    
    // Detener después de 500ms
    setTimeout(() => {
      console.log('Deteniendo análisis...');
      motor.detener();
    }, 500);
    
    try {
      await promesaAnalisis;
    } catch (error) {
      console.log('✓ Análisis detenido:', (error as Error).message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejecutar todos los ejemplos
 */
async function ejecutarTodosLosEjemplos(): Promise<void> {
  console.log('==========================================');
  console.log('  EJEMPLOS DE USO DE MOTOR STOCKFISH');
  console.log('==========================================');
  
  await ejemploBasico();
  await ejemploSecuencia();
  await ejemploMate();
  await ejemploConfiguracion();
  await ejemploManejoerrores();
  await ejemploDetener();
  
  console.log('\n==========================================');
  console.log('  TODOS LOS EJEMPLOS COMPLETADOS');
  console.log('==========================================');
}

// Exportar funciones para uso individual
export {
  ejemploBasico,
  ejemploSecuencia,
  ejemploMate,
  ejemploConfiguracion,
  ejemploManejoerrores,
  ejemploDetener,
  ejecutarTodosLosEjemplos
};

// Nota: Para ejecutar estos ejemplos, impórtalos en tu código y llámalos manualmente
// Ejemplo: import { ejecutarTodosLosEjemplos } from './MotorStockfish.example';
//          ejecutarTodosLosEjemplos();
