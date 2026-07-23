/**
 * Ejemplo de uso de CacheEvaluaciones
 * Feature: lichess-game-analysis
 * 
 * Este archivo demuestra cómo usar el caché de evaluaciones para optimizar
 * el análisis de partidas evitando re-análisis de posiciones repetidas.
 */

import { CacheEvaluaciones } from './CacheEvaluaciones';
import type { Evaluación } from '../../types/evaluacion';

// ============ Ejemplo 1: Uso básico del caché ============

function ejemploUsoBasico() {
  console.log('=== Ejemplo 1: Uso básico del caché ===\n');

  // Crear caché con límite de 100 posiciones
  const cache = new CacheEvaluaciones(100);

  // Crear evaluación de ejemplo
  const fenInicial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const evaluacion: Evaluación = {
    fen: fenInicial,
    centipawns: 25,
    mejorJugada: 'e2e4',
    mejorJugadaSAN: 'e4',
    profundidad: 15,
    tiempoEvaluación: 1500
  };

  // Almacenar evaluación en caché
  cache.almacenar(fenInicial, evaluacion);
  console.log('✓ Evaluación almacenada en caché');

  // Verificar si está en caché
  if (cache.contiene(fenInicial)) {
    console.log('✓ La posición está en caché');
  }

  // Recuperar evaluación del caché
  const evaluacionRecuperada = cache.obtener(fenInicial);
  console.log('✓ Evaluación recuperada:', evaluacionRecuperada?.mejorJugadaSAN);

  // Obtener estadísticas
  const stats = cache.obtenerEstadisticas();
  console.log(`\nEstadísticas del caché:`);
  console.log(`  - Tamaño: ${stats.tamaño}/${stats.limite}`);
  console.log(`  - Utilización: ${stats.utilizacion.toFixed(2)}%`);
}

// ============ Ejemplo 2: Caché con posiciones repetidas ============

function ejemploPosicionesRepetidas() {
  console.log('\n=== Ejemplo 2: Optimización con posiciones repetidas ===\n');

  const cache = new CacheEvaluaciones(50);

  // Simular análisis de una partida con posiciones repetidas
  const posiciones = [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Repetida
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', // Repetida
  ];

  let aciertosCache = 0;
  let fallosCache = 0;

  console.log('Procesando posiciones...\n');

  for (let i = 0; i < posiciones.length; i++) {
    const fen = posiciones[i];
    const evaluacionCacheada = cache.obtener(fen);

    if (evaluacionCacheada) {
      aciertosCache++;
      console.log(`Posición ${i + 1}: ✓ CACHE HIT (reutilizada)`);
    } else {
      fallosCache++;
      console.log(`Posición ${i + 1}: ✗ CACHE MISS (nueva evaluación)`);

      // Simular evaluación y almacenar en caché
      const evaluacion: Evaluación = {
        fen,
        centipawns: Math.floor(Math.random() * 100) - 50,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 1500
      };
      cache.almacenar(fen, evaluacion);
    }
  }

  console.log(`\nResultados:`);
  console.log(`  - Aciertos de caché: ${aciertosCache} (${(aciertosCache / posiciones.length * 100).toFixed(0)}%)`);
  console.log(`  - Fallos de caché: ${fallosCache}`);
  console.log(`  - Ahorro de tiempo estimado: ${aciertosCache * 1.5} segundos\n`);
}

// ============ Ejemplo 3: Estrategia LRU en acción ============

function ejemploEstrategiaLRU() {
  console.log('\n=== Ejemplo 3: Estrategia LRU (Least Recently Used) ===\n');

  // Crear caché con límite pequeño para demostrar LRU
  const cache = new CacheEvaluaciones(3);

  console.log('Caché con límite de 3 posiciones\n');

  // Agregar 3 posiciones
  for (let i = 1; i <= 3; i++) {
    const fen = `posicion${i}`;
    const evaluacion: Evaluación = {
      fen,
      centipawns: i * 10,
      mejorJugada: 'e2e4',
      mejorJugadaSAN: 'e4',
      profundidad: 15,
      tiempoEvaluación: 1000
    };
    cache.almacenar(fen, evaluacion);
    console.log(`✓ Agregada posicion${i} (tamaño: ${cache.obtenerTamaño()})`);
  }

  console.log('\nCaché lleno. Accediendo a posicion1 (actualiza LRU)...');
  cache.obtener('posicion1');
  console.log('✓ posicion1 es ahora la más reciente\n');

  console.log('Agregando posicion4 (debe eliminar posicion2, la más antigua)...');
  const evaluacion4: Evaluación = {
    fen: 'posicion4',
    centipawns: 40,
    mejorJugada: 'e2e4',
    mejorJugadaSAN: 'e4',
    profundidad: 15,
    tiempoEvaluación: 1000
  };
  cache.almacenar('posicion4', evaluacion4);

  console.log('\nPosiciones en caché:');
  console.log(`  - posicion1: ${cache.contiene('posicion1') ? '✓ Presente' : '✗ Eliminada'}`);
  console.log(`  - posicion2: ${cache.contiene('posicion2') ? '✓ Presente' : '✗ Eliminada'}`);
  console.log(`  - posicion3: ${cache.contiene('posicion3') ? '✓ Presente' : '✗ Eliminada'}`);
  console.log(`  - posicion4: ${cache.contiene('posicion4') ? '✓ Presente' : '✗ Eliminada'}\n`);
}

