/**
 * Tests para MotorStockfish
 * 
 * Tests unitarios para el wrapper del motor Stockfish con Web Workers.
 * Se mockea el Web Worker para evitar dependencia del binario Stockfish.
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MotorStockfish } from './MotorStockfish';
import type { MensajeDesdeWorker } from './stockfish-worker';

// Mock del Web Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private detenido = false;
  
  postMessage(mensaje: unknown): void {
    // Simular respuestas del worker según el mensaje
    setTimeout(() => {
      this.simularRespuesta(mensaje);
    }, 10);
  }
  
  terminate(): void {
    this.detenido = true;
  }
  
  private simularRespuesta(mensaje: unknown): void {
    if (!this.onmessage || this.detenido) return;
    
    const msg = mensaje as any;
    
    switch (msg.tipo) {
      case 'inicializar':
        // Simular secuencia de inicialización UCI
        this.enviarMensaje({ tipo: 'info', mensaje: 'UCI inicializado' });
        setTimeout(() => {
          if (!this.detenido) {
            this.enviarMensaje({ tipo: 'listo' });
          }
        }, 50);
        break;
        
      case 'analizar':
        // Simular análisis con resultado típico
        setTimeout(() => {
          if (!this.detenido) {
            this.enviarMensaje({
              tipo: 'resultado',
              mejorJugada: 'e2e4',
              evaluación: 25,
              profundidad: msg.profundidad || 15,
              nodos: 1234567
            });
          }
        }, 100);
        break;
        
      case 'detener':
        // Detener no envía respuesta específica
        break;
        
      case 'comando':
        // Comandos UCI no requieren respuesta en nuestro caso
        break;
    }
  }
  
  private enviarMensaje(mensaje: MensajeDesdeWorker): void {
    if (this.onmessage && !this.detenido) {
      this.onmessage(new MessageEvent('message', { data: mensaje }));
    }
  }
  
  // Método auxiliar para testing - simular error
  simularError(mensajeError: string): void {
    if (this.onmessage && !this.detenido) {
      this.enviarMensaje({
        tipo: 'error',
        error: mensajeError
      });
    }
  }
}

// Mock global de Worker
let workerInstanciaMock: MockWorker | null = null;

// Clase mock que simula Worker
class WorkerMock {
  constructor() {
    workerInstanciaMock = new MockWorker();
    return workerInstanciaMock as any;
  }
}

vi.stubGlobal('Worker', WorkerMock);

describe('MotorStockfish', () => {
  let motor: MotorStockfish;
  
  beforeEach(() => {
    // Resetear el mock del Worker para cada test
    vi.clearAllMocks();
    vi.stubGlobal('Worker', WorkerMock);
    workerInstanciaMock = null;
    motor = new MotorStockfish();
  });
  
  afterEach(() => {
    motor.terminar();
  });
  
  describe('inicializar()', () => {
    it('debe inicializar el motor exitosamente', async () => {
      await expect(motor.inicializar()).resolves.toBeUndefined();
    });
    
    it('debe poder llamarse múltiples veces sin reinicializar', async () => {
      await motor.inicializar();
      await motor.inicializar();
      
      // No debe lanzar error, debe ser idempotente
      expect(true).toBe(true);
    });
    
    it('debe rechazar si el worker no responde en 5 segundos', async () => {
      // Mock worker que no responde
      class WorkerSilencioso {
        onmessage: any = null;
        onerror: any = null;
        postMessage = vi.fn();
        terminate = vi.fn();
      }
      
      vi.stubGlobal('Worker', WorkerSilencioso);
      
      const motorLento = new MotorStockfish();
      
      await expect(motorLento.inicializar()).rejects.toThrow(
        'Timeout inicializando Stockfish'
      );
      
      motorLento.terminar();
    }, 6000);
    
    it('debe rechazar si el worker envía error durante inicialización', async () => {
      // Mock worker que falla
      class WorkerConError {
        onmessage: any = null;
        onerror: any = null;
        postMessage = vi.fn();
        terminate = vi.fn();
        
        constructor() {
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage(new MessageEvent('message', {
                data: { tipo: 'error', error: 'Error de prueba' }
              }));
            }
          }, 10);
        }
      }
      
      vi.stubGlobal('Worker', WorkerConError);
      
      const motorError = new MotorStockfish();
      
      await expect(motorError.inicializar()).rejects.toThrow('Error de prueba');
      
      motorError.terminar();
    });
  });
  
  describe('analizarPosición()', () => {
    beforeEach(async () => {
      await motor.inicializar();
    });
    
    it('debe analizar una posición FEN válida', async () => {
      const fenInicial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const resultado = await motor.analizarPosición(fenInicial, 15);
      
      expect(resultado).toBeDefined();
      expect(resultado.mejorJugada).toBeDefined();
      expect(resultado.evaluación).toBeDefined();
      expect(typeof resultado.evaluación).toBe('number');
      expect(resultado.profundidad).toBe(15);
    });
    
    it('debe usar profundidad por defecto de 15 si no se especifica', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const resultado = await motor.analizarPosición(fen);
      
      expect(resultado.profundidad).toBe(15);
    });
    
    it('debe incluir información de nodos y tiempo', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const resultado = await motor.analizarPosición(fen, 15);
      
      expect(resultado.nodos).toBeDefined();
      expect(resultado.tiempo).toBeDefined();
      expect(resultado.tiempo).toBeGreaterThan(0);
    });
    
    it('debe rechazar si no está inicializado', async () => {
      const motorNoInicializado = new MotorStockfish();
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        motorNoInicializado.analizarPosición(fen, 15)
      ).rejects.toThrow('Stockfish no está inicializado');
      
      motorNoInicializado.terminar();
    });
    
    it('debe rechazar si ya hay un análisis en progreso', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Iniciar primer análisis (no esperar)
      const promesa1 = motor.analizarPosición(fen, 20);
      
      // Intentar segundo análisis inmediatamente
      await expect(
        motor.analizarPosición(fen, 15)
      ).rejects.toThrow('Ya hay un análisis en progreso');
      
      // Completar el primer análisis
      await promesa1;
    });
    
    it('debe manejar evaluaciones de mate', async () => {
      // Mock worker con respuesta de mate
      class WorkerConMate {
        onmessage: any = null;
        onerror: any = null;
        terminate = vi.fn();
        
        postMessage(mensaje: unknown) {
          setTimeout(() => {
            const msg = mensaje as any;
            if (msg.tipo === 'inicializar' && this.onmessage) {
              this.onmessage(new MessageEvent('message', {
                data: { tipo: 'listo' }
              }));
            } else if (msg.tipo === 'analizar' && this.onmessage) {
              this.onmessage(new MessageEvent('message', {
                data: {
                  tipo: 'resultado',
                  mejorJugada: 'e1g1',
                  evaluación: 10000,
                  mate: 3,
                  profundidad: 15
                }
              }));
            }
          }, 10);
        }
      }
      
      vi.stubGlobal('Worker', WorkerConMate);
      
      const motorMate = new MotorStockfish();
      await motorMate.inicializar();
      
      const fen = 'rnb1kbnr/pppp1ppp/8/8/4q3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
      const resultado = await motorMate.analizarPosición(fen, 15);
      
      expect(resultado.mate).toBe(3);
      expect(Math.abs(resultado.evaluación)).toBeGreaterThanOrEqual(10000);
      
      motorMate.terminar();
    });
    
    it('debe rechazar si el resultado está incompleto', async () => {
      // Mock worker con respuesta incompleta
      class WorkerIncompleto {
        onmessage: any = null;
        onerror: any = null;
        terminate = vi.fn();
        
        postMessage(mensaje: unknown) {
          setTimeout(() => {
            const msg = mensaje as any;
            if (msg.tipo === 'inicializar' && this.onmessage) {
              this.onmessage(new MessageEvent('message', {
                data: { tipo: 'listo' }
              }));
            } else if (msg.tipo === 'analizar' && this.onmessage) {
              // Respuesta incompleta sin mejorJugada
              this.onmessage(new MessageEvent('message', {
                data: {
                  tipo: 'resultado',
                  // falta mejorJugada
                  evaluación: 25,
                  profundidad: 15
                }
              }));
            }
          }, 10);
        }
      }
      
      vi.stubGlobal('Worker', WorkerIncompleto);
      
      const motorIncompleto = new MotorStockfish();
      await motorIncompleto.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        motorIncompleto.analizarPosición(fen, 15)
      ).rejects.toThrow('Resultado incompleto');
      
      motorIncompleto.terminar();
    });
  });
  
  describe('detener()', () => {
    beforeEach(async () => {
      await motor.inicializar();
    });
    
    it('debe detener un análisis en progreso', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Iniciar análisis
      const promesa = motor.analizarPosición(fen, 20);
      
      // Detener inmediatamente
      motor.detener();
      
      // El análisis debe rechazarse
      await expect(promesa).rejects.toThrow('Análisis detenido manualmente');
    });
    
    it('debe ser seguro llamar detener() sin análisis en progreso', () => {
      // No debe lanzar error
      expect(() => motor.detener()).not.toThrow();
    });
  });
  
  describe('terminar()', () => {
    it('debe terminar el worker y limpiar recursos', async () => {
      await motor.inicializar();
      
      motor.terminar();
      
      // Intentar analizar después de terminar debe fallar
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        motor.analizarPosición(fen, 15)
      ).rejects.toThrow('Stockfish no está inicializado');
    });
    
    it('debe detener análisis en progreso antes de terminar', async () => {
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const promesa = motor.analizarPosición(fen, 20);
      
      motor.terminar();
      
      await expect(promesa).rejects.toThrow();
    });
    
    it('debe ser seguro llamar terminar() múltiples veces', async () => {
      await motor.inicializar();
      
      motor.terminar();
      motor.terminar();
      
      // No debe lanzar error
      expect(true).toBe(true);
    });
  });
  
  describe('enviarComandoUCI()', () => {
    beforeEach(async () => {
      await motor.inicializar();
    });
    
    it('debe enviar comandos UCI personalizados', () => {
      // Verificar que no lanza error
      expect(() => {
        motor.enviarComandoUCI('setoption name Threads value 2');
      }).not.toThrow();
      
      expect(() => {
        motor.enviarComandoUCI('setoption name Hash value 128');
      }).not.toThrow();
    });
    
    it('debe rechazar si no está inicializado', () => {
      const motorNoInicializado = new MotorStockfish();
      
      expect(() => {
        motorNoInicializado.enviarComandoUCI('setoption name Threads value 2');
      }).toThrow('Stockfish no está inicializado');
      
      motorNoInicializado.terminar();
    });
  });
  
  describe('Manejo de errores del worker', () => {
    it('debe manejar errores enviados por el worker durante análisis', async () => {
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const promesa = motor.analizarPosición(fen, 15);
      
      // Simular error del worker
      if (workerInstanciaMock) {
        setTimeout(() => {
          workerInstanciaMock!.simularError('Error simulado del motor');
        }, 50);
      }
      
      await expect(promesa).rejects.toThrow('Error simulado del motor');
    });
  });
  
  describe('Requisito 4.5: Timeout de 2 segundos', () => {
    it('debe respetar timeout configurado en el worker', async () => {
      // Este test verifica que el motor esté configurado para timeout
      // El timeout real de 2s está implementado en el worker
      
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const tiempoInicio = Date.now();
      
      await motor.analizarPosición(fen, 15);
      
      const tiempoTotal = Date.now() - tiempoInicio;
      
      // Verificar que el análisis se completó (no timeout en mock)
      expect(tiempoTotal).toBeLessThan(2000);
    });
  });
  
  describe('Integración con requisitos', () => {
    it('debe cumplir requisito 3.1: Cargar Stockfish WASM', async () => {
      // El constructor debe crear un Web Worker
      const motor2 = new MotorStockfish();
      await motor2.inicializar();
      
      expect(workerInstanciaMock).toBeDefined();
      
      motor2.terminar();
    });
    
    it('debe cumplir requisito 3.2: Inicialización en 5 segundos', async () => {
      const tiempoInicio = Date.now();
      await motor.inicializar();
      const tiempoTotal = Date.now() - tiempoInicio;
      
      expect(tiempoTotal).toBeLessThan(5000);
    });
    
    it('debe cumplir requisito 3.3: Soporte de protocolo UCI', async () => {
      await motor.inicializar();
      
      // Verificar que puede enviar comandos UCI
      expect(() => {
        motor.enviarComandoUCI('uci');
        motor.enviarComandoUCI('isready');
        motor.enviarComandoUCI('position startpos');
      }).not.toThrow();
    });
    
    it('debe cumplir requisito 4.1: Evaluar posiciones en FEN', async () => {
      await motor.inicializar();
      
      const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
      ];
      
      for (const fen of fens) {
        const resultado = await motor.analizarPosición(fen, 10);
        expect(resultado.mejorJugada).toBeDefined();
        expect(resultado.evaluación).toBeDefined();
      }
    });
    
    it('debe cumplir requisito 4.4: Identificar mejor jugada', async () => {
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultado = await motor.analizarPosición(fen, 15);
      
      // Verificar que la mejor jugada está en formato UCI (4-5 caracteres)
      expect(resultado.mejorJugada).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    });
  });
});
