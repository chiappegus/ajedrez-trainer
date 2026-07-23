/**
 * Generador de explicaciones educativas de errores de ajedrez usando IA
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.1, 8.3
 * 
 * Esta clase genera explicaciones en lenguaje natural de errores detectados
 * en partidas de ajedrez, utilizando Groq API con el modelo llama-3.1-8b-instant.
 * Proporciona explicaciones concisas (150 palabras) y extendidas (300 palabras),
 * con fallback a explicaciones básicas cuando Groq API no está disponible.
 */

import type { ClienteGroq, ParámetrosChatCompletion } from '../groq/ClienteGroq';
import type { ErrorDetectado } from '../../types/error';

/**
 * Prompt del sistema para configurar el comportamiento de la IA como entrenador de ajedrez
 * 
 * Este prompt establece el tono, estilo y estructura que debe seguir la IA
 * al generar explicaciones de errores de ajedrez.
 */
const PROMPT_SISTEMA_EXPLICACIONES = `Eres un entrenador de ajedrez educativo y amigable.
Tu tarea es explicar errores en partidas de ajedrez en castellano, de forma clara y concisa.

Para cada error, debes explicar:
1. Qué jugada se realizó
2. Por qué fue un error (consecuencias tácticas/posicionales)
3. Qué se debió jugar en su lugar
4. Qué amenazas o tácticas se pasaron por alto

Usa terminología de ajedrez en español. Mantén un tono educativo y motivador.
Sé conciso pero completo.`;

/**
 * Clase responsable de generar explicaciones educativas de errores de ajedrez
 * 
 * Esta clase utiliza Groq API para generar explicaciones en lenguaje natural
 * adaptadas al contexto específico de cada error. Proporciona dos niveles de
 * explicación (concisa y extendida) y un fallback básico cuando la API no está disponible.
 * 
 * @example
 * ```typescript
 * const cliente = new ClienteGroq('gsk_api_key');
 * const generador = new GeneradorExplicaciones(cliente);
 * 
 * const explicación = await generador.generarExplicaciónConcisa(error);
 * console.log(explicación); // Explicación de ~150 palabras
 * 
 * const explicaciónDetallada = await generador.generarExplicaciónExtendida(error);
 * console.log(explicaciónDetallada); // Explicación de ~300 palabras
 * ```
 */
export class GeneradorExplicaciones {
  private readonly clienteGroq: ClienteGroq;

  /**
   * Crea una nueva instancia del generador de explicaciones
   * 
   * @param clienteGroq - Instancia de ClienteGroq para comunicarse con la API
   */
  constructor(clienteGroq: ClienteGroq) {
    this.clienteGroq = clienteGroq;
  }

  /**
   * Genera una explicación concisa de un error de ajedrez
   * 
   * @param error - Error detectado que se va a explicar
   * @returns Promesa que resuelve con la explicación concisa (máximo 150 palabras)
   * @throws Error si falla la comunicación con Groq API
   * 
   * @remarks
   * Esta explicación está diseñada para proporcionar una comprensión rápida
   * del error sin entrar en detalles tácticos profundos. Ideal para mostrar
   * en la interfaz principal junto a los tableros de ajedrez.
   * 
   * Si la API de Groq falla, este método lanzará un error. El código que llame
   * a este método debe capturar el error y usar generarExplicaciónBásica() como fallback.
   */
  async generarExplicaciónConcisa(error: ErrorDetectado): Promise<string> {
    const prompt = this.construirPromptConciso(error);
    
    const parámetros: ParámetrosChatCompletion = {
      modelo: 'llama-3.1-8b-instant',
      mensajes: [
        {
          rol: 'system',
          contenido: PROMPT_SISTEMA_EXPLICACIONES
        },
        {
          rol: 'user',
          contenido: prompt
        }
      ],
      longitudMáxima: 500, // ~150 palabras en español
      temperatura: 0.7
    };

    const respuesta = await this.clienteGroq.chatCompletion(parámetros);
    return respuesta.choices[0].message.content;
  }

