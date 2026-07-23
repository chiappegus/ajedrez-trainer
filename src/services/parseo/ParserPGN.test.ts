/**
 * Pruebas unitarias para ParserPGN
 * Feature: lichess-game-analysis
 * Valida: Requisitos 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import { ParserPGN, ErrorParseoPGN } from './ParserPGN';

describe('ParserPGN', () => {
  const parser = new ParserPGN();

  describe('parsear - Casos válidos', () => {
    it('debe parsear un PGN simple con metadatos básicos', () => {
      const pgn = `[Event "Partida de prueba"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Jugador1"]
[Black "Jugador2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0`;

      const partida = parser.parsear(pgn);

      expect(partida.metadatos.evento).toBe('Partida de prueba');
      expect(partida.metadatos.sitio).toBe('lichess.org');
      expect(partida.metadatos.fecha).toBe('2024.01.15');
      expect(partida.metadatos.blancas).toBe('Jugador1');
      expect(partida.metadatos.negras).toBe('Jugador2');
      expect(partida.resultado).toBe('1-0');
    });

    it('debe extraer la secuencia de jugadas en notación SAN', () => {
      const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *`;

      const partida = parser.parsear(pgn);

      expect(partida.jugadas).toHaveLength(6);
      expect(partida.jugadas[0].jugadaSAN).toBe('e4');
      expect(partida.jugadas[0].turno).toBe('white');
      expect(partida.jugadas[0].numeroJugada).toBe(1);
      expect(partida.jugadas[1].jugadaSAN).toBe('e5');
      expect(partida.jugadas[1].turno).toBe('black');
      expect(partida.jugadas[1].numeroJugada).toBe(1);
      expect(partida.jugadas[2].jugadaSAN).toBe('Nf3');
      expect(partida.jugadas[2].turno).toBe('white');
      expect(partida.jugadas[2].numeroJugada).toBe(2);
    });

    it('debe extraer metadatos opcionales (ELO, apertura, control de tiempo)', () => {
      const pgn = `[Event "Rated Blitz"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Usuario1"]
[Black "Usuario2"]
[Result "1/2-1/2"]
[WhiteElo "1850"]
[BlackElo "1820"]
[Opening "Ruy Lopez"]
[TimeControl "180+2"]

1. e4 e5 1/2-1/2`;

      const partida = parser.parsear(pgn);

      expect(partida.metadatos.eloBlancas).toBe(1850);
      expect(partida.metadatos.eloNegras).toBe(1820);
      expect(partida.metadatos.apertura).toBe('Ruy Lopez');
      expect(partida.metadatos.controlTiempo).toBe('180+2');
    });

    it('debe generar FEN para cada posición resultante', () => {
      const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 *`;

      const partida = parser.parsear(pgn);

      expect(partida.jugadas[0].fen).toBeDefined();
      expect(partida.jugadas[0].fen).toMatch(/[rnbqkpRNBQKP]/); // Verificar que es un FEN válido
      expect(partida.jugadas[1].fen).toBeDefined();
    });

    it('debe extraer jugadas UCI correctamente', () => {
      const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 *`;

      const partida = parser.parsear(pgn);

      expect(partida.jugadas[0].jugadaUCI).toBe('e2e4');
      expect(partida.jugadas[1].jugadaUCI).toBe('e7e5');
      expect(partida.jugadas[2].jugadaUCI).toBe('g1f3');
    });

    it('debe soportar enroque corto', () => {
      const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 *`;

      const partida = parser.parsear(pgn);

      const enroqueBlanco = partida.jugadas.find(j => j.jugadaSAN === 'O-O');

      expect(enroqueBlanco).toBeDefined();
      expect(enroqueBlanco?.turno).toBe('white');
    });

    it('debe manejar todos los tipos de resultado válidos', () => {
      const resultados: Array<'1-0' | '0-1' | '1/2-1/2' | '*'> = ['1-0', '0-1', '1/2-1/2', '*'];

      for (const resultado of resultados) {
        const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "${resultado}"]

1. e4 e5 ${resultado}`;

        const partida = parser.parsear(pgn);
        expect(partida.resultado).toBe(resultado);
      }
    });
  });

  describe('parsear - Casos inválidos', () => {
    it('debe rechazar PGN vacío', () => {
      expect(() => parser.parsear('')).toThrow(ErrorParseoPGN);
      expect(() => parser.parsear('   ')).toThrow(ErrorParseoPGN);
      expect(() => parser.parsear('\n\n')).toThrow(ErrorParseoPGN);
    });

    it('debe rechazar PGN con sintaxis inválida', () => {
      const pgnInválido = 'Este no es un PGN válido';
      
      expect(() => parser.parsear(pgnInválido)).toThrow(ErrorParseoPGN);
    });

    it('debe rechazar PGN con jugada ilegal', () => {
      const pgnInválido = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Zz9 *`;

      expect(() => parser.parsear(pgnInválido)).toThrow(ErrorParseoPGN);
    });

    it('debe incluir mensaje descriptivo en el error', () => {
      try {
        parser.parsear('texto inválido');
        expect.fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(ErrorParseoPGN);
        if (error instanceof ErrorParseoPGN) {
          expect(error.message).toContain('Error parseando PGN');
        }
      }
    });
  });

  describe('serializar', () => {
    it('debe serializar una partida simple a formato PGN', () => {
      const pgn = `[Event "Test Event"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Blancas"]
[Black "Negras"]
[Result "1-0"]

1. e4 e5 2. Nf3 1-0`;

      const partida = parser.parsear(pgn);
      const pgnSerializado = parser.serializar(partida);

      expect(pgnSerializado).toContain('[Event "Test Event"]');
      expect(pgnSerializado).toContain('[White "Blancas"]');
      expect(pgnSerializado).toContain('[Black "Negras"]');
      expect(pgnSerializado).toContain('1. e4');
      expect(pgnSerializado).toContain('1-0');
    });

    it('debe incluir metadatos opcionales en la serialización', () => {
      const pgn = `[Event "Rated Blitz"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Usuario1"]
[Black "Usuario2"]
[Result "*"]
[WhiteElo "1850"]
[BlackElo "1820"]
[Opening "Sicilian Defense"]
[TimeControl "180+2"]

1. e4 c5 *`;

      const partida = parser.parsear(pgn);
      const pgnSerializado = parser.serializar(partida);

      expect(pgnSerializado).toContain('[WhiteElo "1850"]');
      expect(pgnSerializado).toContain('[BlackElo "1820"]');
      expect(pgnSerializado).toContain('[Opening "Sicilian Defense"]');
      expect(pgnSerializado).toContain('[TimeControl "180+2"]');
    });
  });

  describe('Round-trip (parsear + serializar)', () => {
    it('debe preservar la estructura de la partida en round-trip', () => {
      const pgnOriginal = `[Event "Test Game"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Player1"]
[Black "Player2"]
[Result "1/2-1/2"]
[WhiteElo "1500"]
[BlackElo "1520"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1/2-1/2`;

      const partida = parser.parsear(pgnOriginal);
      const pgnSerializado = parser.serializar(partida);
      const partidaRound = parser.parsear(pgnSerializado);

      // Verificar metadatos
      expect(partidaRound.metadatos.evento).toBe(partida.metadatos.evento);
      expect(partidaRound.metadatos.blancas).toBe(partida.metadatos.blancas);
      expect(partidaRound.metadatos.negras).toBe(partida.metadatos.negras);
      expect(partidaRound.metadatos.eloBlancas).toBe(partida.metadatos.eloBlancas);
      expect(partidaRound.metadatos.eloNegras).toBe(partida.metadatos.eloNegras);

      // Verificar jugadas
      expect(partidaRound.jugadas).toHaveLength(partida.jugadas.length);
      for (let i = 0; i < partida.jugadas.length; i++) {
        expect(partidaRound.jugadas[i].jugadaSAN).toBe(partida.jugadas[i].jugadaSAN);
        expect(partidaRound.jugadas[i].turno).toBe(partida.jugadas[i].turno);
        expect(partidaRound.jugadas[i].numeroJugada).toBe(partida.jugadas[i].numeroJugada);
      }

      // Verificar resultado
      expect(partidaRound.resultado).toBe(partida.resultado);
    });
  });

  describe('Casos especiales', () => {
    it('debe manejar PGN con encabezados mínimos', () => {
      const pgnMínimo = `[Event "?"]
[Site "?"]
[Date "????.??.??"]
[White "?"]
[Black "?"]
[Result "*"]

1. e4 *`;

      const partida = parser.parsear(pgnMínimo);

      expect(partida.metadatos).toBeDefined();
      expect(partida.jugadas).toHaveLength(1);
    });

    it('debe manejar promoción de peón', () => {
      // Partida simple y corta con promoción verificada
      const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. a4 h5 2. a5 h4 3. a6 h3 4. axb7 hxg2 5. bxa8=Q gxh1=Q *`;

      const partida = parser.parsear(pgn);

      // Buscar las promociones en las jugadas
      const promociones = partida.jugadas.filter(j => j.jugadaSAN.includes('='));
      expect(promociones.length).toBe(2);
      expect(promociones[0].jugadaSAN).toBe('bxa8=Q');
      expect(promociones[1].jugadaSAN).toBe('gxh1=Q');
    });

    it('debe asignar valores por defecto cuando faltan encabezados', () => {
      // chess.js maneja PGN sin encabezados
      const pgnSinEncabezados = '1. e4 e5 2. Nf3 *';

      const partida = parser.parsear(pgnSinEncabezados);

      expect(partida.metadatos.blancas).toBeDefined();
      expect(partida.metadatos.negras).toBeDefined();
      expect(partida.metadatos.evento).toBeDefined();
      expect(partida.metadatos.sitio).toBeDefined();
      expect(partida.jugadas).toHaveLength(3);
    });
  });

  describe('Verificación Requisitos Específicos - Tareas 7.2, 7.3, 7.4', () => {
    describe('7.2 - Generación de FEN para cada jugada', () => {
      it('debe generar FEN para TODAS las jugadas de una partida completa', () => {
        const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *`;

        const partida = parser.parsear(pgn);

        // Verificar que TODAS las jugadas tienen FEN
        expect(partida.jugadas).toHaveLength(10);
        for (const jugada of partida.jugadas) {
          expect(jugada.fen).toBeDefined();
          expect(jugada.fen).not.toBe('');
          expect(jugada.fen).toMatch(/^[rnbqkpRNBQKP1-8\/\s]+\s[wb]\s[KQkq-]+\s[a-h0-8-]+\s\d+\s\d+$/);
        }
      });

      it('debe generar FEN diferentes para cada posición', () => {
        const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 *`;

        const partida = parser.parsear(pgn);

        // Cada FEN debe ser único (las posiciones cambian)
        const fens = partida.jugadas.map(j => j.fen);
        const uniqueFens = new Set(fens);
        expect(uniqueFens.size).toBe(fens.length);
      });

      it('debe tener FEN válido con información completa', () => {
        const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. d4 Nf6 *`;

        const partida = parser.parsear(pgn);

        // Verificar estructura del FEN: posición turno enroque enpassant halfmove fullmove
        const fen = partida.jugadas[0].fen!;
        const partes = fen.split(' ');
        expect(partes).toHaveLength(6);
        expect(partes[1]).toMatch(/^[wb]$/); // Turno
        expect(partes[2]).toMatch(/^[KQkq-]+$/); // Enroque
      });
    });

    describe('7.3 - Método serializar para round-trip', () => {
      it('debe serializar correctamente todos los encabezados requeridos', () => {
        const pgn = `[Event "Test Event"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Jugador1"]
[Black "Jugador2"]
[Result "1-0"]

1. e4 e5 1-0`;

        const partida = parser.parsear(pgn);
        const serializado = parser.serializar(partida);

        // Verificar todos los encabezados obligatorios
        expect(serializado).toContain('[Event "Test Event"]');
        expect(serializado).toContain('[Site "lichess.org"]');
        expect(serializado).toContain('[Date "2024.01.15"]');
        expect(serializado).toContain('[White "Jugador1"]');
        expect(serializado).toContain('[Black "Jugador2"]');
        expect(serializado).toContain('[Result "1-0"]');
      });

      it('debe serializar jugadas con numeración correcta', () => {
        const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 *`;

        const partida = parser.parsear(pgn);
        const serializado = parser.serializar(partida);

        // Verificar numeración de jugadas
        expect(serializado).toMatch(/1\.\s+e4/);
        expect(serializado).toMatch(/2\.\s+Nf3/);
        expect(serializado).toMatch(/3\.\s+Bb5/);
      });

      it('debe omitir encabezados opcionales ausentes', () => {
        const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 *`;

        const partida = parser.parsear(pgn);
        const serializado = parser.serializar(partida);

        // No debe incluir WhiteElo/BlackElo si no están presentes
        if (!partida.metadatos.eloBlancas) {
          expect(serializado).not.toContain('[WhiteElo');
        }
        if (!partida.metadatos.apertura) {
          expect(serializado).not.toContain('[Opening');
        }
      });

      it('debe terminar con el resultado de la partida', () => {
        const resultados: Array<'1-0' | '0-1' | '1/2-1/2' | '*'> = ['1-0', '0-1', '1/2-1/2', '*'];

        for (const resultado of resultados) {
          const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "${resultado}"]

1. e4 ${resultado}`;

          const partida = parser.parsear(pgn);
          const serializado = parser.serializar(partida);

          expect(serializado.trim()).toMatch(new RegExp(`${resultado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
        }
      });
    });

    describe('7.4 - Manejo de errores en parser', () => {
      it('debe lanzar ErrorParseoPGN con PGN solo con espacios en blanco', () => {
        expect(() => parser.parsear('     ')).toThrow(ErrorParseoPGN);
        expect(() => parser.parsear('\t\t\t')).toThrow(ErrorParseoPGN);
        expect(() => parser.parsear('\n\n\n')).toThrow(ErrorParseoPGN);
      });

      it('debe lanzar ErrorParseoPGN con mensaje que incluye "Error parseando PGN"', () => {
        try {
          parser.parsear('texto random no-PGN');
          expect.fail('Debería haber lanzado ErrorParseoPGN');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorParseoPGN);
          if (error instanceof ErrorParseoPGN) {
            expect(error.message).toContain('Error parseando PGN');
            expect(error.name).toBe('ErrorParseoPGN');
          }
        }
      });

      it('debe rechazar PGN con formato de encabezados inválido', () => {
        const pgnInválido = `Event: Test
Site: Test
1. e4 *`;

        expect(() => parser.parsear(pgnInválido)).toThrow(ErrorParseoPGN);
      });

      it('debe rechazar jugadas con sintaxis incorrecta', () => {
        const pgnInválido = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Xxx *`;

        expect(() => parser.parsear(pgnInválido)).toThrow(ErrorParseoPGN);
      });

      it('debe rechazar movimientos ilegales', () => {
        const pgnInválido = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. e5 *`; // e5 es ilegal, el peón ya está en e4

        expect(() => parser.parsear(pgnInválido)).toThrow(ErrorParseoPGN);
      });

      it('debe proporcionar información útil en el error', () => {
        try {
          parser.parsear('[Event "Test"]\n\nX. invalid move');
          expect.fail('Debería haber lanzado error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorParseoPGN);
          if (error instanceof ErrorParseoPGN) {
            // El mensaje debe ser descriptivo
            expect(error.message.length).toBeGreaterThan(10);
          }
        }
      });
    });
  });
});
