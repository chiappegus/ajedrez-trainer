/**
 * Tipos relacionados con evaluación de posiciones de ajedrez por Stockfish
 * Feature: lichess-game-analysis
 * Valida: Requisitos 4.1, 4.2, 4.3, 4.4
 */

/**
 * Importar tipos que se usan en las interfaces pero están definidos en otros archivos
 */
import type { Partida } from './partida';
import type { ErrorDetectado, EstadísticasAnálisis } from './error';

/**
 * Evaluación completa de una posición de ajedrez por Stockfish
 */
export interface Evaluación {
  /** Posición evaluada en notación FEN */
  fen: string;
  /** Evaluación en centipawns (positivo = ventaja blancas, negativo = ventaja negras) */
  centipawns: number;
  /** Número de jugadas hasta mate (si la posición es mate forzado) (opcional) */
  mate?: number;
  /** Mejor jugada recomendada por Stockfish en formato UCI (ej: "e2e4") */
  mejorJugada: string;
  /** Mejor jugada en notación algebraica estándar (ej: "e4") */
  mejorJugadaSAN: string;
  /** Profundidad de búsqueda alcanzada por Stockfish (en plies) */
  profundidad: number;
  /** Tiempo que tomó la evaluación en milisegundos */
  tiempoEvaluación: number;
}

/**
 * Resultado completo del análisis de una partida
 */
export interface ResultadoAnálisis {
  /** Objeto de la partida analizada */
  partida: Partida;
  /** Lista de errores significativos detectados */
  erroresDetectados: ErrorDetectado[];
  /** Pérdida promedio en centipawns a lo largo de la partida */
  pérdidaPromedioCentipawns: number;
  /** Número total de jugadas analizadas */
  jugadasAnalizadas: number;
  /** Tiempo total del análisis en milisegundos */
  tiempoTotal: number;
  /** Estadísticas agregadas del análisis */
  estadísticas: EstadísticasAnálisis;
}

