/**
 * Servicio para parsear y serializar partidas de ajedrez en formato PGN
 * Feature: lichess-game-analysis
 * Valida: Requisitos 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { Chess } from 'chess.js';
import type { Partida, MetadatosPartida, Jugada } from '../../types/partida';

/**
 * Error personalizado para fallos en el parseo de PGN
 */
export class ErrorParseoPGN extends Error {
  public líneaError?: number;

  constructor(mensaje: string, líneaError?: number) {
    super(
      `Error parseando PGN${líneaError ? ` en línea ${líneaError}` : ''}: ${mensaje}`
    );
    this.name = 'ErrorParseoPGN';
    this.líneaError = líneaError;
  }
}

/**
 * Clase responsable de parsear cadenas PGN en objetos estructurados de partida
 * y serializar objetos Partida de vuelta a formato PGN.
 * 
 * Utiliza chess.js para parsing y validación de la sintaxis PGN estándar.
 */
export class ParserPGN {
  /**
   * Parsea una cadena PGN en un objeto Partida estructurado
   * 
   * @param pgnString - Cadena en formato PGN a parsear
   * @returns Objeto Partida con metadatos y jugadas estructuradas
   * @throws {ErrorParseoPGN} Si el PGN es inválido o tiene errores de sintaxis
   */
  parsear(pgnString: string): Partida {
    if (!pgnString || pgnString.trim().length === 0) {
      throw new ErrorParseoPGN('El PGN está vacío o solo contiene espacios en blanco');
    }

    try {
      const chess = new Chess();
      
      // Cargar el PGN en chess.js para validación y parsing
      // chess.loadPgn() lanza una excepción si el PGN es inválido
      chess.loadPgn(pgnString);

      // Extraer metadatos de los encabezados PGN
      const metadatos = this.extraerMetadatos(chess);

      // Extraer el resultado ANTES de procesar jugadas
      const resultadoPartida = this.extraerResultado(chess, pgnString);

      // Extraer jugadas en formato estructurado
      const jugadas = this.extraerJugadas(chess, pgnString);

      return {
        metadatos,
        jugadas,
        resultado: resultadoPartida
      };

    } catch (error) {
      if (error instanceof ErrorParseoPGN) {
        throw error;
      }
      
      // Error desconocido de chess.js
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      throw new ErrorParseoPGN(`Error al procesar PGN: ${mensajeError}`);
    }
  }

  /**
   * Serializa un objeto Partida de vuelta a formato PGN
   * Útil para round-trip testing
   * 
   * @param partida - Objeto Partida a serializar
   * @returns Cadena en formato PGN
   */
  serializar(partida: Partida): string {
    const líneas: string[] = [];

    // Escribir encabezados PGN
    líneas.push(`[Event "${partida.metadatos.evento}"]`);
    líneas.push(`[Site "${partida.metadatos.sitio}"]`);
    líneas.push(`[Date "${partida.metadatos.fecha}"]`);
    líneas.push(`[White "${partida.metadatos.blancas}"]`);
    líneas.push(`[Black "${partida.metadatos.negras}"]`);
    líneas.push(`[Result "${partida.resultado}"]`);

    // Encabezados opcionales
    if (partida.metadatos.eloBlancas) {
      líneas.push(`[WhiteElo "${partida.metadatos.eloBlancas}"]`);
    }
    if (partida.metadatos.eloNegras) {
      líneas.push(`[BlackElo "${partida.metadatos.eloNegras}"]`);
    }
    if (partida.metadatos.apertura) {
      líneas.push(`[Opening "${partida.metadatos.apertura}"]`);
    }
    if (partida.metadatos.controlTiempo) {
      líneas.push(`[TimeControl "${partida.metadatos.controlTiempo}"]`);
    }

    // Línea vacía entre encabezados y jugadas
    líneas.push('');

    // Escribir jugadas
    const líneasJugadas: string[] = [];
    for (const jugada of partida.jugadas) {
      // Agregar número de jugada para blancas
      if (jugada.turno === 'white') {
        líneasJugadas.push(`${jugada.numeroJugada}.`);
      }

      // Agregar la jugada
      let textoJugada = jugada.jugadaSAN;

      // Agregar anotación si existe
      if (jugada.anotacion) {
        textoJugada += jugada.anotacion;
      }

      líneasJugadas.push(textoJugada);

      // Agregar comentario si existe
      if (jugada.comentario) {
        líneasJugadas.push(`{${jugada.comentario}}`);
      }
    }

    // Unir jugadas con espacios, máximo 80 caracteres por línea
    let líneaActual = '';
    for (const parte of líneasJugadas) {
      if (líneaActual.length + parte.length + 1 > 80) {
        líneas.push(líneaActual.trim());
        líneaActual = parte + ' ';
      } else {
        líneaActual += parte + ' ';
      }
    }
    
    if (líneaActual.trim().length > 0) {
      líneas.push(líneaActual.trim() + ' ' + partida.resultado);
    } else {
      líneas.push(partida.resultado);
    }

    return líneas.join('\n');
  }

