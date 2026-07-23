/**
 * Tipos relacionados con detección de errores y progreso del análisis
 * Feature: lichess-game-analysis
 * Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5
 */

import type { Jugada } from './partida';

/**
 * Representa un error significativo detectado en la partida (pérdida >= 100 centipawns)
 */
export interface ErrorDetectado {
  /** Número de la jugada donde ocurrió el error */
  numeroJugada: number;
  /** Turno que cometió el error */
  turno: 'white' | 'black';
  /** Posición del tablero antes de la jugada errónea en notación FEN */
  fenAntes: string;
  /** Jugada que se realizó (la que causó el error) */
  jugadaRealizada: Jugada;
  /** Mejor jugada que se debió hacer en formato UCI (ej: "e2e4") */
  mejorJugada: string;
  /** Mejor jugada en notación algebraica estándar (ej: "e4") */
  mejorJugadaSAN: string;
  /** Evaluación de la posición antes de la jugada errónea (en centipawns) */
  evaluaciónAntes: number;
  /** Evaluación después de realizar la jugada errónea (en centipawns) */
  evaluaciónDespués: number;
  /** Magnitud de la pérdida de evaluación causada por el error (siempre >= 100) */
  pérdidaCentipawns: number;
  /** Secuencia de jugadas de la mejor línea (optional) */
  variante?: string[];
  /** Explicación concisa generada por IA (máx 150 palabras) (optional) */
  explicación?: string;
  /** Explicación extendida generada por IA (máx 300 palabras) (optional) */
  explicaciónExtendida?: string;
}

/**
 * Estadísticas agregadas del análisis de la partida
 */
export interface EstadísticasAnálisis {
  /** Número total de jugadas en la partida */
  totalJugadas: number;
  /** Cantidad de errores cometidos por las blancas */
  erroresBlancas: number;
  /** Cantidad de errores cometidos por las negras */
  erroresNegras: number;
  /** Mayor pérdida de centipawns en un solo error */
  mayorPérdida: number;
  /** Número de jugada donde ocurrió la mayor pérdida */
  jugadaMayorPérdida: number;
  /** Evaluación general del rendimiento del jugador */
  rendimientoGeneral: 'excelente' | 'sólido' | 'aceptable' | 'mejorable';
}

/**
 * Información sobre el progreso del análisis en tiempo real
 */
export interface ProgresoAnálisis {
  /** Estado actual del análisis */
  estado: 'inactivo' | 'analizando' | 'pausado' | 'completado' | 'error';
  /** Número de la jugada que se está analizando actualmente */
  jugadaActual: number;
  /** Número total de jugadas a analizar */
  totalJugadas: number;
  /** Cantidad de errores encontrados hasta el momento */
  erroresEncontrados: number;
  /** Tiempo promedio que toma analizar cada jugada (en milisegundos) */
  tiempoPromedioPorJugada: number;
  /** Estimación del tiempo restante para completar el análisis (en milisegundos) */
  tiempoRestanteEstimado: number;
}
