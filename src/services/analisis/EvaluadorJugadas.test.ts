/**
 * Pruebas unitarias para EvaluadorJugadas
 * Feature: lichess-game-analysis
 * Valida: Requisitos 4.1, 4.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluadorJugadas } from './EvaluadorJugadas';
import type { MotorStockfish, ResultadoAnálisisStockfish } from '../stockfish/MotorStockfish';
import type { Evaluación } from '../../types/evaluacion';

// Mock del MotorStockfish
const crearMotorMock = (): MotorStockfish => {
  return {
    inicializar: vi.fn().mockResolvedValue(undefined),
    detener: vi.fn(),
    analizarPosición: vi.fn()
  } as unknown as MotorStockfish;
};

describe('EvaluadorJugadas', () => {
  let motor: MotorStockfish;
  let evaluador: EvaluadorJugadas;

  beforeEach(() => {
    motor = crearMotorMock();
    evaluador = new EvaluadorJugadas(motor);
  });

  describe('Constructor y configuración', () => {
    it('debe crear instancia con motor Stockfish', () => {
      expect(evaluador).toBeDefined();
      expect(evaluador.obtenerProfundidad()).toBe(15);
    });

    it('debe tener profundidad por defecto de 15 plies', () => {
      expect(evaluador.obtenerProfundidad()).toBe(15);
    });
  });

  describe('establecerProfundidad', () => {
    it('debe actualizar la profundidad correctamente', () => {
      evaluador.establecerProfundidad(20);
      expect(evaluador.obtenerProfundidad()).toBe(20);
    });

    it('debe aceptar profundidad mínima de 1', () => {
      evaluador.establecerProfundidad(1);
      expect(evaluador.obtenerProfundidad()).toBe(1);
    });

    it('debe aceptar profundidad máxima de 30', () => {
      evaluador.establecerProfundidad(30);
      expect(evaluador.obtenerProfundidad()).toBe(30);
    });

    it('debe rechazar profundidad menor a 1', () => {
      expect(() => evaluador.establecerProfundidad(0)).toThrow('La profundidad debe ser al menos 1');
      expect(() => evaluador.establecerProfundidad(-5)).toThrow('La profundidad debe ser al menos 1');
    });

    it('debe rechazar profundidad mayor a 30', () => {
      expect(() => evaluador.establecerProfundidad(31)).toThrow('La profundidad máxima es 30');
      expect(() => evaluador.establecerProfundidad(100)).toThrow('La profundidad máxima es 30');
    });
  });

  describe('evaluarPosición', () => {
    it('debe evaluar posición y construir objeto Evaluación', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        evaluación: 25,
        profundidad: 15,
        nodos: 100000,
        tiempo: 1000
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      const evaluación = await evaluador.evaluarPosición(fen);

      expect(evaluación).toEqual({
        fen,
        centipawns: 25,
        mate: undefined,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: expect.any(Number)
      });

      expect(motor.analizarPosición).toHaveBeenCalledWith(fen, 15);
    });

    it('debe usar profundidad por defecto si no se especifica', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 15
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      await evaluador.evaluarPosición(fen);

      expect(motor.analizarPosición).toHaveBeenCalledWith(fen, 15);
    });

    it('debe usar profundidad especificada si se proporciona', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 20
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      await evaluador.evaluarPosición(fen, 20);

      expect(motor.analizarPosición).toHaveBeenCalledWith(fen, 20);
    });

    it('debe manejar evaluaciones de mate', async () => {
      const fen = 'k7/8/8/8/8/8/8/R3K2R w KQ - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'a1a8',
        mejorJugadaSAN: 'Ra8#',
        evaluación: 10000,
        mate: 1,
        profundidad: 15
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      const evaluación = await evaluador.evaluarPosición(fen);

      expect(evaluación.mate).toBe(1);
      expect(evaluación.centipawns).toBe(10000);
    });

    it('debe usar mejorJugada como fallback si no hay mejorJugadaSAN', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 15
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      const evaluación = await evaluador.evaluarPosición(fen);

      expect(evaluación.mejorJugadaSAN).toBe('e2e4');
    });

    it('debe registrar tiempo de evaluación', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 15
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      const evaluación = await evaluador.evaluarPosición(fen);

      expect(evaluación.tiempoEvaluación).toBeGreaterThanOrEqual(0);
      expect(evaluación.tiempoEvaluación).toBeLessThan(5000); // Menos de 5 segundos
    });
  });

  describe('evaluarSecuencia', () => {
    it('debe evaluar secuencia de posiciones en orden', async () => {
      const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
      ];

      const resultadosMotor: ResultadoAnálisisStockfish[] = [
        { mejorJugada: 'e2e4', evaluación: 25, profundidad: 15 },
        { mejorJugada: 'e7e5', evaluación: -25, profundidad: 15 },
        { mejorJugada: 'g1f3', evaluación: 30, profundidad: 15 }
      ];

      vi.mocked(motor.analizarPosición)
        .mockResolvedValueOnce(resultadosMotor[0])
        .mockResolvedValueOnce(resultadosMotor[1])
        .mockResolvedValueOnce(resultadosMotor[2]);

      const evaluaciones = await evaluador.evaluarSecuencia(fens);

      expect(evaluaciones).toHaveLength(3);
      expect(evaluaciones[0].fen).toBe(fens[0]);
      expect(evaluaciones[1].fen).toBe(fens[1]);
      expect(evaluaciones[2].fen).toBe(fens[2]);
      expect(motor.analizarPosición).toHaveBeenCalledTimes(3);
    });

    it('debe retornar array vacío para secuencia vacía', async () => {
      const evaluaciones = await evaluador.evaluarSecuencia([]);
      expect(evaluaciones).toEqual([]);
    });

    it('debe manejar secuencia de una sola posición', async () => {
      const fens = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'];
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 15
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      const evaluaciones = await evaluador.evaluarSecuencia(fens);

      expect(evaluaciones).toHaveLength(1);
      expect(evaluaciones[0].fen).toBe(fens[0]);
    });

    it('debe procesar posiciones secuencialmente', async () => {
      const fens = ['fen1', 'fen2', 'fen3'];
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 15
      };

      const ordenLlamadas: string[] = [];
      vi.mocked(motor.analizarPosición).mockImplementation(async (fen: string) => {
        ordenLlamadas.push(fen);
        return resultadoMotor;
      });

      await evaluador.evaluarSecuencia(fens);

      expect(ordenLlamadas).toEqual(['fen1', 'fen2', 'fen3']);
    });
  });

  describe('Integración configuración y evaluación', () => {
    it('debe usar profundidad configurada en evaluación', async () => {
      evaluador.establecerProfundidad(20);

      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 20
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      await evaluador.evaluarPosición(fen);

      expect(motor.analizarPosición).toHaveBeenCalledWith(fen, 20);
    });

    it('debe poder cambiar profundidad entre evaluaciones', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultadoMotor: ResultadoAnálisisStockfish = {
        mejorJugada: 'e2e4',
        evaluación: 25,
        profundidad: 15
      };

      vi.mocked(motor.analizarPosición).mockResolvedValue(resultadoMotor);

      await evaluador.evaluarPosición(fen);
      expect(motor.analizarPosición).toHaveBeenCalledWith(fen, 15);

      evaluador.establecerProfundidad(25);
      await evaluador.evaluarPosición(fen);
      expect(motor.analizarPosición).toHaveBeenCalledWith(fen, 25);
    });
  });
});
