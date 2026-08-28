/**
 * Generador de explicaciones educativas de errores de ajedrez usando IA
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.1, 8.3
 */

import { Chess } from 'chess.js';
import type { ClienteGroq, ParámetrosChatCompletion } from '../groq/ClienteGroq';
import type { ErrorDetectado } from '../../types/error';
import { sanAFigurine } from '../../utils/notacion';

const PROMPT_SISTEMA = `Eres un gran maestro de ajedrez analizando los errores de un estudiante.

REGLAS ESTRICTAS:
- Solo habla de la jugada del estudiante que cometio el error. NO analices la respuesta del oponente.
- Usa notacion figurine Unicode: ♚=Rey, ♛=Dama, ♜=Torre, ♝=Alfil, ♞=Caballo. Peones = solo casilla (e4, d5).
- NO uses letras para piezas (no N, B, Q, R, K). SIEMPRE simbolos Unicode.
- IMPORTANTE: Usa la informacion tactica concreta que te doy sobre la posicion. Menciona las amenazas reales, las piezas atacadas, y los jaques posibles. NO inventes amenazas genericas.
- Se conciso y especifico. Habla de LO QUE PASA en esta posicion exacta, no de principios generales.
- Habla en segunda persona ("jugaste", "debias", "tu posicion").
- Responde en español informal. PROHIBIDO usar la palabra "che".
- Aproximadamente 150-200 palabras.

ESTRUCTURA de tu respuesta:
1. Que amenaza concreta no viste o que debilidad creaste con tu jugada
2. Que puede hacer el rival ahora que antes no podia (consecuencia tactica real)
3. Por que la jugada del motor era mejor (que amenaza crea o que defiende)
4. Consejo especifico para esta situacion`;

/**
 * Extrae informacion tactica de una posicion usando chess.js
 */
function extraerContextoTactico(fen: string): string {
  try {
    const chess = new Chess(fen);
    const info: string[] = [];
    
    // Quien mueve
    const turno = chess.turn() === 'w' ? 'blancas' : 'negras';
    info.push(`Turno de: ${turno}`);
    
    // Jaque
    if (chess.isCheck()) {
      info.push('EL REY ESTA EN JAQUE');
    }
    
    // Movimientos legales disponibles
    const movimientos = chess.moves({ verbose: true });
    info.push(`Movimientos legales disponibles: ${movimientos.length}`);
    
    // Capturas posibles (amenazas inmediatas)
    const capturas = movimientos.filter(m => m.captured);
    if (capturas.length > 0) {
      const capturasDesc = capturas.slice(0, 5).map(m => {
        const pieza = m.piece === 'p' ? '' : m.piece.toUpperCase();
        const capturada = m.captured?.toUpperCase() || '';
        const piezaMap: Record<string, string> = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
        return `${piezaMap[pieza] || ''}${m.from}-${m.to} captura ${piezaMap[capturada] || 'peon'}`;
      });
      info.push(`Capturas posibles: ${capturasDesc.join(', ')}`);
    }
    
    // Jaques posibles
    const jaques = movimientos.filter(m => m.san.includes('+') || m.san.includes('#'));
    if (jaques.length > 0) {
      const jaquesDesc = jaques.slice(0, 3).map(m => sanAFigurine(m.san));
      info.push(`Jaques posibles: ${jaquesDesc.join(', ')}`);
    }
    
    // Jaque mate posible
    const mates = movimientos.filter(m => m.san.includes('#'));
    if (mates.length > 0) {
      info.push('¡¡HAY JAQUE MATE DISPONIBLE!!');
    }
    
    // Piezas en el tablero (material)
    const board = chess.board();
    let materialBlancas = '';
    let materialNegras = '';
    const piezaMap: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    
    for (const fila of board) {
      for (const casilla of fila) {
        if (casilla) {
          if (casilla.color === 'w') {
            materialBlancas += piezaMap[casilla.type] || '';
          } else {
            materialNegras += piezaMap[casilla.type] || '';
          }
        }
      }
    }
    info.push(`Material blancas: ${materialBlancas}`);
    info.push(`Material negras: ${materialNegras}`);
    
    return info.join('\n');
  } catch {
    return 'No se pudo analizar la posicion';
  }
}

/**
 * Extrae amenazas del oponente (que puede hacer el rival DESPUES de tu jugada)
 */
