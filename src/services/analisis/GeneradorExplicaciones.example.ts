/**
 * Ejemplos de uso de GeneradorExplicaciones
 * Feature: lichess-game-analysis
 * 
 * Este archivo demuestra cómo usar la clase GeneradorExplicaciones para
 * generar explicaciones educativas de errores de ajedrez usando Groq API.
 */

import { GeneradorExplicaciones } from './GeneradorExplicaciones';
import { ClienteGroq } from '../groq/ClienteGroq';
import type { ErrorDetectado } from '../../types/error';

/**
 * Ejemplo 1: Generar explicación concisa de un error
 */
async function ejemploExplicaciónConcisa() {
  // Crear instancia del cliente Groq con API key
  const clienteGroq = new ClienteGroq('gsk_tu_api_key_aqui');
  
  // Crear instancia del generador
  const generador = new GeneradorExplicaciones(clienteGroq);
  
  // Error de ejemplo: sacrificio de dama sin compensación
  const error: ErrorDetectado = {
    numeroJugada: 15,
    turno: 'white',
    fenAntes: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 5',
    jugadaRealizada: {
      numeroJugada: 15,
      turno: 'white',
      jugadaSAN: 'Qxf7??',
      fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNB1K2R b KQkq - 0 5'
    },
    mejorJugada: 'e1g1',
    mejorJugadaSAN: 'O-O',
    evaluaciónAntes: 50,
    evaluaciónDespués: -300,
    pérdidaCentipawns: 350
  };
  
  try {
    // Generar explicación concisa (~150 palabras)
    const explicación = await generador.generarExplicaciónConcisa(error);
    console.log('Explicación concisa:');
    console.log(explicación);
    console.log('\n');
  } catch (errorGroq) {
    // Si falla Groq API, usar explicación básica
    console.log('Groq API no disponible, usando explicación básica:');
    const explicaciónBásica = generador.generarExplicaciónBásica(error);
    console.log(explicaciónBásica);
    console.log('\n');
  }
}

/**
 * Ejemplo 2: Generar explicación extendida de un error
 */
async function ejemploExplicaciónExtendida() {
  const clienteGroq = new ClienteGroq('gsk_tu_api_key_aqui');
  const generador = new GeneradorExplicaciones(clienteGroq);
  
  // Error de ejemplo: perder una pieza por una horquilla
  const error: ErrorDetectado = {
    numeroJugada: 12,
    turno: 'black',
    fenAntes: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQ - 0 7',
    jugadaRealizada: {
      numeroJugada: 12,
      turno: 'black',
      jugadaSAN: 'Nd5?',
      fen: 'r1bq1rk1/ppp2ppp/2np4/2bnp3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 1 8'
    },
    mejorJugada: 'h7h6',
    mejorJugadaSAN: 'h6',
    evaluaciónAntes: -20,
    evaluaciónDespués: 120,
    pérdidaCentipawns: 140
  };
  
  try {
    // Generar explicación extendida (~300 palabras)
    const explicaciónExtendida = await generador.generarExplicaciónExtendida(error);
    console.log('Explicación extendida:');
    console.log(explicaciónExtendida);
    console.log('\n');
  } catch (errorGroq) {
    console.log('Groq API no disponible, usando explicación básica:');
    const explicaciónBásica = generador.generarExplicaciónBásica(error);
    console.log(explicaciónBásica);
    console.log('\n');
  }
}

/**
 * Ejemplo 3: Usar explicación básica sin IA
 */
function ejemploExplicaciónBásica() {
  // No se necesita ClienteGroq para explicación básica
  const clienteGroq = new ClienteGroq('dummy_key');
  const generador = new GeneradorExplicaciones(clienteGroq);
  
  const error: ErrorDetectado = {
    numeroJugada: 20,
    turno: 'white',
    fenAntes: 'r1bq1rk1/ppp2ppp/2n5/3p4/3P4/2N5/PPP2PPP/R1BQ1RK1 w - - 0 10',
    jugadaRealizada: {
      numeroJugada: 20,
      turno: 'white',
      jugadaSAN: 'Qxa4?',
      fen: 'r1bq1rk1/ppp2ppp/2n5/3p4/Q2P4/2N5/PPP2PPP/R1B2RK1 b - - 0 10'
    },
    mejorJugada: 'd1d3',
    mejorJugadaSAN: 'Qd3',
    evaluaciónAntes: 30,
    evaluaciónDespués: -80,
    pérdidaCentipawns: 110
  };
  
  // Generar explicación básica (sin llamada a API)
  const explicaciónBásica = generador.generarExplicaciónBásica(error);
  console.log('Explicación básica (sin IA):');
  console.log(explicaciónBásica);
  console.log('\n');
}

/**
 * Ejemplo 4: Flujo completo con manejo de errores
 */
async function ejemploFlujoCompleto() {
  const API_KEY = process.env.VITE_GROQ_API_KEY || 'dummy_key';
  const clienteGroq = new ClienteGroq(API_KEY);
  const generador = new GeneradorExplicaciones(clienteGroq);
  
  const error: ErrorDetectado = {
    numeroJugada: 18,
    turno: 'white',
    fenAntes: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    jugadaRealizada: {
      numeroJugada: 18,
      turno: 'white',
      jugadaSAN: 'f3?',
      fen: 'rnbqkbnr/pppppppp/8/8/8/5P2/PPPPP1PP/RNBQKBNR b KQkq - 0 1'
    },
    mejorJugada: 'e2e4',
    mejorJugadaSAN: 'e4',
    evaluaciónAntes: 15,
    evaluaciónDespués: -95,
    pérdidaCentipawns: 110
  };
  
  console.log('=== Flujo completo con manejo de errores ===\n');
  
  // Intentar generar explicación concisa
  let explicaciónConcisa: string;
  try {
    explicaciónConcisa = await generador.generarExplicaciónConcisa(error);
    console.log('✓ Explicación concisa generada con IA:');
    console.log(explicaciónConcisa);
    console.log('\n');
  } catch (errorGroq) {
    console.log('✗ Groq API falló, usando fallback básico:');
    explicaciónConcisa = generador.generarExplicaciónBásica(error);
    console.log(explicaciónConcisa);
    console.log('\n');
  }
  
  // Si el usuario hace clic en "Profundizar explicación"
  let explicaciónExtendida: string;
  try {
    explicaciónExtendida = await generador.generarExplicaciónExtendida(error);
    console.log('✓ Explicación extendida generada con IA:');
    console.log(explicaciónExtendida);
    console.log('\n');
  } catch (errorGroq) {
    console.log('✗ Groq API falló para explicación extendida:');
    explicaciónExtendida = generador.generarExplicaciónBásica(error);
    console.log(explicaciónExtendida);
    console.log('\n');
  }
}

/**
 * Ejecutar todos los ejemplos
 */
async function ejecutarEjemplos() {
  console.log('========================================');
  console.log('Ejemplos de GeneradorExplicaciones');
  console.log('========================================\n');
  
  console.log('--- Ejemplo 1: Explicación concisa ---\n');
  await ejemploExplicaciónConcisa();
  
  console.log('--- Ejemplo 2: Explicación extendida ---\n');
  await ejemploExplicaciónExtendida();
  
  console.log('--- Ejemplo 3: Explicación básica ---\n');
  ejemploExplicaciónBásica();
  
  console.log('--- Ejemplo 4: Flujo completo ---\n');
  await ejemploFlujoCompleto();
}

// Descomentar para ejecutar los ejemplos
// ejecutarEjemplos().catch(console.error);
