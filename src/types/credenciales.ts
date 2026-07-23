/**
 * Tipos relacionados con credenciales de Lichess y Groq API
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1, 0.2
 */

/**
 * Credenciales del usuario para acceder a Lichess y Groq APIs
 */
export interface Credenciales {
  /** Nombre de usuario de Lichess */
  nombreUsuario: string;
  /** Token de API Personal de Lichess (debe empezar con 'lip_') */
  tokenLichess: string;
  /** Clave de API de Groq para generar explicaciones con IA */
  apiKeyGroq: string;
}

/**
 * Estructura de credenciales almacenadas en localStorage con encriptación
 */
export interface CredencialesAlmacenadas {
  /** Versión del formato de almacenamiento (para futuras migraciones) */
  version: number;
  /** Nombre de usuario de Lichess (texto plano, no es información sensible) */
  nombreUsuario: string;
  /** Token de Lichess encriptado usando btoa() */
  tokenLichessEncriptado: string;
  /** API Key de Groq encriptada usando btoa() */
  apiKeyGroqEncriptada: string;
  /** Timestamp de cuándo se almacenaron las credenciales */
  fechaAlmacenamiento: number;
}

/**
 * Resultado de validación de credenciales o token
 */
export interface ResultadoValidación {
  /** Indica si la validación fue exitosa */
  válido: boolean;
  /** Mensaje de error descriptivo si la validación falló */
  error?: string;
}
