/**
 * MotorStockfish - Wrapper para Stockfish.js con soporte de Web Workers
 * 
 * Esta es una definición de tipo/interfaz stub para permitir que EvaluadorJugadas
 * compile correctamente. La implementación completa se realizará en otra tarea.
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisito 3
 */

/**
 * Resultado del análisis de una posición por Stockfish
 */
export interface ResultadoAnálisisStockfish {
  /** Mejor jugada en formato UCI (ej: "e2e4") */
  mejorJugada: string;
  /** Mejor jugada en formato SAN (ej: "e4") - opcional */
  mejorJugadaSAN?: string;
  /** Evaluación en centipawns (positivo = ventaja blancas) */
  evaluación: number;
  /** Número de jugadas hasta mate (si aplica) */
  mate?: number;
  /** Profundidad de análisis alcanzada */
  profundidad: number;
  /** Número de nodos analizados */
  nodos?: number;
  /** Tiempo de análisis en milisegundos */
  tiempo?: number;
}

/**
 * Clase wrapper para el motor Stockfish
 * 
 * NOTA: Esta es una implementación stub. La implementación completa
 * incluirá integración con Web Worker y comunicación UCI.
 */
export class MotorStockfish {
  /**
   * Inicializa el motor Stockfish
   * @throws Error si la inicialización falla
   */
  async inicializar(): Promise<void> {
    throw new Error('MotorStockfish no implementado aún');
  }

  /**
   * Analiza una posición de ajedrez
   * @param _fen Posición en notación FEN
   * @param _profundidad Profundidad de análisis en plies
   * @returns Resultado del análisis
   */
  async analizarPosición(_fen: string, _profundidad: number): Promise<ResultadoAnálisisStockfish> {
    throw new Error('MotorStockfish.analizarPosición no implementado aún');
  }

  /**
   * Detiene el motor y libera recursos
   */
  detener(): void {
    // Stub
  }
}
