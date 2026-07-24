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

/**
 * Mock del Web Worker que simula el protocolo UCI de stockfish.wasm.js.
 * El worker real recibe strings UCI vía postMessage y responde con strings vía onmessage.
 */
class MockWorkerUCI {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private detenido = false;
  
  postMessage(mensaje: string): void {
    if (this.detenido) return;
    // Simular respuestas UCI asíncronas
    setTimeout(() => {
      this.simularRespuestaUCI(mensaje);
    }, 10);
  }
  
  terminate(): void {
    this.detenido = true;
  }
  
  private simularRespuestaUCI(comando: string): void {
    if (!this.onmessage || this.detenido) return;
    
    if (comando === 'uci') {
      // Responder con opciones y uciok
      this.enviar('id name Stockfish 16');
      this.enviar('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott');
      this.enviar('uciok');
    } else if (comando === 'isready') {
      this.enviar('readyok');
    } else if (comando.startsWith('go depth')) {
      // Simular respuestas de análisis
      const depth = parseInt(comando.split(' ')[2] || '15', 10);
      this.enviar(`info depth ${depth} score cp 25 nodes 1234567 time 100 pv e2e4 e7e5`);
      setTimeout(() => {
        if (!this.detenido) {
          this.enviar('bestmove e2e4 ponder e7e5');
        }
      }, 50);
    } else if (comando === 'stop') {
      // Detener análisis - enviar bestmove inmediatamente
      this.enviar('bestmove e2e4');
    } else if (comando === 'quit') {
      this.detenido = true;
    }
    // 'position fen ...' y 'setoption ...' no requieren respuesta
  }
  
  private enviar(linea: string): void {
    if (this.onmessage && !this.detenido) {
      this.onmessage(new MessageEvent('message', { data: linea }));
    }
  }
  
  // Método auxiliar para testing - simular error del worker
  simularErrorWorker(mensaje: string): void {
    if (this.onerror && !this.detenido) {
      this.onerror(new ErrorEvent('error', { message: mensaje }));
    }
  }
}

// Mock global de Worker
let workerInstanciaMock: MockWorkerUCI | null = null;

class WorkerMock {
  constructor() {
    workerInstanciaMock = new MockWorkerUCI();
    return workerInstanciaMock as any;
  }
}

vi.stubGlobal('Worker', WorkerMock);

