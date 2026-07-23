/**
 * Ejemplo de uso de AnalizadorPartida
 * Feature: lichess-game-analysis
 * 
 * Este archivo muestra cómo usar la clase AnalizadorPartida para
 * analizar partidas de Lichess de forma completa.
 */

import { AnalizadorPartida } from './AnalizadorPartida';
import { ClienteLichess } from '../lichess/ClienteLichess';
import { ParserPGN } from '../parseo/ParserPGN';
import { EvaluadorJugadas } from './EvaluadorJugadas';
import { DetectorErrores } from './DetectorErrores';
import { GeneradorExplicaciones } from './GeneradorExplicaciones';
import { ClienteGroq } from '../groq/ClienteGroq';
import { MotorStockfish } from '../stockfish/MotorStockfish';

/**
 * Ejemplo 1: Análisis completo de una partida
 */
async function ejemploAnálisisCompleto() {
  // 1. Configurar dependencias
  const clienteLichess = new ClienteLichess('lip_tu_token_aqui', 'tu_usuario');
  const parser = new ParserPGN();
  const motor = new MotorStockfish();
  await motor.inicializar();
  const evaluador = new EvaluadorJugadas(motor);
  const detector = new DetectorErrores();
  const clienteGroq = new ClienteGroq('gsk_tu_api_key_aqui');
  const generador = new GeneradorExplicaciones(clienteGroq);

  // 2. Crear analizador
  const analizador = new AnalizadorPartida(
    clienteLichess,
    parser,
    evaluador,
    detector,
    generador
  );

  // 3. Iniciar análisis
  console.log('Iniciando análisis de partida...');
  const resultado = await analizador.iniciarAnálisis('tu_usuario');

  // 4. Mostrar resultados
  console.log(`\n=== RESULTADO DEL ANÁLISIS ===`);
  console.log(`Partida: ${resultado.partida.metadatos.blancas} vs ${resultado.partida.metadatos.negras}`);
  console.log(`Jugadas analizadas: ${resultado.jugadasAnalizadas}`);
  console.log(`Errores detectados: ${resultado.erroresDetectados.length}`);
  console.log(`Pérdida promedio: ${resultado.pérdidaPromedioCentipawns.toFixed(2)} centipawns`);
  console.log(`Rendimiento general: ${resultado.estadísticas.rendimientoGeneral}`);
  console.log(`Tiempo de análisis: ${(resultado.tiempoTotal / 1000).toFixed(2)}s`);

  // 5. Mostrar errores detectados
  if (resultado.erroresDetectados.length > 0) {
    console.log(`\n=== ERRORES DETECTADOS ===`);
    for (const error of resultado.erroresDetectados) {
      console.log(`\nJugada ${error.numeroJugada} (${error.turno === 'white' ? 'Blancas' : 'Negras'})`);
      console.log(`  Jugada realizada: ${error.jugadaRealizada.jugadaSAN}`);
      console.log(`  Mejor jugada: ${error.mejorJugadaSAN}`);
      console.log(`  Pérdida: ${error.pérdidaCentipawns} centipawns`);
      console.log(`  Explicación: ${error.explicación}`);
    }
  }

  // 6. Mostrar estadísticas
  console.log(`\n=== ESTADÍSTICAS ===`);
  console.log(`Total jugadas: ${resultado.estadísticas.totalJugadas}`);
  console.log(`Errores blancas: ${resultado.estadísticas.erroresBlancas}`);
  console.log(`Errores negras: ${resultado.estadísticas.erroresNegras}`);
  console.log(`Mayor pérdida: ${resultado.estadísticas.mayorPérdida} cp (jugada ${resultado.estadísticas.jugadaMayorPérdida})`);
}

/**
 * Ejemplo 2: Monitoreo de progreso en tiempo real
 */