// ============ Ejemplo 4: Gestión del caché en análisis de partidas ============

function ejemploGestionCacheAnalisis() {
  console.log('\n=== Ejemplo 4: Gestión del caché en análisis ===\n');

  const cache = new CacheEvaluaciones(1000);

  // Simular análisis de partida larga
  console.log('Analizando partida de 60 jugadas (120 posiciones)...\n');

  for (let i = 0; i < 120; i++) {
    const fen = `partida1_posicion${i}`;
    const evaluacion: Evaluación = {
      fen,
      centipawns: Math.floor(Math.random() * 200) - 100,
      mejorJugada: 'e2e4',
      mejorJugadaSAN: 'e4',
      profundidad: 15,
      tiempoEvaluación: 1500
    };
    cache.almacenar(fen, evaluacion);
  }

  let stats = cache.obtenerEstadisticas();
  console.log(`Después del primer análisis:`);
  console.log(`  - Posiciones en caché: ${stats.tamaño}`);
  console.log(`  - Utilización: ${stats.utilizacion.toFixed(1)}%\n`);

  // Analizar segunda partida (reutiliza algunas posiciones)
  console.log('Analizando segunda partida (con aperturas similares)...\n');

  let reutilizadas = 0;
  for (let i = 0; i < 100; i++) {
    const fen = i < 20 
      ? `partida1_posicion${i}` // Primeras 20 jugadas idénticas
      : `partida2_posicion${i}`;

    if (cache.contiene(fen)) {
      reutilizadas++;
    } else {
      const evaluacion: Evaluación = {
        fen,
        centipawns: Math.floor(Math.random() * 200) - 100,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 1500
      };
      cache.almacenar(fen, evaluacion);
    }
  }

  stats = cache.obtenerEstadisticas();
  console.log(`Después del segundo análisis:`);
  console.log(`  - Posiciones en caché: ${stats.tamaño}`);
  console.log(`  - Posiciones reutilizadas: ${reutilizadas}`);
  console.log(`  - Tiempo ahorrado: ~${(reutilizadas * 1.5).toFixed(1)}s\n`);

  // Limpiar caché para liberar memoria
  console.log('Limpiando caché...');
  cache.limpiar();
  stats = cache.obtenerEstadisticas();
  console.log(`✓ Caché limpiado (tamaño: ${stats.tamaño})\n`);
}

// ============ Ejemplo 5: Integración con EvaluadorJugadas ============

function ejemploIntegracionEvaluador() {
  console.log('\n=== Ejemplo 5: Uso con EvaluadorJugadas ===\n');

  console.log('Ejemplo de código:');
  console.log(`
// Crear evaluador con caché personalizado
const motorStockfish = new MotorStockfish();
const evaluador = new EvaluadorJugadas(motorStockfish, 1000);

// Primera evaluación - llama a Stockfish
const eval1 = await evaluador.evaluarPosición(fen);
console.log('Primera evaluación: ' + eval1.tiempoEvaluación + 'ms');

// Segunda evaluación de la misma posición - usa caché
const eval2 = await evaluador.evaluarPosición(fen);
console.log('Segunda evaluación (caché): ' + eval2.tiempoEvaluación + 'ms');

// Obtener estadísticas
const stats = evaluador.obtenerEstadisticasCache();
console.log(\`Caché: \${stats.tamaño}/\${stats.limite} (\${stats.utilizacion}%)\`);

// Limpiar caché cuando sea necesario
evaluador.limpiarCache();
  `);
}

// ============ Ejecutar todos los ejemplos ============

export function ejecutarEjemplos() {
  ejemploUsoBasico();
  ejemploPosicionesRepetidas();
  ejemploEstrategiaLRU();
  ejemploGestionCacheAnalisis();
  ejemploIntegracionEvaluador();

  console.log('\n=== Todos los ejemplos completados ===\n');
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ejecutarEjemplos();
}