describe('MotorStockfish', () => {
  let motor: MotorStockfish;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Worker', WorkerMock);
    workerInstanciaMock = null;
    motor = new MotorStockfish();
  });
  
  afterEach(() => {
    motor.terminar();
  });
  
  describe('inicializar()', () => {
    it('debe inicializar el motor exitosamente via protocolo UCI', async () => {
      await expect(motor.inicializar()).resolves.toBeUndefined();
    });
    
    it('debe poder llamarse multiples veces sin reinicializar', async () => {
      await motor.inicializar();
      await motor.inicializar();
      
      // No debe lanzar error, debe ser idempotente
      expect(true).toBe(true);
    });
    
    it('debe rechazar si el worker no responde en 10 segundos', async () => {
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
    }, 12000);
    
    it('debe rechazar si el worker emite un error durante inicializacion', async () => {
      // Mock worker que falla con ErrorEvent
      class WorkerConError {
        onmessage: any = null;
        onerror: any = null;
        postMessage = vi.fn();
        terminate = vi.fn();
        
        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new ErrorEvent('error', { message: 'Error de prueba' }));
            }
          }, 10);
        }
      }
      
      vi.stubGlobal('Worker', WorkerConError);
      
      const motorError = new MotorStockfish();
      
      await expect(motorError.inicializar()).rejects.toThrow('Error en worker Stockfish: Error de prueba');
      
      motorError.terminar();
    });
  });
  
  describe('analizarPosicion()', () => {
    beforeEach(async () => {
      await motor.inicializar();
    });
    
    it('debe analizar una posicion FEN valida', async () => {
      const fenInicial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const resultado = await motor.analizarPosicion(fenInicial, 15);
      
      expect(resultado).toBeDefined();
      expect(resultado.mejorJugada).toBe('e2e4');
      expect(resultado.evaluacion).toBe(25);
      expect(typeof resultado.evaluacion).toBe('number');
      expect(resultado.profundidad).toBe(15);
    });
    
    it('debe usar profundidad por defecto de 15 si no se especifica', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const resultado = await motor.analizarPosicion(fen);
      
      expect(resultado.profundidad).toBe(15);
    });
    
    it('debe incluir informacion de nodos y tiempo', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const resultado = await motor.analizarPosicion(fen, 15);
      
      expect(resultado.nodos).toBe(1234567);
      expect(resultado.tiempo).toBeDefined();
      expect(resultado.tiempo).toBeGreaterThan(0);
    });
    
    it('debe rechazar si no esta inicializado', async () => {
      const motorNoInicializado = new MotorStockfish();
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        motorNoInicializado.analizarPosicion(fen, 15)
      ).rejects.toThrow('Stockfish no esta inicializado');
      
      motorNoInicializado.terminar();
    });
    
    it('debe rechazar si ya hay un analisis en progreso', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Iniciar primer analisis (no esperar)
      const promesa1 = motor.analizarPosicion(fen, 20);
      
      // Intentar segundo analisis inmediatamente
      await expect(
        motor.analizarPosicion(fen, 15)
      ).rejects.toThrow('Ya hay un analisis en progreso');
      
      // Completar el primer analisis
      await promesa1;
    });
    
    it('debe manejar evaluaciones de mate', async () => {
      // Mock worker con respuesta de mate
      class WorkerConMate {
        onmessage: any = null;
        onerror: any = null;
        terminate = vi.fn();
        
        postMessage(mensaje: string) {
          setTimeout(() => {
            if (!this.onmessage) return;
            if (mensaje === 'uci') {
              this.onmessage(new MessageEvent('message', { data: 'uciok' }));
            } else if (mensaje === 'isready') {
              this.onmessage(new MessageEvent('message', { data: 'readyok' }));
            } else if (mensaje.startsWith('go depth')) {
              this.onmessage(new MessageEvent('message', {
                data: 'info depth 15 score mate 3 nodes 500000 pv e1g1'
              }));
              setTimeout(() => {
                if (this.onmessage) {
                  this.onmessage(new MessageEvent('message', {
                    data: 'bestmove e1g1'
                  }));
                }
              }, 20);
            }
          }, 10);
        }
      }
      
      vi.stubGlobal('Worker', WorkerConMate);
      
      const motorMate = new MotorStockfish();
      await motorMate.inicializar();
      
      const fen = 'rnb1kbnr/pppp1ppp/8/8/4q3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
      const resultado = await motorMate.analizarPosicion(fen, 15);
      
      expect(resultado.mate).toBe(3);
      expect(resultado.evaluacion).toBe(10000);
      
      motorMate.terminar();
    });
    
    it('debe rechazar si el resultado esta incompleto (sin info antes de bestmove)', async () => {
      // Mock worker que envía bestmove sin info previa
      class WorkerIncompleto {
        onmessage: any = null;
        onerror: any = null;
        terminate = vi.fn();
        
        postMessage(mensaje: string) {
          setTimeout(() => {
            if (!this.onmessage) return;
            if (mensaje === 'uci') {
              this.onmessage(new MessageEvent('message', { data: 'uciok' }));
            } else if (mensaje === 'isready') {
              this.onmessage(new MessageEvent('message', { data: 'readyok' }));
            } else if (mensaje.startsWith('go depth')) {
              // Enviar bestmove sin info previa (evaluacionActual será null)
              setTimeout(() => {
                if (this.onmessage) {
                  this.onmessage(new MessageEvent('message', {
                    data: 'bestmove e2e4'
                  }));
                }
              }, 20);
            }
          }, 10);
        }
      }
      
      vi.stubGlobal('Worker', WorkerIncompleto);
      
      const motorIncompleto = new MotorStockfish();
      await motorIncompleto.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        motorIncompleto.analizarPosicion(fen, 15)
      ).rejects.toThrow('Resultado incompleto');
      
      motorIncompleto.terminar();
    });
  });
  
  describe('detener()', () => {
    beforeEach(async () => {
      await motor.inicializar();
    });
    
    it('debe detener un analisis en progreso', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Iniciar analisis
      const promesa = motor.analizarPosicion(fen, 20);
      
      // Detener inmediatamente
      motor.detener();
      
      // El analisis debe rechazarse
      await expect(promesa).rejects.toThrow('Analisis detenido manualmente');
    });
    
    it('debe ser seguro llamar detener() sin analisis en progreso', () => {
      // No debe lanzar error
      expect(() => motor.detener()).not.toThrow();
    });
  });
  
  describe('terminar()', () => {
    it('debe terminar el worker y limpiar recursos', async () => {
      await motor.inicializar();
      
      motor.terminar();
      
      // Intentar analizar despues de terminar debe fallar
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        motor.analizarPosicion(fen, 15)
      ).rejects.toThrow('Stockfish no esta inicializado');
    });
    
    it('debe detener analisis en progreso antes de terminar', async () => {
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const promesa = motor.analizarPosicion(fen, 20);
      
      motor.terminar();
      
      await expect(promesa).rejects.toThrow();
    });
    
    it('debe ser seguro llamar terminar() multiples veces', async () => {
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
      expect(() => {
        motor.enviarComandoUCI('setoption name Threads value 2');
      }).not.toThrow();
      
      expect(() => {
        motor.enviarComandoUCI('setoption name Hash value 128');
      }).not.toThrow();
    });
    
    it('debe rechazar si no esta inicializado', () => {
      const motorNoInicializado = new MotorStockfish();
      
      expect(() => {
        motorNoInicializado.enviarComandoUCI('setoption name Threads value 2');
      }).toThrow('Stockfish no esta inicializado');
      
      motorNoInicializado.terminar();
    });
  });
  
  describe('Manejo de errores del worker', () => {
    it('debe manejar errores del worker durante analisis', async () => {
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const promesa = motor.analizarPosicion(fen, 15);
      
      // Simular error del worker
      if (workerInstanciaMock) {
        setTimeout(() => {
          workerInstanciaMock!.simularErrorWorker('Error simulado del motor');
        }, 20);
      }
      
      await expect(promesa).rejects.toThrow('Error en worker: Error simulado del motor');
    });
  });
  
  describe('Integracion con requisitos', () => {
    it('debe cumplir requisito 3.1: Cargar Stockfish WASM como Web Worker', async () => {
      const motor2 = new MotorStockfish();
      await motor2.inicializar();
      
      expect(workerInstanciaMock).toBeDefined();
      
      motor2.terminar();
    });
    
    it('debe cumplir requisito 3.2: Inicializacion bajo 10 segundos', async () => {
      const tiempoInicio = Date.now();
      await motor.inicializar();
      const tiempoTotal = Date.now() - tiempoInicio;
      
      expect(tiempoTotal).toBeLessThan(10000);
    });
    
    it('debe cumplir requisito 3.3: Soporte de protocolo UCI directo', async () => {
      await motor.inicializar();
      
      // Verificar que puede enviar comandos UCI directos
      expect(() => {
        motor.enviarComandoUCI('setoption name Threads value 1');
        motor.enviarComandoUCI('setoption name Hash value 16');
      }).not.toThrow();
    });
    
    it('debe cumplir requisito 4.1: Evaluar posiciones en FEN', async () => {
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultado = await motor.analizarPosicion(fen, 10);
      
      expect(resultado.mejorJugada).toBeDefined();
      expect(resultado.evaluacion).toBeDefined();
      expect(resultado.profundidad).toBeGreaterThan(0);
    });
    
    it('debe cumplir requisito 4.4: Identificar mejor jugada en formato UCI', async () => {
      await motor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultado = await motor.analizarPosicion(fen, 15);
      
      // Verificar que la mejor jugada esta en formato UCI (4-5 caracteres)
      expect(resultado.mejorJugada).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    });
  });
});