async function ejemploMonitoreoProgreso() {
  // Configurar (igual que ejemplo 1)
  const clienteLichess = new ClienteLichess('lip_tu_token_aqui', 'tu_usuario');
  const parser = new ParserPGN();
  const motor = new MotorStockfish();
  await motor.inicializar();
  const evaluador = new EvaluadorJugadas(motor);
  const detector = new DetectorErrores();
  const clienteGroq = new ClienteGroq('gsk_tu_api_key_aqui');
  const generador = new GeneradorExplicaciones(clienteGroq);

  const analizador = new AnalizadorPartida(
    clienteLichess,
    parser,
    evaluador,
    detector,
    generador
  );

  // Iniciar análisis sin await
  const análisisPromise = analizador.iniciarAnálisis('tu_usuario');

  // Monitorear progreso cada 500ms
  const intervalo = setInterval(() => {
    const progreso = analizador.obtenerProgreso();
    
    const porcentaje = progreso.totalJugadas > 0 
      ? ((progreso.jugadaActual / progreso.totalJugadas) * 100).toFixed(1)
      : 0;
    
    const tiempoRestanteS = (progreso.tiempoRestanteEstimado / 1000).toFixed(0);

    console.log(`Progreso: ${porcentaje}% | Jugada ${progreso.jugadaActual}/${progreso.totalJugadas} | Errores: ${progreso.erroresEncontrados} | Tiempo restante: ${tiempoRestanteS}s`);

    if (progreso.estado === 'completado' || progreso.estado === 'error') {
      clearInterval(intervalo);
    }
  }, 500);

  // Esperar resultado final
  const resultado = await análisisPromise;
  clearInterval(intervalo);

  console.log('\n¡Análisis completado!');
  console.log(`Total errores: ${resultado.erroresDetectados.length}`);
}

/**
 * Ejemplo 3: Pausa y reanudación de análisis
 */
async function ejemploPausaReanudación() {
  // Configurar
  const clienteLichess = new ClienteLichess('lip_tu_token_aqui', 'tu_usuario');
  const parser = new ParserPGN();
  const motor = new MotorStockfish();
  await motor.inicializar();
  const evaluador = new EvaluadorJugadas(motor);
  const detector = new DetectorErrores();
  const clienteGroq = new ClienteGroq('gsk_tu_api_key_aqui');
  const generador = new GeneradorExplicaciones(clienteGroq);

  const analizador = new AnalizadorPartida(
    clienteLichess,
    parser,
    evaluador,
    detector,
    generador
  );

  // Iniciar análisis
  const análisisPromise = analizador.iniciarAnálisis('tu_usuario');

  // Pausar después de 3 segundos
  setTimeout(() => {
    console.log('Pausando análisis...');
    analizador.pausarAnálisis();
    
    const progreso = analizador.obtenerProgreso();
    console.log(`Estado: ${progreso.estado}`);
    console.log(`Jugada actual: ${progreso.jugadaActual}`);
  }, 3000);

  // Reanudar después de 5 segundos más
  setTimeout(() => {
    console.log('Reanudando análisis...');
    analizador.reanudarAnálisis();
    
    const progreso = analizador.obtenerProgreso();
    console.log(`Estado: ${progreso.estado}`);
  }, 8000);

  // Esperar resultado
  const resultado = await análisisPromise;
  console.log('Análisis completado después de pausa/reanudación');
}

/**
 * Ejemplo 4: Manejo de errores
 */
async function ejemploManejoErrores() {
  const clienteLichess = new ClienteLichess('token_invalido', 'usuario_invalido');
  const parser = new ParserPGN();
  const motor = new MotorStockfish();
  await motor.inicializar();
  const evaluador = new EvaluadorJugadas(motor);
  const detector = new DetectorErrores();
  const clienteGroq = new ClienteGroq('api_key_invalida');
  const generador = new GeneradorExplicaciones(clienteGroq);

  const analizador = new AnalizadorPartida(
    clienteLichess,
    parser,
    evaluador,
    detector,
    generador
  );

  try {
    await analizador.iniciarAnálisis('usuario_inexistente');
  } catch (error) {
    console.error('Error durante análisis:', error);
    
    const progreso = analizador.obtenerProgreso();
    console.log(`Estado final: ${progreso.estado}`);
  }
}

// Descomentar para ejecutar ejemplos
// ejemploAnálisisCompleto();
// ejemploMonitoreoProgreso();
// ejemploPausaReanudación();
// ejemploManejoErrores();
