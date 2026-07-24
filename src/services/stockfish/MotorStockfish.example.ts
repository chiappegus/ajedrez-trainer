/**
 * Ejemplos de uso del MotorStockfish
 * 
 * Este archivo muestra diferentes casos de uso del motor de ajedrez Stockfish
 * ejecutandose en un Web Worker.
 * 
 * Feature: lichess-game-analysis
 */

import { MotorStockfish } from './MotorStockfish';
import type { ResultadoAnalisisStockfish } from './MotorStockfish';

/**
 * Ejemplo 1: Uso basico - Analizar posicion inicial
 */
async function ejemploBasico(): Promise<void> {
  console.log('=== Ejemplo 1: Uso Basico ===');
  
  const motor = new MotorStockfish();
  
  try {
    // Inicializar motor
    console.log('Inicializando Stockfish...');
    await motor.inicializar();
    console.log('Stockfish inicializado');
    
    // Posicion inicial del tablero
    const fenInicial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Analizar con profundidad 15
    console.log('Analizando posicion inicial...');
    const resultado = await motor.analizarPosicion(fenInicial, 15);
    
    console.log('Mejor jugada:', resultado.mejorJugada);
    console.log('Evaluacion:', resultado.evaluacion, 'cp');
    console.log('Profundidad alcanzada:', resultado.profundidad);
    console.log('Tiempo de analisis:', resultado.tiempo, 'ms');
    
  } catch (error) {
    console.error('Error en analisis:', error);
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
        nombre: 'Despues de 1.e4',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      },
      {
        nombre: 'Despues de 1.e4 e5',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
      }
    ];
    
    const resultados: Array<{
      nombre: string;
      resultado: ResultadoAnalisisStockfish;
    }> = [];
    
    for (const posicion of posiciones) {
      console.log(`\nAnalizando: ${posicion.nombre}`);
      const resultado = await motor.analizarPosicion(posicion.fen, 12);
      
      resultados.push({
        nombre: posicion.nombre,
        resultado
      });
      
      console.log(`  Mejor: ${resultado.mejorJugada}, Eval: ${resultado.evaluacion} cp`);
    }
    
    // Calcular cambios de evaluacion
    console.log('\n--- Cambios de Evaluacion ---');
    for (let i = 1; i < resultados.length; i++) {
      const anterior = resultados[i - 1].resultado.evaluacion;
      const actual = resultados[i].resultado.evaluacion;
      const cambio = actual - anterior;
      
      console.log(
        `${resultados[i - 1].nombre} -> ${resultados[i].nombre}: ${cambio > 0 ? '+' : ''}${cambio} cp`
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejemplo 3: Detectar posicion de mate
 */
async function ejemploMate(): Promise<void> {
  console.log('\n=== Ejemplo 3: Deteccion de Mate ===');
  
  const motor = new MotorStockfish();
  
  try {
    await motor.inicializar();
    
    // Mate del pastor (despues de Qxf7#)
    const fenMate = 'rnb1kbnr/pppp1ppp/8/8/4q3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
    
    console.log('Analizando posicion de mate...');
    const resultado = await motor.analizarPosicion(fenMate, 15);
    
    if (resultado.mate !== undefined) {
      console.log(`Mate detectado en ${Math.abs(resultado.mate)} jugadas`);
      console.log(`  (Evaluacion normalizada: ${resultado.evaluacion} cp)`);
    } else {
      console.log('Evaluacion:', resultado.evaluacion, 'cp');
    }
    
    console.log('Mejor respuesta:', resultado.mejorJugada);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejemplo 4: Configuracion avanzada con opciones UCI
 */
async function ejemploConfiguracion(): Promise<void> {
  console.log('\n=== Ejemplo 4: Configuracion Avanzada ===');
  
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
    
    console.log('Analizando con configuracion personalizada...');
    const resultado = await motor.analizarPosicion(fen, 18);
    
    console.log('Mejor jugada:', resultado.mejorJugada);
    console.log('Evaluacion:', resultado.evaluacion, 'cp');
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
      await motor.analizarPosicion('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 15);
    } catch (error) {
      console.log('Error capturado correctamente:', (error as Error).message);
    }
    
    // Ahora inicializar correctamente
    await motor.inicializar();
    console.log('Motor inicializado');
    
    // Analizar posicion valida
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const resultado = await motor.analizarPosicion(fen, 10);
    console.log('Analisis exitoso:', resultado.mejorJugada);
    
    // Intentar analizar dos posiciones simultaneamente
    console.log('\nIntentando analisis simultaneos...');
    const promesa1 = motor.analizarPosicion(fen, 15);
    
    // Esperar un poco e intentar otro analisis
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      await motor.analizarPosicion(fen, 15);
    } catch (error) {
      console.log('Error de analisis simultaneo capturado:', (error as Error).message);
    }
    
    // Esperar el primer analisis
    await promesa1;
    console.log('Primer analisis completado');
    
  } catch (error) {
    console.error('Error inesperado:', error);
  } finally {
    motor.terminar();
  }
}

/**
 * Ejemplo 6: Detener analisis en progreso
 */
async function ejemploDetener(): Promise<void> {
  console.log('\n=== Ejemplo 6: Detener Analisis ===');
  
  const motor = new MotorStockfish();
  
  try {
    await motor.inicializar();
    
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Iniciar analisis con profundidad alta
    console.log('Iniciando analisis profundo...');
    const promesaAnalisis = motor.analizarPosicion(fen, 20);
    
    // Detener despues de 500ms
    setTimeout(() => {
      console.log('Deteniendo analisis...');
      motor.detener();
    }, 500);
    
    try {
      await promesaAnalisis;
    } catch (error) {
      console.log('Analisis detenido:', (error as Error).message);
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

// Nota: Para ejecutar estos ejemplos, importalos en tu codigo y llamalos manualmente
// Ejemplo: import { ejecutarTodosLosEjemplos } from './MotorStockfish.example';
//          ejecutarTodosLosEjemplos();
