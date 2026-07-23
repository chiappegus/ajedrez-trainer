/**
 * Tipos relacionados con partidas de ajedrez y su representación
 * Feature: lichess-game-analysis
 * Valida: Requisitos 2.1, 2.2, 2.3
 */

/**
 * Representa una partida completa de ajedrez con metadatos y jugadas
 */
export interface Partida {
  /** Información sobre jugadores, evento, fecha, etc. */
  metadatos: MetadatosPartida;
  /** Lista ordenada de todas las jugadas de la partida */
  jugadas: Jugada[];
  /** Resultado final de la partida */
  resultado: '1-0' | '0-1' | '1/2-1/2' | '*';
}

/**
 * Metadatos extraídos de los encabezados PGN
 */
export interface MetadatosPartida {
  /** Nombre del jugador con piezas blancas */
  blancas: string;
  /** Nombre del jugador con piezas negras */
  negras: string;
  /** Fecha de la partida en formato ISO (YYYY-MM-DD) */
  fecha: string;
  /** Nombre del evento o torneo */
  evento: string;
  /** Sitio donde se jugó la partida (ej: "lichess.org") */
  sitio: string;
  /** Nombre de la apertura jugada (opcional) */
  apertura?: string;
  /** Elo/rating de las blancas (opcional) */
  eloBlancas?: number;
  /** Elo/rating de las negras (opcional) */
  eloNegras?: number;
  /** Control de tiempo de la partida (ej: "180+2") (opcional) */
  controlTiempo?: string;
}

/**
 * Representa una jugada individual en la partida
 */
export interface Jugada {
  /** Número de la jugada (1 para primera jugada, 2 para segunda, etc.) */
  numeroJugada: number;
  /** Turno que realizó esta jugada */
  turno: 'white' | 'black';
  /** Jugada en notación algebraica estándar (ej: "Nf3", "O-O", "e4") */
  jugadaSAN: string;
  /** Jugada en formato UCI (ej: "g1f3", "e2e4") (opcional) */
  jugadaUCI?: string;
  /** Comentario asociado a la jugada (opcional) */
  comentario?: string;
  /** Anotación de la jugada (!, !!, ?, ??, !?, ?!) (opcional) */
  anotacion?: '!' | '!!' | '?' | '??' | '!?' | '?!';
  /** Posición resultante después de esta jugada en notación FEN (opcional) */
  fen?: string;
}