function extraerAmenazasRival(fenDespues: string): string {
  try {
    const chess = new Chess(fenDespues);
    const info: string[] = [];
    
    // Movimientos del rival despues de tu jugada
    const movimientos = chess.moves({ verbose: true });
    
    // Jaque al rey
    if (chess.isCheck()) {
      info.push('Tu rey quedo EN JAQUE despues de tu jugada');
    }
    
    // Capturas que el rival puede hacer (amenazas a tus piezas)
    const capturas = movimientos.filter(m => m.captured);
    if (capturas.length > 0) {
      const piezaMap: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
      const capturasImportantes = capturas
        .filter(m => m.captured && m.captured !== 'p')
        .slice(0, 4)
        .map(m => {
          const atacante = m.piece === 'p' ? 'peon' : (piezaMap[m.piece] || m.piece);
          const victima = piezaMap[m.captured || ''] || 'pieza';
          return `${atacante} puede capturar ${victima} en ${m.to}`;
        });
      if (capturasImportantes.length > 0) {
        info.push(`Amenazas del rival: ${capturasImportantes.join('; ')}`);
      }
    }
    
    // Jaques que puede dar el rival
    const jaques = movimientos.filter(m => m.san.includes('+') || m.san.includes('#'));
    if (jaques.length > 0) {
      const jaquesDesc = jaques.slice(0, 3).map(m => sanAFigurine(m.san));
      info.push(`El rival puede dar jaque con: ${jaquesDesc.join(', ')}`);
    }
    
    // Mate posible
    if (chess.isCheckmate()) {
      info.push('¡¡JAQUE MATE!! Tu jugada permitió mate inmediato');
    }
    
    return info.length > 0 ? info.join('\n') : 'Sin amenazas inmediatas graves';
  } catch {
    return '';
  }
}

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
      modelo: 'llama-3.1-8b-instant',
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
      modelo: 'llama-3.1-8b-instant',
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
   * Construye el prompt principal con contexto tactico
   */
  private construirPrompt(error: ErrorDetectado): string {
    const colorJugador = error.turno === 'white' ? 'blancas' : 'negras';
    const jugadaFigurine = sanAFigurine(error.jugadaRealizada.jugadaSAN);
    const mejorFigurine = sanAFigurine(error.mejorJugadaSAN);
    const perdida = error.pérdidaCentipawns >= 9000 
      ? 'resultó en mate' 
      : `perdio ${Math.round(error.pérdidaCentipawns)} centipawns`;

    // Extraer contexto tactico REAL de la posicion
    const contextoAntes = extraerContextoTactico(error.fenAntes);
    const amenazasDespues = error.jugadaRealizada.fen 
      ? extraerAmenazasRival(error.jugadaRealizada.fen)
      : '';

    return `El estudiante juega con ${colorJugador}.

=== POSICION ANTES DE LA JUGADA ===
FEN: ${error.fenAntes}
${contextoAntes}

=== JUGADA DEL ESTUDIANTE ===
Jugó: ${jugadaFigurine}
Mejor jugada segun motor: ${mejorFigurine}
Resultado: ${perdida}
Evaluacion antes: ${error.evaluaciónAntes} cp → despues: ${error.evaluaciónDespués} cp

=== AMENAZAS DESPUES DE SU JUGADA (lo que el rival puede hacer ahora) ===
${amenazasDespues}

INSTRUCCION: Analiza este error usando la informacion tactica concreta de arriba. Menciona las amenazas REALES y las piezas especificas involucradas. No hables de principios generales como "control del centro" a menos que sea directamente relevante. Enfocate en: que amenaza no vio, que debilidad creo, y por que la jugada del motor resolvia el problema.`;
  }

  /**
   * Construye prompt extendido con contexto tactico
   */
  private construirPromptExtendido(error: ErrorDetectado): string {
    const colorJugador = error.turno === 'white' ? 'blancas' : 'negras';
    const jugadaFigurine = sanAFigurine(error.jugadaRealizada.jugadaSAN);
    const mejorFigurine = sanAFigurine(error.mejorJugadaSAN);

    const contextoAntes = extraerContextoTactico(error.fenAntes);
    const amenazasDespues = error.jugadaRealizada.fen 
      ? extraerAmenazasRival(error.jugadaRealizada.fen)
      : '';

    return `El estudiante juega con ${colorJugador}.

=== POSICION ANTES DE LA JUGADA ===
FEN: ${error.fenAntes}
${contextoAntes}

=== JUGADA DEL ESTUDIANTE ===
Jugó: ${jugadaFigurine}
Mejor jugada segun motor: ${mejorFigurine}
Evaluacion antes: ${error.evaluaciónAntes} cp → despues: ${error.evaluaciónDespués} cp
Perdida: ${Math.round(error.pérdidaCentipawns)} cp

=== AMENAZAS DESPUES DE SU JUGADA ===
${amenazasDespues}

Da un analisis EXTENDIDO (~300 palabras) usando la informacion tactica REAL de arriba:
1. Que amenaza concreta del rival no vio o que debilidad creo con su jugada (usa las piezas especificas)
2. Que puede explotar el rival ahora (menciona las capturas/jaques listados arriba)
3. Por que la jugada del motor era mejor (que defendia o que amenaza creaba)
4. Que patron tactico se aplica aqui (clavada, horquilla, rayos X, descubierta, etc.)
5. Consejo practico para esta situacion especifica

Usa SOLO notacion figurine (♚♛♜♝♞). NO hables de principios generales vagos — se ESPECIFICO con las piezas y casillas.`;
  }
}