  /**
   * Extrae los metadatos del objeto Chess
   */
  private extraerMetadatos(chess: Chess): MetadatosPartida {
    const header = chess.header();

    // Campos obligatorios con valores por defecto
    const metadatos: MetadatosPartida = {
      blancas: header.White || 'Desconocido',
      negras: header.Black || 'Desconocido',
      fecha: header.Date || new Date().toISOString().split('T')[0],
      evento: header.Event || 'Partida casual',
      sitio: header.Site || 'Desconocido'
    };

    // Campos opcionales
    if (header.WhiteElo) {
      const elo = Number.parseInt(header.WhiteElo, 10);
      if (!Number.isNaN(elo)) {
        metadatos.eloBlancas = elo;
      }
    }

    if (header.BlackElo) {
      const elo = Number.parseInt(header.BlackElo, 10);
      if (!Number.isNaN(elo)) {
        metadatos.eloNegras = elo;
      }
    }

    if (header.Opening) {
      metadatos.apertura = header.Opening;
    }

    if (header.TimeControl) {
      metadatos.controlTiempo = header.TimeControl;
    }

    return metadatos;
  }

  /**
   * Extrae las jugadas del objeto Chess en formato estructurado
   */
  private extraerJugadas(chess: Chess, pgnOriginal: string): Jugada[] {
    const jugadas: Jugada[] = [];
    const historial = chess.history({ verbose: true });

    // Crear nueva instancia y cargar PGN para generar FENs
    const chessTemp = new Chess();
    chessTemp.loadPgn(pgnOriginal);

    // Resetear para procesar desde el inicio
    chessTemp.reset();

    for (let i = 0; i < historial.length; i++) {
      const movimiento = historial[i];
      
      // Calcular número de jugada (cada 2 movimientos = 1 jugada completa)
      const numeroJugada = Math.floor(i / 2) + 1;

      const jugada: Jugada = {
        numeroJugada,
        turno: movimiento.color === 'w' ? 'white' : 'black',
        jugadaSAN: movimiento.san,
        jugadaUCI: `${movimiento.from}${movimiento.to}${movimiento.promotion || ''}`,
      };

      // Hacer la jugada para obtener el FEN resultante
      chessTemp.move(movimiento.san);
      jugada.fen = chessTemp.fen();

      // Extraer comentarios si existen (chess.js los incluye en el objeto)
      const moveWithComments = movimiento as any;
      if (moveWithComments.comments && moveWithComments.comments.length > 0) {
        jugada.comentario = moveWithComments.comments[0];
      }

      // Extraer anotaciones de la jugada SAN
      const anotaciones = ['!!', '!?', '?!', '??', '!', '?'] as const;
      for (const anotacion of anotaciones) {
        if (movimiento.san.includes(anotacion)) {
          jugada.anotacion = anotacion;
          break;
        }
      }

      jugadas.push(jugada);
    }

    return jugadas;
  }

  /**
   * Extrae el resultado de la partida desde el string PGN original
   * porque chess.js no preserva el resultado del encabezado después de loadPgn
   */
  private extraerResultado(chess: Chess, pgnOriginal: string): '1-0' | '0-1' | '1/2-1/2' | '*' {
    // Primero intentar desde el encabezado
    const header = chess.header();
    const resultadoHeader = header.Result;

    if (resultadoHeader === '1-0' || resultadoHeader === '0-1' || resultadoHeader === '1/2-1/2' || resultadoHeader === '*') {
      return resultadoHeader;
    }

    // Si el header no tiene resultado válido, buscar en el string PGN original
    // El resultado aparece al final de las jugadas
    const resultadosValidos = ['1-0', '0-1', '1/2-1/2', '*'];
    
    // Buscar de atrás hacia adelante para encontrar el resultado
    const líneas = pgnOriginal.trim().split('\n');
    for (let i = líneas.length - 1; i >= 0; i--) {
      const línea = líneas[i].trim();
      
      for (const resultado of resultadosValidos) {
        if (línea.includes(resultado)) {
          return resultado as '1-0' | '0-1' | '1/2-1/2' | '*';
        }
      }
    }

    // Si no hay resultado definido, usar '*' (partida en curso)
    return '*';
  }
}
