/**
 * Generador de explicaciones educativas de errores de ajedrez usando IA
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.1, 8.3
 */

import type { ClienteGroq, ParámetrosChatCompletion } from '../groq/ClienteGroq';
import type { ErrorDetectado } from '../../types/error';
import { sanAFigurine } from '../../utils/notacion';

const PROMPT_SISTEMA = `Eres un gran maestro de ajedrez analizando los errores de un estudiante.

REGLAS ESTRICTAS:
- Solo habla de la jugada del estudiante que cometio el error. NO analices la respuesta del oponente.
- Usa notacion figurine Unicode para las piezas: ♚=Rey, ♛=Dama, ♜=Torre, ♝=Alfil, ♞=Caballo. Los peones se escriben solo con la casilla (ej: e4, d5).
- NO uses letras para las piezas (no escribas N, B, Q, R, K). SIEMPRE usa los simbolos Unicode.
- Se conciso y preciso. No inventes variantes que no puedas verificar.
- Habla en segunda persona ("jugaste", "debias", "tu posicion").
- Responde en español informal, usando segunda persona ("jugaste", "debías", "tu posición"). PROHIBIDO usar la palabra "che" en cualquier parte del texto.
- Aproximadamente 150-200 palabras.

ESTRUCTURA de tu respuesta:
1. Que hiciste mal y por que es un error
2. Que consecuencia inmediata tiene en la posicion
3. Cual era la jugada correcta y por que es mejor
4. Un consejo practico breve`;

/**
 * Clase responsable de generar explicaciones educativas de errores de ajedrez
 */
export class GeneradorExplicaciones {
  private readonly clienteGroq: ClienteGroq;

  constructor(clienteGroq: ClienteGroq) {
    this.clienteGroq = clienteGroq;
  }

  /**
   * Genera una explicacion concisa de un error de ajedrez (~200 palabras)
   */
  async generarExplicaciónConcisa(error: ErrorDetectado): Promise<string> {
    const prompt = this.construirPrompt(error);
    
    const parametros: ParámetrosChatCompletion = {
      modelo: 'llama-3.3-70b-versatile',
      mensajes: [
        { rol: 'system', contenido: PROMPT_SISTEMA },
        { rol: 'user', contenido: prompt }
      ],
      longitudMáxima: 800,
      temperatura: 0.6
    };

    const respuesta = await this.clienteGroq.chatCompletion(parametros);
    return respuesta.choices[0].message.content;
  }

  /**
   * Genera una explicacion extendida (~300 palabras)
   */
  async generarExplicaciónExtendida(error: ErrorDetectado): Promise<string> {
    const prompt = this.construirPromptExtendido(error);
    
    const parametros: ParámetrosChatCompletion = {
      modelo: 'llama-3.3-70b-versatile',
      mensajes: [
        { rol: 'system', contenido: PROMPT_SISTEMA },
        { rol: 'user', contenido: prompt }
      ],
      longitudMáxima: 1200,
      temperatura: 0.6
    };

    const respuesta = await this.clienteGroq.chatCompletion(parametros);
    return respuesta.choices[0].message.content;
  }

  /**
   * Genera una explicacion basica sin usar IA (fallback)
   */
  generarExplicaciónBásica(error: ErrorDetectado): string {
    const jugadaFigurine = sanAFigurine(error.jugadaRealizada.jugadaSAN);
    const mejorFigurine = sanAFigurine(error.mejorJugadaSAN);
    const perdida = error.pérdidaCentipawns >= 9000 
      ? 'mate' 
      : `${Math.round(error.pérdidaCentipawns)} cp`;
    
    return `En la jugada ${error.numeroJugada} jugaste ${jugadaFigurine}, perdiendo ${perdida}. La mejor jugada era ${mejorFigurine}. Esta jugada empeoró significativamente tu posición.`;
  }

  /**
   * Construye el prompt principal
   */
  private construirPrompt(error: ErrorDetectado): string {
    const colorJugador = error.turno === 'white' ? 'blancas' : 'negras';
    const jugadaFigurine = sanAFigurine(error.jugadaRealizada.jugadaSAN);
    const mejorFigurine = sanAFigurine(error.mejorJugadaSAN);
    const perdida = error.pérdidaCentipawns >= 9000 
      ? 'resultó en mate' 
      : `perdio ${Math.round(error.pérdidaCentipawns)} centipawns`;

    return `El estudiante juega con ${colorJugador}.

Posicion antes de la jugada (FEN): ${error.fenAntes}
Jugada del estudiante: ${jugadaFigurine}
Mejor jugada segun el motor: ${mejorFigurine}
Resultado: ${perdida}
Evaluacion antes: ${error.evaluaciónAntes} cp
Evaluacion despues: ${error.evaluaciónDespués} cp

Analiza SOLO el error del estudiante. No hables de lo que hizo el oponente despues. Explica por que ${jugadaFigurine} fue un error y por que ${mejorFigurine} era mejor.`;
  }

  /**
   * Construye prompt extendido para analisis mas profundo
   */
  private construirPromptExtendido(error: ErrorDetectado): string {
    const colorJugador = error.turno === 'white' ? 'blancas' : 'negras';
    const jugadaFigurine = sanAFigurine(error.jugadaRealizada.jugadaSAN);
    const mejorFigurine = sanAFigurine(error.mejorJugadaSAN);

    return `El estudiante juega con ${colorJugador}.

Posicion antes de la jugada (FEN): ${error.fenAntes}
Jugada del estudiante: ${jugadaFigurine}
Mejor jugada segun el motor: ${mejorFigurine}
Evaluacion antes: ${error.evaluaciónAntes} cp
Evaluacion despues: ${error.evaluaciónDespués} cp
Perdida: ${Math.round(error.pérdidaCentipawns)} cp

Da un analisis EXTENDIDO (~300 palabras) SOLO del error del estudiante:
1. Que amenazas o recursos tacticos tenia disponibles que no vio
2. Por que la jugada que eligio es mala (debilidades que crea)
3. Por que la alternativa del motor es claramente superior
4. Que principio posicional o tactico se violó
5. Como evitar este tipo de error en el futuro

Usa SOLO notacion figurine (♚♛♜♝♞) para referirte a las piezas. NO uses letras.`;
  }
}
