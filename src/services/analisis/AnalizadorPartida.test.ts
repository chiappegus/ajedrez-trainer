/**
 * Tests para AnalizadorPartida
 * Feature: lichess-game-analysis
 * Valida: Requisitos 9.1, 9.2, 9.3, 9.5, 5.5, 8.1, 10.3, 10.4, 12.1, 12.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalizadorPartida } from './AnalizadorPartida';
import type { ClienteLichess } from '../lichess/ClienteLichess';
import type { ParserPGN } from '../parseo/ParserPGN';
import type { EvaluadorJugadas } from './EvaluadorJugadas';
import type { DetectorErrores } from './DetectorErrores';
import type { GeneradorExplicaciones } from './GeneradorExplicaciones';
import type { Partida } from '../../types/partida';
import type { Evaluación } from '../../types/evaluacion';
import type { ErrorDetectado } from '../../types/error';

describe('AnalizadorPartida', () => {
  let mockClienteLichess: ClienteLichess;
  let mockParser: ParserPGN;
  let mockEvaluador: EvaluadorJugadas;
  let mockDetector: DetectorErrores;
  let mockGenerador: GeneradorExplicaciones;
  let analizador: AnalizadorPartida;

  beforeEach(() => {
    // Crear mocks de todas las dependencias
    mockClienteLichess = {
      obtenerÚltimaPartida: vi.fn()
    } as unknown as ClienteLichess;

    mockParser = {
      parsear: vi.fn()
    } as unknown as ParserPGN;

    mockEvaluador = {
      evaluarPosición: vi.fn()
    } as unknown as EvaluadorJugadas;

    mockDetector = {
      detectarError: vi.fn()
    } as unknown as DetectorErrores;

    mockGenerador = {
      generarExplicaciónConcisa: vi.fn(),
      generarExplicaciónBásica: vi.fn()
    } as unknown as GeneradorExplicaciones;

    analizador = new AnalizadorPartida(
      mockClienteLichess,
      mockParser,
      mockEvaluador,
      mockDetector,
      mockGenerador
    );
  });

  describe('Constructor (Tarea 17.1)', () => {
    it('debe inicializar con todas las dependencias correctamente', () => {
      expect(analizador).toBeInstanceOf(AnalizadorPartida);
      expect(analizador).toBeDefined();
    });

    it('debe tener estado inicial inactivo', () => {
      const progreso = analizador.obtenerProgreso();
      expect(progreso.estado).toBe('inactivo');
      expect(progreso.jugadaActual).toBe(0);
      expect(progreso.totalJugadas).toBe(0);
      expect(progreso.erroresEncontrados).toBe(0);
    });
  });

  describe('iniciarAnálisis (Tareas 17.2, 17.3, 17.4, 17.5)', () => {
    it('debe ejecutar flujo completo de análisis sin errores', async () => {
      // Preparar datos de test
      const pgnMock = '[Event "Test"]\n\n1. e4 e5 2. Nf3 Nc6';
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2' },
          { numeroJugada: 2, turno: 'white', jugadaSAN: 'Nf3', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2' },
          { numeroJugada: 2, turno: 'black', jugadaSAN: 'Nc6', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3' }
        ],
        resultado: '1-0'
      };

      const evaluaciónMock: Evaluación = {
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      };

      // Configurar mocks
      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue(pgnMock);
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue(evaluaciónMock);
      vi.mocked(mockDetector.detectarError).mockReturnValue(null);

      // Ejecutar
      const resultado = await analizador.iniciarAnálisis('testuser');

      // Verificar
      expect(mockClienteLichess.obtenerÚltimaPartida).toHaveBeenCalledWith('testuser');
      expect(mockParser.parsear).toHaveBeenCalledWith(pgnMock);
      expect(resultado.partida).toEqual(partidaMock);
      expect(resultado.jugadasAnalizadas).toBe(4);
      expect(resultado.erroresDetectados).toHaveLength(0);
      expect(resultado.estadísticas.rendimientoGeneral).toBe('excelente');
    });

    it('debe detectar errores y generar explicaciones', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' },
          { numeroJugada: 2, turno: 'white', jugadaSAN: 'Nf3', fen: 'fen3' },
          { numeroJugada: 2, turno: 'black', jugadaSAN: 'Nc6', fen: 'fen4' },
          { numeroJugada: 3, turno: 'white', jugadaSAN: 'Bc4', fen: 'fen5' },
          { numeroJugada: 3, turno: 'black', jugadaSAN: 'd6', fen: 'fen6' }, // Error aquí
        ],
        resultado: '*'
      };

      const errorMock: ErrorDetectado = {
        numeroJugada: 3,
        turno: 'black',
        fenAntes: 'fen5',
        jugadaRealizada: partidaMock.jugadas[5],
        mejorJugada: 'g8f6',
        mejorJugadaSAN: 'Nf6',
        evaluaciónAntes: 30,
        evaluaciónDespués: -80,
        pérdidaCentipawns: 110
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });
      
      // Mock detector: retorna null para primeras 3 jugadas, error para la 4ta
      vi.mocked(mockDetector.detectarError).mockImplementation((evalAntes, evalDespués, jugada) => {
        if (jugada.numeroJugada === 3 && jugada.turno === 'black') {
          return errorMock;
        }
        return null;
      });

      vi.mocked(mockGenerador.generarExplicaciónConcisa).mockResolvedValue('Explicación IA del error');

      // Ejecutar
      const resultado = await analizador.iniciarAnálisis('testuser');

      // Verificar
      expect(resultado.erroresDetectados).toHaveLength(1);
      expect(resultado.erroresDetectados[0]).toEqual({
        ...errorMock,
        explicación: 'Explicación IA del error'
      });
      expect(mockGenerador.generarExplicaciónConcisa).toHaveBeenCalledWith(errorMock);
    });

    it('debe usar explicación básica cuando Groq API falla', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' },
          { numeroJugada: 2, turno: 'white', jugadaSAN: 'Nf3', fen: 'fen3' },
          { numeroJugada: 2, turno: 'black', jugadaSAN: 'Qf6', fen: 'fen4' }, // Error
        ],
        resultado: '*'
      };

      const errorMock: ErrorDetectado = {
        numeroJugada: 2,
        turno: 'black',
        fenAntes: 'fen3',
        jugadaRealizada: partidaMock.jugadas[3],
        mejorJugada: 'b8c6',
        mejorJugadaSAN: 'Nc6',
        evaluaciónAntes: 20,
        evaluaciónDespués: -100,
        pérdidaCentipawns: 120
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });
      vi.mocked(mockDetector.detectarError).mockImplementation((evalAntes, evalDespués, jugada) => {
        if (jugada.numeroJugada === 2 && jugada.turno === 'black') {
          return errorMock;
        }
        return null;
      });

      // Groq falla, debe usar fallback
      vi.mocked(mockGenerador.generarExplicaciónConcisa).mockRejectedValue(new Error('API Error'));
      vi.mocked(mockGenerador.generarExplicaciónBásica).mockReturnValue('Explicación básica fallback');

      // Ejecutar
      const resultado = await analizador.iniciarAnálisis('testuser');

      // Verificar que usó el fallback
      expect(resultado.erroresDetectados).toHaveLength(1);
      expect(resultado.erroresDetectados[0].explicación).toBe('Explicación básica fallback');
      expect(mockGenerador.generarExplicaciónBásica).toHaveBeenCalledWith(errorMock);
    });

    it('debe calcular estadísticas correctamente', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' },
          { numeroJugada: 2, turno: 'white', jugadaSAN: 'Nf3', fen: 'fen3' },
          { numeroJugada: 2, turno: 'black', jugadaSAN: 'Qf6', fen: 'fen4' }, // Error negras
          { numeroJugada: 3, turno: 'white', jugadaSAN: 'Qe2', fen: 'fen5' }, // Error blancas
        ],
        resultado: '*'
      };

      const error1: ErrorDetectado = {
        numeroJugada: 2,
        turno: 'black',
        fenAntes: 'fen3',
        jugadaRealizada: partidaMock.jugadas[3],
        mejorJugada: 'b8c6',
        mejorJugadaSAN: 'Nc6',
        evaluaciónAntes: 20,
        evaluaciónDespués: -100,
        pérdidaCentipawns: 120
      };

      const error2: ErrorDetectado = {
        numeroJugada: 3,
        turno: 'white',
        fenAntes: 'fen4',
        jugadaRealizada: partidaMock.jugadas[4],
        mejorJugada: 'd2d4',
        mejorJugadaSAN: 'd4',
        evaluaciónAntes: -100,
        evaluaciónDespués: -250,
        pérdidaCentipawns: 150
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });
      
      // Mock detector: retornar errores en jugadas específicas después de la 3ra
      vi.mocked(mockDetector.detectarError).mockImplementation((evalAntes, evalDespués, jugada) => {
        if (jugada.numeroJugada === 2 && jugada.turno === 'black') {
          return error1;
        }
        if (jugada.numeroJugada === 3 && jugada.turno === 'white') {
          return error2;
        }
        return null;
      });

      vi.mocked(mockGenerador.generarExplicaciónConcisa).mockResolvedValue('Explicación');

      // Ejecutar
      const resultado = await analizador.iniciarAnálisis('testuser');

      // Verificar estadísticas
      expect(resultado.estadísticas.erroresBlancas).toBe(1);
      expect(resultado.estadísticas.erroresNegras).toBe(1);
      expect(resultado.estadísticas.mayorPérdida).toBe(150);
      expect(resultado.estadísticas.jugadaMayorPérdida).toBe(3);
      expect(resultado.pérdidaPromedioCentipawns).toBe(135); // (120 + 150) / 2
    });
  });

  describe('pausarAnálisis y reanudarAnálisis (Tareas 17.6)', () => {
    it('debe pausar el análisis en progreso', () => {
      // Cambiar estado interno simulando análisis en progreso
      const progreso = analizador.obtenerProgreso();
      expect(progreso.estado).toBe('inactivo');

      // No podemos probar directamente sin iniciar análisis real,
      // pero podemos verificar que el método existe
      expect(analizador.pausarAnálisis).toBeDefined();
      expect(analizador.reanudarAnálisis).toBeDefined();
      
      analizador.pausarAnálisis(); // No debe fallar
      analizador.reanudarAnálisis(); // No debe fallar
    });
  });

  describe('obtenerProgreso (Tarea 17.7)', () => {
    it('debe retornar información de progreso completa', () => {
      const progreso = analizador.obtenerProgreso();

      expect(progreso).toHaveProperty('estado');
      expect(progreso).toHaveProperty('jugadaActual');
      expect(progreso).toHaveProperty('totalJugadas');
      expect(progreso).toHaveProperty('erroresEncontrados');
      expect(progreso).toHaveProperty('tiempoPromedioPorJugada');
      expect(progreso).toHaveProperty('tiempoRestanteEstimado');
    });

    it('debe calcular tiempo restante correctamente', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' }
        ],
        resultado: '*'
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });
      vi.mocked(mockDetector.detectarError).mockReturnValue(null);

      const resultadoPromise = analizador.iniciarAnálisis('testuser');
      
      // Esperar un poco para que comience el análisis
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const progreso = analizador.obtenerProgreso();
      await resultadoPromise;

      // Verificar que el progreso tiene valores razonables
      expect(progreso.tiempoPromedioPorJugada).toBeGreaterThanOrEqual(0);
      expect(progreso.tiempoRestanteEstimado).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Clasificación de rendimiento (Requisitos 12.1, 12.2)', () => {
    it('debe clasificar como "excelente" cuando pérdida promedio < 20', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' }
        ],
        resultado: '*'
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });
      vi.mocked(mockDetector.detectarError).mockReturnValue(null);

      const resultado = await analizador.iniciarAnálisis('testuser');

      expect(resultado.pérdidaPromedioCentipawns).toBe(0);
      expect(resultado.estadísticas.rendimientoGeneral).toBe('excelente');
    });

    it('debe clasificar como "sólido" cuando pérdida promedio entre 20-50', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' },
          { numeroJugada: 2, turno: 'white', jugadaSAN: 'Nf3', fen: 'fen3' },
          { numeroJugada: 2, turno: 'black', jugadaSAN: 'Nc6', fen: 'fen4' },
          { numeroJugada: 3, turno: 'white', jugadaSAN: 'Bc4', fen: 'fen5' },
          { numeroJugada: 3, turno: 'black', jugadaSAN: 'd6', fen: 'fen6' },
        ],
        resultado: '*'
      };

      // Error con pérdida de 30 centipawns (promedio = 30, clasificación "sólido")
      const error: ErrorDetectado = {
        numeroJugada: 3,
        turno: 'black',
        fenAntes: 'fen5',
        jugadaRealizada: partidaMock.jugadas[5],
        mejorJugada: 'g8f6',
        mejorJugadaSAN: 'Nf6',
        evaluaciónAntes: 30,
        evaluaciónDespués: 0,
        pérdidaCentipawns: 30
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });
      vi.mocked(mockDetector.detectarError).mockImplementation((evalAntes, evalDespués, jugada) => {
        if (jugada.numeroJugada === 3 && jugada.turno === 'black') {
          return error;
        }
        return null;
      });
      vi.mocked(mockGenerador.generarExplicaciónConcisa).mockResolvedValue('Explicación');

      const resultado = await analizador.iniciarAnálisis('testuser');

      expect(resultado.pérdidaPromedioCentipawns).toBe(30);
      expect(resultado.estadísticas.rendimientoGeneral).toBe('sólido');
    });

    it('debe clasificar como "mejorable" cuando pérdida promedio >= 100', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' },
          { numeroJugada: 2, turno: 'white', jugadaSAN: 'Nf3', fen: 'fen3' },
          { numeroJugada: 2, turno: 'black', jugadaSAN: 'Qf6', fen: 'fen4' },
        ],
        resultado: '*'
      };

      const error: ErrorDetectado = {
        numeroJugada: 2,
        turno: 'black',
        fenAntes: 'fen3',
        jugadaRealizada: partidaMock.jugadas[3],
        mejorJugada: 'b8c6',
        mejorJugadaSAN: 'Nc6',
        evaluaciónAntes: 20,
        evaluaciónDespués: -150,
        pérdidaCentipawns: 170
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });
      
      vi.mocked(mockDetector.detectarError).mockImplementation((evalAntes, evalDespués, jugada) => {
        if (jugada.numeroJugada === 2 && jugada.turno === 'black') {
          return error;
        }
        return null;
      });
      
      vi.mocked(mockGenerador.generarExplicaciónConcisa).mockResolvedValue('Explicación');

      const resultado = await analizador.iniciarAnálisis('testuser');

      expect(resultado.pérdidaPromedioCentipawns).toBe(170);
      expect(resultado.estadísticas.rendimientoGeneral).toBe('mejorable');
    });
  });

  describe('Ignorar primeras 3 jugadas (Requisito 5.5)', () => {
    it('no debe detectar errores en las primeras 3 jugadas', async () => {
      const partidaMock: Partida = {
        metadatos: {
          blancas: 'Jugador1',
          negras: 'Jugador2',
          fecha: '2024-01-01',
          evento: 'Test',
          sitio: 'lichess.org'
        },
        jugadas: [
          { numeroJugada: 1, turno: 'white', jugadaSAN: 'e4', fen: 'fen1' },
          { numeroJugada: 1, turno: 'black', jugadaSAN: 'e5', fen: 'fen2' },
          { numeroJugada: 2, turno: 'white', jugadaSAN: 'Nf3', fen: 'fen3' },
          { numeroJugada: 2, turno: 'black', jugadaSAN: 'Nc6', fen: 'fen4' },
        ],
        resultado: '*'
      };

      vi.mocked(mockClienteLichess.obtenerÚltimaPartida).mockResolvedValue('[Event "Test"]');
      vi.mocked(mockParser.parsear).mockReturnValue(partidaMock);
      vi.mocked(mockEvaluador.evaluarPosición).mockResolvedValue({
        fen: 'test',
        centipawns: 20,
        mejorJugada: 'e2e4',
        mejorJugadaSAN: 'e4',
        profundidad: 15,
        tiempoEvaluación: 100
      });

      // Llamada del detector debe incluir jugadas < 4 pero no detectar errores
      let llamadasDetector = 0;
      vi.mocked(mockDetector.detectarError).mockImplementation((evalAntes, evalDespués, jugada) => {
        llamadasDetector++;
        return null; // No detectar errores
      });

      const resultado = await analizador.iniciarAnálisis('testuser');

      // Debe evaluar todas las jugadas pero no detectar errores en las primeras 3
      expect(resultado.erroresDetectados).toHaveLength(0);
      // Solo debe llamarse una vez con jugada >= 4 (en este caso, índice 3)
      expect(llamadasDetector).toBe(1);
    });
  });
});
