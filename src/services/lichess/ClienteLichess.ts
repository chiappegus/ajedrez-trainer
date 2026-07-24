/**
 * Cliente para comunicación con la API pública de Lichess
 * Feature: lichess-game-analysis
 * Valida: Requisitos 1.1, 1.7
 */

/**
 * Información de cuenta de usuario de Lichess
 */
export interface CuentaLichess {
  /** Identificador único del usuario */
  id: string;
  /** Nombre de usuario */
  username: string;
  /** Ratings por categoría de juego */
  perfs: Record<string, { rating: number }>;
  /** Timestamp de creación de cuenta */
  createdAt: number;
}

/**
 * URL base de la API de Lichess
 */
const LICHESS_BASE_URL = 'https://lichess.org';

/**
 * Endpoints de la API de Lichess utilizados
 */
const ENDPOINTS = {
  /** Endpoint para obtener información de cuenta del usuario autenticado */
  cuenta: '/api/account',
  /** 
   * Endpoint para obtener partidas de un usuario específico
   * @param username - Nombre de usuario de Lichess
   */
  partidasUsuario: (username: string) => `/api/games/user/${username}`,
};

/**
 * Cliente para comunicación con la API pública de Lichess usando Fetch API nativa.
 * Permite validar tokens y obtener partidas del usuario autenticado.
 * 
 * @example
 * ```typescript
 * const cliente = new ClienteLichess('lip_abc123def456');
 * const esValido = await cliente.validarToken();
 * if (esValido) {
 *   const pgn = await cliente.obtenerÚltimaPartida('usuario123');
 * }
 * ```
 */
export class ClienteLichess {
  private token: string;
  private nombreUsuario: string;

  /**
   * Crea una nueva instancia del cliente de Lichess
   * 
   * @param token - Token de API Personal de Lichess (debe empezar con 'lip_')
   * @param nombreUsuario - Nombre de usuario de Lichess (opcional, usado para obtener partidas)
   */
  constructor(token: string, nombreUsuario?: string) {
    this.token = token;
    this.nombreUsuario = nombreUsuario || '';
  }

  /**
   * Valida el token de API realizando una petición de prueba a /api/account
   * 
   * @returns `true` si el token es válido, `false` en caso contrario
   * @throws Error si hay problemas de red no relacionados con autenticación
   */
  async validarToken(): Promise<boolean> {
    try {
      const url = `${LICHESS_BASE_URL}${ENDPOINTS.cuenta}`;
      
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
      });

      return respuesta.ok;
    } catch (error) {
      // Si es timeout o error de red, lanzar error descriptivo
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('La validación del token tardó demasiado. Verifica tu conexión.');
      }
      throw new Error('Error de red al validar token');
    }
  }

  /**
   * Obtiene la información de cuenta del usuario autenticado
   * 
   * @returns Información de la cuenta incluyendo username, ratings y fecha de creación
   * @throws Error si el token es inválido o hay problemas de red
   */
  async obtenerCuentaUsuario(): Promise<CuentaLichess> {
    const url = `${LICHESS_BASE_URL}${ENDPOINTS.cuenta}`;

    const respuesta = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        throw new Error('Token de API inválido o expirado');
      }
      if (respuesta.status === 429) {
        throw new Error('Rate limit excedido. Por favor espera un minuto e intenta de nuevo');
      }
      throw new Error(`Error de API de Lichess: ${respuesta.status}`);
    }

    return respuesta.json();
  }

  /**
   * Obtiene la última partida del usuario en formato PGN
   * 
   * @param nombreUsuario - Nombre de usuario de Lichess (opcional, usa el del constructor si no se proporciona)
   * @returns String PGN de la partida más reciente
   * @throws Error si el usuario no existe, no tiene partidas, o hay problemas de red
   * 
   * @example
   * ```typescript
   * const pgn = await cliente.obtenerÚltimaPartida('hikaru');
   * // Retorna: "1. e4 e5 2. Nf3 Nc6 ..."
   * ```
   */
  async obtenerÚltimaPartida(nombreUsuario?: string, tipoPartida?: string): Promise<string> {
    const usuario = nombreUsuario || this.nombreUsuario;
    
    if (!usuario) {
      throw new Error('Nombre de usuario no proporcionado');
    }

    let url = `${LICHESS_BASE_URL}${ENDPOINTS.partidasUsuario(usuario)}?max=1`;
    if (tipoPartida) {
      url += `&perfType=${tipoPartida}`;
    }
    
    console.log('[DEBUG Lichess] Fetching URL:', url);
    console.log('[DEBUG Lichess] Token starts with:', this.token.substring(0, 8) + '...');

    try {
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/x-chess-pgn',
        },
        signal: AbortSignal.timeout(15000),
      });

      console.log('[DEBUG Lichess] Response status:', respuesta.status);
      console.log('[DEBUG Lichess] Response ok:', respuesta.ok);

      if (!respuesta.ok) {
        if (respuesta.status === 404) {
          throw new Error('Nombre de usuario no encontrado');
        }
        if (respuesta.status === 401) {
          throw new Error('Token de API inválido o expirado');
        }
        if (respuesta.status === 429) {
          throw new Error('Rate limit excedido. Por favor espera un minuto e intenta de nuevo');
        }
        throw new Error(`Error de API de Lichess: ${respuesta.status}`);
      }

      console.log('[DEBUG Lichess] Reading response text...');
      const pgn = await respuesta.text();
      console.log('[DEBUG Lichess] Response text length:', pgn.length);
      console.log('[DEBUG Lichess] PGN (first 200 chars):', pgn.substring(0, 200));

      const pgnTrimmed = pgn.trim();

      if (!pgnTrimmed) {
        throw new Error('No tenés partidas de ese tipo. Probá con otro formato de juego.');
      }

      console.log('[DEBUG Lichess] PGN obtenido exitosamente');
      return pgnTrimmed;
    } catch (error) {
      console.error('[DEBUG Lichess] FETCH ERROR:', error);
      console.error('[DEBUG Lichess] Error name:', (error as Error).name);
      console.error('[DEBUG Lichess] Error message:', (error as Error).message);
      throw error;
    }
  }
}
