/**
 * Tipos compartidos entre MotorStockfish y stockfish-worker
 * 
 * Feature: lichess-game-analysis
 */

/**
 * Tipos de mensajes que el worker puede recibir del hilo principal
 */
export interface MensajeHaciaTrabajador {
  tipo: 'inicializar' | 'analizar' | 'detener' | 'comando';
  fen?: string;
  profundidad?: number;
  comando?: string;
}

/**
 * Tipos de mensajes que el worker envía al hilo principal
 */
export interface MensajeDesdeWorker {
  tipo: 'listo' | 'resultado' | 'error' | 'info';
  error?: string;
  mejorJugada?: string;
  evaluacion?: number;
  mate?: number;
  profundidad?: number;
  nodos?: number;
  tiempo?: number;
  mensaje?: string;
}
