/**
 * Detector de errores significativos en partidas de ajedrez
 * Feature: lichess-game-analysis
 * Valida: Requisitos 5.1, 5.2
 */

import type { Evaluación } from '../../types/evaluacion';
import type { ErrorDetectado } from '../../types/error';
import type { Jugada } from '../../types/partida';

/**
 * Umbral mínimo de pérdida de evaluación para considerar un error como significativo
 * Valor expresado en centipawns (100 centipawns = 1 peón)
 */
const UMBRAL_ERROR = 100;

/**
 * Clase responsable de identificar errores significativos en las jugadas de una partida
 * 
 * Un error significativo se define como una jugada que causa una pérdida de evaluación
 * de al menos 100 centipawns desde la perspectiva del jugador que realiza la jugada.
 */
export class DetectorErrores {
  /**
   * Detecta si una jugada constituye un error significativo comparando las evaluaciones
   * antes y después de la jugada
   * 
   * @param evaluaciónAnterior - Evaluación de la posición antes de realizar la jugada
   * @param evaluaciónActual - Evaluación de la posición después de realizar la jugada
   * @param jugada - Información de la jugada realizada
   * @param numeroJugada - Número de la jugada en la partida (empezando desde 1)
   * @returns Un objeto ErrorDetectado si se detectó un error, null en caso contrario
   * 
   * @remarks
   * La lógica de detección considera la perspectiva del jugador:
   * - Para blancas: evaluación positiva es ventaja, negativa es desventaja
   * - Para negras: evaluación negativa es ventaja (se invierte la lógica)
   * 
   * Las primeras 3 jugadas se ignoran ya que corresponden a teoría de apertura
   * donde las "pérdidas" no representan errores conceptuales del jugador.
   */
  detectarError(
    evaluaciónAnterior: Evaluación,
    evaluaciónActual: Evaluación,
    jugada: Jugada,
    numeroJugada: number
  ): ErrorDetectado | null {
    // Ignorar primeras 3 jugadas (teoría de apertura)
    if (numeroJugada <= 3) {
      return null;
    }

    // Calcular cambio de evaluación desde la perspectiva del jugador
    // Para blancas: valores positivos son buenos, así que queremos que evalDespués > evalAntes
    // Para negras: valores negativos son buenos, así que queremos que evalDespués < evalAntes
    const cambio = jugada.turno === 'white'
      ? evaluaciónActual.centipawns - evaluaciónAnterior.centipawns  // Blancas: positivo es bueno
      : evaluaciónAnterior.centipawns - evaluaciónActual.centipawns; // Negras: negativo es bueno (invertimos)

    // Si el cambio es negativo y supera el umbral, es un error significativo
    const pérdida = -cambio; // Convertir a valor positivo para facilitar comparación
    
    if (pérdida >= UMBRAL_ERROR) {
      return {
        numeroJugada,
        turno: jugada.turno,
        fenAntes: evaluaciónAnterior.fen,
        jugadaRealizada: jugada,
        mejorJugada: evaluaciónAnterior.mejorJugada,
        mejorJugadaSAN: evaluaciónAnterior.mejorJugadaSAN,
        evaluaciónAntes: evaluaciónAnterior.centipawns,
        evaluaciónDespués: evaluaciónActual.centipawns,
        pérdidaCentipawns: pérdida
      };
    }

    return null;
  }

  /**
   * Filtra una lista de errores para excluir aquellos que ocurrieron en las primeras 3 jugadas
   * 
   * @param errores - Lista de errores detectados
   * @returns Lista filtrada sin errores de las jugadas 1-3
   * 
   * @remarks
   * Este método existe como utilidad adicional, aunque detectarError() ya implementa
   * el filtrado en origen. Puede ser útil para casos donde se procesen errores
   * que provienen de fuentes externas.
   */
  filtrarPrimerasTresJugadas(errores: ErrorDetectado[]): ErrorDetectado[] {
    return errores.filter(error => error.numeroJugada > 3);
  }
}
