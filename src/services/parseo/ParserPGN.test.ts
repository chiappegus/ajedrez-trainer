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
      // Partida corta con promoción
      const pgn = `[Event "Test"]
[Site "Test"]
[Date "2024.01.15"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 c6 5. Nf3 Bg4 6. h3 Bxf3 7. Qxf3 e6 8. Be3 Nf6 9. O-O-O Nbd7 10. Kb1 Bd6 11. g4 O-O 12. g5 Ne8 13. Qh5 g6 14. Qh6 Ng7 15. h4 Rfe8 16. h5 Be7 17. hxg6 hxg6 18. Rxh8+ Kxh8 19. Qxg7+ Kxg7 20. Rh1 Rh8 21. Rxh8 Kxh8 22. Bh3 Kg7 23. Ne4 Nf6 24. Nxf6 Bxf6 25. gxf6+ Kxf6 26. Bg5+ Kg7 27. Bf4 Qd8 28. Bg5 Qe8 29. c3 Qh5 30. Bc8 b6 31. Bxa7 c5 32. Bxb6 cxd4 33. cxd4 Qd1+ 34. Kc2 Qe2+ 35. Kb3 Qxf2 36. Kc3 Qe3+ 37. Kc4 Qe4 38. Kb5 Qxd4 39. Ka6 Qc4+ 40. Kb7 Qxb6+ 41. Kxb6 f5 42. a4 f4 43. a5 f3 44. a6 f2 45. a7 f1=Q 46. a8=Q *`;

      const partida = parser.parsear(pgn);

      // Buscar las promociones en las últimas jugadas
      const promociones = partida.jugadas.filter(j => j.jugadaSAN.includes('='));
      expect(promociones.length).toBeGreaterThan(0);
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
});
