/**
 * Pruebas unitarias para DetectorErrores
 * Feature: lichess-game-analysis
 * Valida: Requisitos 5.1, 5.2, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import { DetectorErrores } from './DetectorErrores';
import type { Evaluación } from '../../types/evaluacion';
import type { Jugada } from '../../types/partida';

describe('DetectorErrores', () => {
  const detector = new DetectorErrores();

  describe('detectarError - Casos básicos', () => {
    it('debe detectar error cuando blancas pierden >= 100cp', () => {
      const evalAntes: Evaluación = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        centipawns: 50,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 1000
      };

      const evalDespués: Evaluación = {
        ...evalAntes,
        centipawns: -100, // Pérdida de 150cp para blancas
        mejorJugada: 'e7e5',
        mejorJugadaSAN: 'e5'
      };

      const jugada: Jugada = {
        numeroJugada: 10,
        turno: 'white',
        jugadaSAN: 'Qh5',
        fen: evalDespués.fen
      };

      const error = detector.detectarError(evalAntes, evalDespués, jugada, 10);

      expect(error).not.toBeNull();
      expect(error?.pérdidaCentipawns).toBe(150);
      expect(error?.turno).toBe('white');
    });

    it('debe detectar error cuando negras pierden >= 100cp', () => {
      const evalAntes: Evaluación = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
        centipawns: -50, // Ventaja para negras
        mejorJugada: 'e7e5',
        mejorJugadaSAN: 'e5',
        profundidad: 15,
        tiempoEvaluación: 1000
      };

      const evalDespués: Evaluación = {
        ...evalAntes,
        centipawns: 100, // Pérdida de 150cp para negras (desde -50 a +100)
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4'
      };

      const jugada: Jugada = {
        numeroJugada: 12,
        turno: 'black',
        jugadaSAN: 'Qh4',
        fen: evalDespués.fen
      };

      const error = detector.detectarError(evalAntes, evalDespués, jugada, 12);

      expect(error).not.toBeNull();
      expect(error?.pérdidaCentipawns).toBe(150);
      expect(error?.turno).toBe('black');
    });

    it('NO debe detectar error cuando la pérdida es menor a 100cp', () => {
      const evalAntes: Evaluación = {
        fen: 'test',
        centipawns: 50,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 1000
      };

      const evalDespués: Evaluación = {
        ...evalAntes,
        centipawns: -30, // Pérdida de 80cp (menor al umbral)
      };

      const jugada: Jugada = {
        numeroJugada: 15,
        turno: 'white',
        jugadaSAN: 'Nf3',
        fen: 'test'
      };

      const error = detector.detectarError(evalAntes, evalDespués, jugada, 15);

      expect(error).toBeNull();
    });

    it('NO debe detectar error cuando la jugada mejora la posición', () => {
      const evalAntes: Evaluación = {
        fen: 'test',
        centipawns: 50,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 1000
      };

      const evalDespués: Evaluación = {
        ...evalAntes,
        centipawns: 200, // Mejora de 150cp
      };

      const jugada: Jugada = {
        numeroJugada: 20,
        turno: 'white',
        jugadaSAN: 'Qxf7#',
        fen: 'test'
      };

      const error = detector.detectarError(evalAntes, evalDespués, jugada, 20);

      expect(error).toBeNull();
    });
  });

  describe('filtrarPrimerasTresJugadas - Requisito 5.5', () => {
    it('debe ignorar errores en las jugadas 1, 2, y 3', () => {
      const evalAntes: Evaluación = {
        fen: 'test',
        centipawns: 0,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 1000
      };

      const evalDespuésBlancas: Evaluación = {
        ...evalAntes,
        centipawns: -200, // Gran pérdida para blancas
      };

      // Jugada 1 - blancas
      const jugada1: Jugada = {
        numeroJugada: 1,
        turno: 'white',
        jugadaSAN: 'f3',
        fen: 'test'
      };

      const error1 = detector.detectarError(evalAntes, evalDespuésBlancas, jugada1, 1);
      expect(error1).toBeNull();

      // Jugada 2 - negras
      const evalAntesNegras: Evaluación = {
        ...evalAntes,
        centipawns: -50
      };

      const evalDespuésNegras: Evaluación = {
        ...evalAntes,
        centipawns: 200, // Gran pérdida para negras
      };

      const jugada2: Jugada = {
        numeroJugada: 2,
        turno: 'black',
        jugadaSAN: 'e5',
        fen: 'test'
      };

      const error2 = detector.detectarError(evalAntesNegras, evalDespuésNegras, jugada2, 2);
      expect(error2).toBeNull();

      // Jugada 3 - blancas
      const jugada3: Jugada = {
        numeroJugada: 3,
        turno: 'white',
        jugadaSAN: 'g4',
        fen: 'test'
      };

      const error3 = detector.detectarError(evalAntes, evalDespuésBlancas, jugada3, 3);
      expect(error3).toBeNull();

      // Jugada 4 - negras debe detectarse
      const jugada4: Jugada = {
        numeroJugada: 4,
        turno: 'black',
        jugadaSAN: 'Qh4#',
        fen: 'test'
      };

      const error4 = detector.detectarError(evalAntesNegras, evalDespuésNegras, jugada4, 4);
      expect(error4).not.toBeNull();
    });
  });

  describe('Estructura completa del ErrorDetectado - Requisito 5.3', () => {
    it('debe incluir todos los campos requeridos en el objeto de error', () => {
      const evalAntes: Evaluación = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        centipawns: 100,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 1500
      };

      const evalDespués: Evaluación = {
        fen: 'rnbqkbnr/pppppppp/8/8/7Q/8/PPPPPPPP/RNBQKB1R b KQkq - 1 1',
        centipawns: -150,
        mejorJugada: 'e7e5',
        mejorJugadaSAN: 'e5',
        profundidad: 15,
        tiempoEvaluación: 1600
      };

      const jugada: Jugada = {
        numeroJugada: 8,
        turno: 'white',
        jugadaSAN: 'Qh4',
        jugadaUCI: 'd1h4',
        fen: evalDespués.fen
      };

      const error = detector.detectarError(evalAntes, evalDespués, jugada, 8);

      expect(error).not.toBeNull();
      
      // Verificar que todos los campos requeridos están presentes
      expect(error?.numeroJugada).toBe(8);
      expect(error?.turno).toBe('white');
      expect(error?.fenAntes).toBe(evalAntes.fen);
      expect(error?.jugadaRealizada).toEqual(jugada);
      expect(error?.mejorJugada).toBe('e2e4');
      expect(error?.mejorJugadaSAN).toBe('e4');
      expect(error?.evaluaciónAntes).toBe(100);
      expect(error?.evaluaciónDespués).toBe(-150);
      expect(error?.pérdidaCentipawns).toBe(250);
    });
  });

  describe('filtrarPrimerasTresJugadas - método de utilidad', () => {
    it('debe filtrar errores de las jugadas 1-3', () => {
      const erroresSimulados = [
        { numeroJugada: 1, turno: 'white' as const, pérdidaCentipawns: 150 },
        { numeroJugada: 2, turno: 'black' as const, pérdidaCentipawns: 120 },
        { numeroJugada: 3, turno: 'white' as const, pérdidaCentipawns: 200 },
        { numeroJugada: 4, turno: 'black' as const, pérdidaCentipawns: 100 },
        { numeroJugada: 10, turno: 'white' as const, pérdidaCentipawns: 180 }
      ] as any[];

      const filtrados = detector.filtrarPrimerasTresJugadas(erroresSimulados);

      expect(filtrados).toHaveLength(2);
      expect(filtrados[0].numeroJugada).toBe(4);
      expect(filtrados[1].numeroJugada).toBe(10);
    });
  });
});
