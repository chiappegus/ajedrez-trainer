/**
 * Exportaciones centralizadas de todos los tipos del proyecto
 * Feature: lichess-game-analysis
 */

// Credenciales
export type { 
  Credenciales, 
  CredencialesAlmacenadas, 
  ResultadoValidación 
} from './credenciales';

// Partidas
export type { 
  Partida, 
  MetadatosPartida, 
  Jugada 
} from './partida';

// Evaluación
export type { 
  Evaluación, 
  ResultadoAnálisis 
} from './evaluacion';

// Errores y progreso
export type { 
  ErrorDetectado, 
  EstadísticasAnálisis, 
  ProgresoAnálisis 
} from './error';
