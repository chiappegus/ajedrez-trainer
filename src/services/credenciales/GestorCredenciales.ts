/**
 * Gestor de credenciales para Lichess y Groq API
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1, 0.2, 0.4
 */

import type { Credenciales, CredencialesAlmacenadas, ResultadoValidación } from '../../types/credenciales';

/**
 * Clave de localStorage para almacenar credenciales
 */
const CLAVE_CREDENCIALES = 'ajedrez_trainer_credenciales_v1';

/**
 * Gestor de credenciales del usuario para acceso a Lichess y Groq APIs
 * 
 * Responsabilidades:
 * - Almacenar y recuperar credenciales en localStorage
 * - Encriptar tokens usando Base64 (btoa/atob)
 * - Validar formato y contenido de credenciales
 * - Gestionar ciclo de vida de credenciales
 */
export class GestorCredenciales {
  /**
   * Carga las credenciales almacenadas en localStorage
   * @returns Credenciales desencriptadas o null si no existen
   */
  cargarCredenciales(): Credenciales | null {
    try {
      const credencialesJSON = localStorage.getItem(CLAVE_CREDENCIALES);
      
      if (!credencialesJSON) {
        return null;
      }
      
      const almacenadas: CredencialesAlmacenadas = JSON.parse(credencialesJSON);
      
      // Desencriptar tokens
      return {
        nombreUsuario: almacenadas.nombreUsuario,
        username: almacenadas.nombreUsuario, // Alias para compatibilidad
        tokenLichess: this.desencriptarToken(almacenadas.tokenLichessEncriptado),
        apiKeyGroq: this.desencriptarToken(almacenadas.apiKeyGroqEncriptada)
      };
    } catch (error) {
      console.error('Error al cargar credenciales:', error);
      return null;
    }
  }

  /**
   * Guarda las credenciales en localStorage con encriptación
   * @param credenciales Credenciales a almacenar
   */
  guardarCredenciales(credenciales: Credenciales): void {
    // Validar antes de guardar
    const resultadoValidación = this.validarCredenciales(credenciales);
    if (!resultadoValidación.válido) {
      throw new Error(resultadoValidación.error || 'Credenciales inválidas');
    }

    const almacenadas: CredencialesAlmacenadas = {
      version: 1,
      nombreUsuario: credenciales.nombreUsuario,
      tokenLichessEncriptado: this.encriptarToken(credenciales.tokenLichess),
      apiKeyGroqEncriptada: this.encriptarToken(credenciales.apiKeyGroq),
      fechaAlmacenamiento: Date.now()
    };

    localStorage.setItem(CLAVE_CREDENCIALES, JSON.stringify(almacenadas));
  }

  /**
   * Elimina las credenciales almacenadas en localStorage
   */
  limpiarCredenciales(): void {
    localStorage.removeItem(CLAVE_CREDENCIALES);
  }

  /**
   * Verifica si existen credenciales configuradas
   * @returns true si existen credenciales almacenadas
   */
  verificarExistenciaConfiguracion(): boolean {
    const credenciales = this.cargarCredenciales();
    return credenciales !== null;
  }

  /**
   * Valida que las credenciales cumplan con todos los requisitos
   * 
   * Validaciones realizadas:
   * - Campos no vacíos (username, tokenLichess, apiKeyGroq)
   * - Formato de username (alfanumérico, guiones, guiones bajos)
   * - Token Lichess empiece con "lip_"
   * 
   * @param credenciales Credenciales a validar
   * @returns Resultado de validación con indicador válido/inválido y mensaje de error descriptivo
   */
  validarCredenciales(credenciales: Credenciales): ResultadoValidación {
    // Validar que el objeto no sea null o undefined
    if (!credenciales) {
      return {
        válido: false,
        error: 'Las credenciales no pueden estar vacías'
      };
    }

    // Validar nombre de usuario no vacío
    if (!credenciales.nombreUsuario || credenciales.nombreUsuario.trim() === '') {
      return {
        válido: false,
        error: 'El nombre de usuario es requerido'
      };
    }

    // Validar token Lichess no vacío
    if (!credenciales.tokenLichess || credenciales.tokenLichess.trim() === '') {
      return {
        válido: false,
        error: 'El token de Lichess es requerido'
      };
    }

    // Validar API Key Groq no vacía
    if (!credenciales.apiKeyGroq || credenciales.apiKeyGroq.trim() === '') {
      return {
        válido: false,
        error: 'La API Key de Groq es requerida'
      };
    }

    // Validar formato de username (alfanumérico, guiones, guiones bajos)
    const regexUsername = /^[a-zA-Z0-9_-]+$/;
    if (!regexUsername.test(credenciales.nombreUsuario)) {
      return {
        válido: false,
        error: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'
      };
    }

    // Validar que el token Lichess empiece con "lip_"
    if (!credenciales.tokenLichess.startsWith('lip_')) {
      return {
        válido: false,
        error: 'El token de Lichess debe empezar con "lip_". Verifica que lo hayas copiado correctamente.'
      };
    }

    // Todas las validaciones pasaron
    return {
      válido: true
    };
  }

  /**
   * Encripta un token usando Base64
   * 
   * NOTA: Esta es encriptación básica usando btoa(). Para producción,
   * considerar usar Web Crypto API para encriptación real.
   * 
   * @param token Token a encriptar
   * @returns Token encriptado en Base64
   */
  private encriptarToken(token: string): string {
    return btoa(token);
  }

  /**
   * Desencripta un token desde Base64
   * @param tokenEncriptado Token encriptado en Base64
   * @returns Token original
   */
  private desencriptarToken(tokenEncriptado: string): string {
    return atob(tokenEncriptado);
  }
}