  /**
   * Genera una explicación extendida de un error de ajedrez
   * 
   * @param error - Error detectado que se va a explicar
   * @returns Promesa que resuelve con la explicación extendida (máximo 300 palabras)
   * @throws Error si falla la comunicación con Groq API
   * 
   * @remarks
   * Esta explicación proporciona un análisis táctico más profundo, incluyendo
   * variantes alternativas, consecuencias a medio plazo, y detalles sobre
   * patrones tácticos específicos. Se muestra cuando el usuario hace clic
   * en "Profundizar explicación".
   */
  async generarExplicaciónExtendida(error: ErrorDetectado): Promise<string> {
    const prompt = this.construirPromptExtendido(error);
    
    const parámetros: ParámetrosChatCompletion = {
      modelo: 'llama-3.1-8b-instant',
      mensajes: [
        {
          rol: 'system',
          contenido: PROMPT_SISTEMA_EXPLICACIONES
        },
        {
          rol: 'user',
          contenido: prompt
        }
      ],
      longitudMáxima: 1000, // ~300 palabras en español
      temperatura: 0.7
    };

    const respuesta = await this.clienteGroq.chatCompletion(parámetros);
    return respuesta.choices[0].message.content;
  }

  /**
   * Genera una explicación básica sin usar IA
   * 
   * @param error - Error detectado que se va a explicar
   * @returns Explicación básica generada usando template simple
   * 
   * @remarks
   * Este método se utiliza como fallback cuando Groq API no está disponible,
   * la API key no está configurada, o hay problemas de red. Proporciona
   * información factual básica sobre el error sin análisis táctico profundo.
   * 
   * Esta explicación es siempre confiable y no requiere conexión externa,
   * garantizando que el usuario siempre reciba algún tipo de retroalimentación.
   */
  generarExplicaciónBásica(error: ErrorDetectado): string {
    const turnoStr = error.turno === 'white' ? 'Blancas' : 'Negras';
    const pérdidaStr = error.pérdidaCentipawns.toFixed(0);
    
    return `Jugada ${error.numeroJugada}: ${turnoStr} jugó ${error.jugadaRealizada.jugadaSAN}, perdiendo ${pérdidaStr} centipawns. La mejor jugada era ${error.mejorJugadaSAN}. Esta jugada empeoró significativamente la posición.`;
  }

  /**
   * Construye el prompt para solicitar una explicación concisa
   * 
   * @param error - Error detectado
   * @returns Prompt formateado para enviar a Groq API
   * @private
   */
  private construirPromptConciso(error: ErrorDetectado): string {
    const turnoStr = error.turno === 'white' ? 'Blancas' : 'Negras';
    
    return `Analiza este error de ajedrez:

Posición (FEN): ${error.fenAntes}
Turno: ${turnoStr}
Jugada realizada: ${error.jugadaRealizada.jugadaSAN}
Mejor jugada alternativa: ${error.mejorJugadaSAN}
Pérdida de evaluación: ${error.pérdidaCentipawns} centipawns

Proporciona una explicación educativa en máximo 150 palabras.`;
  }

  /**
   * Construye el prompt para solicitar una explicación extendida
   * 
   * @param error - Error detectado
   * @returns Prompt formateado para enviar a Groq API con más contexto
   * @private
   */
  private construirPromptExtendido(error: ErrorDetectado): string {
    const turnoStr = error.turno === 'white' ? 'Blancas' : 'Negras';
    
    return `Analiza en profundidad este error de ajedrez:

Posición (FEN): ${error.fenAntes}
Turno: ${turnoStr}
Jugada realizada: ${error.jugadaRealizada.jugadaSAN}
Mejor jugada alternativa: ${error.mejorJugadaSAN}
Evaluación antes del error: ${error.evaluaciónAntes} centipawns
Evaluación después del error: ${error.evaluaciónDespués} centipawns
Pérdida de evaluación: ${error.pérdidaCentipawns} centipawns

Proporciona un análisis táctico detallado en máximo 300 palabras, incluyendo:
- Qué amenazas o tácticas se pasaron por alto
- Consecuencias específicas de la jugada errónea
- Por qué la mejor jugada alternativa es superior
- Patrones tácticos relevantes (clavadas, horquillas, rayos X, etc.)`;
  }
}
