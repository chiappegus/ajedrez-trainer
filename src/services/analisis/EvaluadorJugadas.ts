/**
 * EvaluadorJugadas - Wrapper de alto nivel sobre MotorStockfish
 * 
 * Responsabilidad: Evaluar posiciones de ajedrez usando Stockfish
 * 
 * Esta clase gestiona evaluaciones de posiciones, cache de resultados,
 * y proporciona métodos convenientes para evaluar secuencias completas
 * de jugadas.
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 4.1, 4.2
 */

import type { Evaluación } from '../../types/evaluacion';
import type { MotorStockfish } from '../stockfish/MotorStockfish';
import { CacheEvaluaciones } from '../cache/CacheEvaluaciones';

/**
 * Clase principal para evaluar posiciones de ajedrez
 */
export class EvaluadorJugadas {
  private profundidadPorDefecto: number = 15;
  private motor: MotorStockfish;
  private cache: CacheEvaluaciones;

  /**
   * Constructor
   * @param motor Instancia de MotorStockfish para realizar evaluaciones
   * @param limiteCacheMaximo Número máximo de posiciones a cachear (por defecto: 1000)
   */
  constructor(motor: MotorStockfish, limiteCacheMaximo: number = 1000) {
    this.motor = motor;
    this.cache = new CacheEvaluaciones(limiteCacheMaximo);
  }

  /**
   * Establece la profundidad de análisis para futuras evaluaciones
   * @param profundidad Profundidad en plies (medio-movimientos)
   */
  establecerProfundidad(profundidad: number): void {
    if (profundidad < 1) {
      throw new Error('La profundidad debe ser al menos 1');
    }
    if (profundidad > 30) {
      throw new Error('La profundidad máxima es 30');
    }
    this.profundidadPorDefecto = profundidad;
  }

  /**
   * Obtiene la profundidad actualmente configurada
   * @returns Profundidad en plies
   */
  obtenerProfundidad(): number {
    return this.profundidadPorDefecto;
  }

  /**
   * Evalúa una posición de ajedrez
   * Utiliza caché para evitar re-análisis de posiciones repetidas
   * @param fen Posición en notación FEN
   * @param profundidad Profundidad opcional (usa por defecto si no se especifica)
   * @returns Evaluación completa de la posición
   */
  async evaluarPosición(fen: string, profundidad?: number): Promise<Evaluación> {
    const profundidadFinal = profundidad ?? this.profundidadPorDefecto;
    
    // Intentar obtener del caché primero
    const evaluaciónCacheada = this.cache.obtener(fen);
    if (evaluaciónCacheada !== undefined) {
      // Reutilizar evaluación del caché
      return evaluaciónCacheada;
    }

    // Si no está en caché, evaluar con Stockfish
    const tiempoInicio = Date.now();

    // Delegar análisis al motor Stockfish
    const resultadoMotor = await this.motor.analizarPosición(fen, profundidadFinal);

    const tiempoEvaluación = Date.now() - tiempoInicio;

    // Construir objeto Evaluación
    const evaluación: Evaluación = {
      fen,
      centipawns: resultadoMotor.evaluación,
      mate: resultadoMotor.mate,
      mejorJugada: resultadoMotor.mejorJugada,
      mejorJugadaSAN: resultadoMotor.mejorJugadaSAN || resultadoMotor.mejorJugada, // Fallback si no hay SAN
      profundidad: resultadoMotor.profundidad,
      tiempoEvaluación
    };

    // Almacenar en caché para reutilización futura
    this.cache.almacenar(fen, evaluación);

    return evaluación;
  }

  /**
   * Evalúa una secuencia de posiciones FEN
   * @param fens Array de posiciones FEN a evaluar
   * @returns Array de evaluaciones en el mismo orden
   */
  async evaluarSecuencia(fens: string[]): Promise<Evaluación[]> {
    const evaluaciones: Evaluación[] = [];
    let tiempoÚltimoYield = Date.now();

    for (let i = 0; i < fens.length; i++) {
      // Evaluar posición actual
      const evaluación = await this.evaluarPosición(fens[i]);
      evaluaciones.push(evaluación);

      // Yield al hilo principal cada 2 segundos para mantener responsividad
      if (Date.now() - tiempoÚltimoYield > 2000) {
        await new Promise(resolve => setTimeout(resolve, 0));
        tiempoÚltimoYield = Date.now();
      }
    }

    return evaluaciones;
  }

  /**
   * Limpia el caché de evaluaciones
   * Útil para liberar memoria o reiniciar el análisis
   */
  limpiarCache(): void {
    this.cache.limpiar();
  }

  /**
   * Obtiene estadísticas del caché
   * @returns Objeto con información sobre el uso del caché
   */
  obtenerEstadisticasCache(): { tamaño: number; limite: number; utilizacion: number } {
    return this.cache.obtenerEstadisticas();
  }
}
