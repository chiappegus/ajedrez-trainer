/**
 * Cliente para comunicarse con la API de Groq
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.1, 8.2
 * 
 * Este cliente se comunica con la API de Groq para generar explicaciones
 * en lenguaje natural de los errores de ajedrez usando el modelo llama-3.1-8b-instant.
 */

/**
 * Endpoint de la API de Groq para completado de chat
 */
const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Rol de un mensaje en la conversación con Groq
 */
export type RolMensaje = 'system' | 'user' | 'assistant';

/**
 * Mensaje individual en una conversación con Groq
 */
export interface Mensaje {
  /** Rol del mensaje: system (instrucciones), user (usuario), o assistant (IA) */
  rol: RolMensaje;
  /** Contenido del mensaje */
  contenido: string;
}

/**
 * Parámetros para realizar una petición de chat completion a Groq
 */
export interface ParámetrosChatCompletion {
  /** Modelo de IA a utilizar (ejemplo: 'llama-3.1-8b-instant') */
  modelo: string;
  /** Lista de mensajes de la conversación */
  mensajes: Mensaje[];
  /** Número máximo de tokens a generar (opcional) */
  longitudMáxima?: number;
  /** Temperatura para controlar la aleatoriedad (0.0 a 2.0, opcional) */
  temperatura?: number;
}

/**
 * Respuesta de la API de Groq a una petición de chat completion
 */
export interface RespuestaGroq {
  /** ID único de la respuesta */
  id: string;
  /** Tipo de objeto (siempre 'chat.completion') */
  object: string;
  /** Timestamp de creación */
  created: number;
  /** Modelo utilizado */
  model: string;
  /** Lista de opciones de respuesta generadas */
  choices: Array<{
    /** Índice de la opción */
    index: number;
    /** Mensaje generado por la IA */
    message: {
      /** Rol del mensaje (siempre 'assistant' en respuestas) */
      role: string;
      /** Contenido generado */
      content: string;
    };
    /** Razón por la que terminó la generación */
    finish_reason: string;
  }>;
  /** Información sobre el uso de tokens */
  usage: {
    /** Tokens usados en el prompt */
    prompt_tokens: number;
    /** Tokens generados en la completación */
    completion_tokens: number;
    /** Total de tokens usados */
    total_tokens: number;
  };
}

/**
 * Cliente para comunicarse con la API de Groq para generación de texto con IA
 * 
 * Este cliente permite generar explicaciones en lenguaje natural de errores de ajedrez
 * utilizando el modelo llama-3.1-8b-instant de Groq.
 * 
 * @example
 * ```typescript
 * const cliente = new ClienteGroq('gsk_mi_api_key');
 * 
 * const respuesta = await cliente.chatCompletion({
 *   modelo: 'llama-3.1-8b-instant',
 *   mensajes: [
 *     { rol: 'system', contenido: 'Eres un entrenador de ajedrez.' },
 *     { rol: 'user', contenido: 'Explica este error...' }
 *   ],
 *   longitudMáxima: 500,
 *   temperatura: 0.7
 * });
 * 
 * console.log(respuesta.choices[0].message.content);
 * ```
 */
export class ClienteGroq {
  private readonly apiKey: string;

  /**
   * Crea una nueva instancia del cliente Groq
   * 
   * @param apiKey - Clave de API de Groq para autenticación
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key de Groq es requerida');
    }
  }

  /**
   * Realiza una petición de chat completion a la API de Groq
   * 
   * @param parámetros - Parámetros de la petición incluyendo modelo, mensajes y configuración
   * @returns Promesa que resuelve con la respuesta de Groq
   * @throws Error si la petición falla o la respuesta es inválida
   * 
   * @example
   * ```typescript
   * const respuesta = await cliente.chatCompletion({
   *   modelo: 'llama-3.1-8b-instant',
   *   mensajes: [
   *     { rol: 'user', contenido: 'Hola' }
   *   ]
   * });
   * ```
   */
  async chatCompletion(parámetros: ParámetrosChatCompletion): Promise<RespuestaGroq> {
    try {
      // Construir el cuerpo de la petición según la API de Groq (formato OpenAI-compatible)
      const body = {
        model: parámetros.modelo,
        messages: parámetros.mensajes.map(m => ({
          role: m.rol,
          content: m.contenido
        })),
        ...(parámetros.longitudMáxima && { max_tokens: parámetros.longitudMáxima }),
        ...(parámetros.temperatura !== undefined && { temperature: parámetros.temperatura })
      };

      // Realizar la petición HTTP POST
      const respuesta = await fetch(GROQ_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      // Manejar respuestas de error HTTP
      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        const mensajeError = errorData.error?.message || 'Error desconocido';
        throw new Error(
          `Error de Groq API: ${respuesta.status} - ${mensajeError}`
        );
      }

      // Parsear y retornar la respuesta exitosa
      const datos = await respuesta.json();
      return datos as RespuestaGroq;

    } catch (error) {
      // Re-lanzar errores de red o parsing
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error inesperado al comunicarse con Groq API: ${error}`);
    }
  }
}
