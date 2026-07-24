/**
 * Integration Tests for Stockfish Direct UCI Communication
 * 
 * This test suite verifies the complete initialization and analysis flows
 * work correctly with direct UCI communication to stockfish.wasm.js.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4**
 * 
 * Feature: lichess-game-analysis
 * Test Level: Integration
 * 
 * Test Scenarios:
 * 1. Full initialization flow (load worker -> UCI handshake -> ready)
 * 2. Full analysis flow (set position -> analyze -> receive results)
 * 3. Error recovery (missing files, timeouts)
 * 4. Browser console verification (no constructor errors)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MotorStockfish } from './MotorStockfish';

/**
 * UCI Mock Worker that simulates the behavior of stockfish.wasm.js.
 * The real stockfish.wasm.js receives UCI strings via postMessage
 * and responds with UCI output strings via onmessage.
 */
class UCIMockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private terminated = false;

  postMessage(msg: string): void {
    if (this.terminated) return;
    setTimeout(() => this.handleUCI(msg), 5);
  }

  terminate(): void {
    this.terminated = true;
  }

  private handleUCI(cmd: string): void {
    if (this.terminated || !this.onmessage) return;

    if (cmd === 'uci') {
      this.send('id name Stockfish 16');
      this.send('uciok');
    } else if (cmd === 'isready') {
      this.send('readyok');
    } else if (cmd.startsWith('go depth')) {
      const depth = parseInt(cmd.split(' ')[2] || '15', 10);
      this.send(`info depth ${depth} score cp 30 nodes 999000 time 80 pv e2e4 e7e5 g1f3`);
      setTimeout(() => {
        if (!this.terminated && this.onmessage) {
          this.send('bestmove e2e4 ponder e7e5');
        }
      }, 30);
    } else if (cmd === 'stop') {
      this.send('bestmove e2e4');
    } else if (cmd === 'quit') {
      this.terminated = true;
    }
  }

  private send(line: string): void {
    if (this.onmessage && !this.terminated) {
      this.onmessage(new MessageEvent('message', { data: line }));
    }
  }
}

// Global Worker mock
let mockWorkerInstance: UCIMockWorker | null = null;

class WorkerMock {
  constructor() {
    mockWorkerInstance = new UCIMockWorker();
    return mockWorkerInstance as any;
  }
}

vi.stubGlobal('Worker', WorkerMock);

describe('Integration: Stockfish Direct UCI Communication', () => {
  let motor: MotorStockfish;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Worker', WorkerMock);
    mockWorkerInstance = null;
    motor = new MotorStockfish();
  });
  
  afterEach(() => {
    if (motor) {
      motor.terminar();
    }
  });
  
  describe('Full Initialization Flow', () => {
    it('should complete full initialization: create worker -> uci -> uciok -> isready -> readyok', async () => {
      await expect(motor.inicializar()).resolves.toBeUndefined();
      
      // Verify motor is initialized
      expect(motor['inicializado']).toBe(true);
      expect(motor['worker']).not.toBeNull();
    }, 10000);
    
    it('should handle initialization timeout gracefully (10 second limit)', async () => {
      // Mock Worker that never responds
      class SilentWorker {
        onmessage: any = null;
        onerror: any = null;
        postMessage = vi.fn();
        terminate = vi.fn();
      }
      
      vi.stubGlobal('Worker', SilentWorker);
      
      const timeoutMotor = new MotorStockfish();
      
      await expect(timeoutMotor.inicializar()).rejects.toThrow(/Timeout inicializando Stockfish/);
      
      timeoutMotor.terminar();
    }, 12000);
  });
  
  describe('Full Analysis Flow', () => {
    it('should complete full analysis flow: position -> go depth -> info -> bestmove', async () => {
      await motor.inicializar();
      
      const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const resultado = await motor.analizarPosicion(startFEN, 10);
      
      // Verify result structure
      expect(resultado).toBeDefined();
      expect(resultado.mejorJugada).toBe('e2e4');
      expect(typeof resultado.mejorJugada).toBe('string');
      expect(resultado.mejorJugada.length).toBeGreaterThan(0);
      
      // Verify evaluation
      expect(resultado.evaluacion).toBe(30);
      expect(typeof resultado.evaluacion).toBe('number');
      
      // Verify depth
      expect(resultado.profundidad).toBe(10);
      
      // Verify timing
      expect(resultado.tiempo).toBeDefined();
      expect(resultado.tiempo).toBeGreaterThan(0);
    }, 10000);
    
    it('should analyze multiple positions sequentially', async () => {
      await motor.inicializar();
      
      const positions = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
      ];
      
      for (const fen of positions) {
        const resultado = await motor.analizarPosicion(fen, 8);
        
        expect(resultado).toBeDefined();
        expect(resultado.mejorJugada).toBeDefined();
        expect(resultado.evaluacion).toBeDefined();
      }
    }, 30000);
    
    it('should extract mate scores correctly', async () => {
      // Custom mock with mate response
      class MateWorker {
        onmessage: any = null;
        onerror: any = null;
        terminate = vi.fn();
        
        postMessage(msg: string) {
          setTimeout(() => {
            if (!this.onmessage) return;
            if (msg === 'uci') {
              this.onmessage(new MessageEvent('message', { data: 'uciok' }));
            } else if (msg === 'isready') {
              this.onmessage(new MessageEvent('message', { data: 'readyok' }));
            } else if (msg.startsWith('go depth')) {
              this.onmessage(new MessageEvent('message', {
                data: 'info depth 15 score mate -1 nodes 300000 pv h4f2'
              }));
              setTimeout(() => {
                if (this.onmessage) {
                  this.onmessage(new MessageEvent('message', { data: 'bestmove h4f2' }));
                }
              }, 10);
            }
          }, 5);
        }
      }
      
      vi.stubGlobal('Worker', MateWorker);
      
      const motorMate = new MotorStockfish();
      await motorMate.inicializar();
      
      const mateFEN = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
      const resultado = await motorMate.analizarPosicion(mateFEN, 15);
      
      expect(resultado.mate).toBe(-1);
      expect(resultado.evaluacion).toBe(-10000);
      
      motorMate.terminar();
    }, 10000);
    
    it('should handle analysis hang by stopping and rejecting', async () => {
      // Worker that never sends bestmove for analysis
      class HangingWorker {
        onmessage: any = null;
        onerror: any = null;
        terminate = vi.fn();
        
        postMessage(msg: string) {
          setTimeout(() => {
            if (!this.onmessage) return;
            if (msg === 'uci') {
              this.onmessage(new MessageEvent('message', { data: 'uciok' }));
            } else if (msg === 'isready') {
              this.onmessage(new MessageEvent('message', { data: 'readyok' }));
            }
            // For 'go depth ...' we simply never respond
          }, 5);
        }
      }
      
      vi.stubGlobal('Worker', HangingWorker);
      
      const hangMotor = new MotorStockfish();
      await hangMotor.inicializar();
      
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const promesa = hangMotor.analizarPosicion(fen, 10);
      
      // Manually stop after short wait
      setTimeout(() => hangMotor.detener(), 100);
      
      await expect(promesa).rejects.toThrow('Analisis detenido manualmente');
      
      hangMotor.terminar();
    }, 5000);
  });
  
  describe('Error Recovery Scenarios', () => {
    it('should reject concurrent analysis attempts', async () => {
      await motor.inicializar();
      
      const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Start first analysis
      const analysis1 = motor.analizarPosicion(startFEN, 15);
      
      // Immediately try second analysis (should fail)
      await expect(
        motor.analizarPosicion(startFEN, 15)
      ).rejects.toThrow(/Ya hay un analisis en progreso/);
      
      // Wait for first to complete
      await analysis1;
    }, 10000);
    
    it('should reject analysis if not initialized', async () => {
      const uninitializedMotor = new MotorStockfish();
      
      const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        uninitializedMotor.analizarPosicion(startFEN, 10)
      ).rejects.toThrow(/no esta inicializado/);
      
      uninitializedMotor.terminar();
    });
    
    it('should handle worker termination gracefully', async () => {
      await motor.inicializar();
      
      expect(motor['inicializado']).toBe(true);
      expect(motor['worker']).not.toBeNull();
      
      motor.terminar();
      
      expect(motor['inicializado']).toBe(false);
      expect(motor['worker']).toBeNull();
      
      const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await expect(
        motor.analizarPosicion(startFEN, 10)
      ).rejects.toThrow(/no esta inicializado/);
    });
  });
  
  describe('UCI Communication Preservation', () => {
    it('should preserve UCI protocol message handling', async () => {
      await motor.inicializar();
      
      const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const resultado = await motor.analizarPosicion(startFEN, 10);
      
      // Verify UCI result structure
      expect(resultado).toHaveProperty('mejorJugada');
      expect(resultado).toHaveProperty('evaluacion');
      expect(resultado).toHaveProperty('profundidad');
      
      expect(typeof resultado.mejorJugada).toBe('string');
      expect(typeof resultado.evaluacion).toBe('number');
      expect(typeof resultado.profundidad).toBe('number');
    }, 10000);
    
    it('should send custom UCI commands directly', async () => {
      await motor.inicializar();
      
      // Should not throw
      expect(() => {
        motor.enviarComandoUCI('setoption name Hash value 128');
      }).not.toThrow();
    });
  });
  
  describe('Browser Console Verification', () => {
    it('should not produce "Stockfish is not a constructor" errors during initialization', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      await motor.inicializar();
      
      const constructorErrors = consoleErrorSpy.mock.calls.filter(call => 
        call.some(arg => 
          typeof arg === 'string' && 
          arg.toLowerCase().includes('constructor')
        )
      );
      
      expect(constructorErrors.length).toBe(0);
      
      consoleErrorSpy.mockRestore();
    }, 10000);
    
    it('should not produce "Stockfish is not a constructor" errors during analysis', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      await motor.inicializar();
      
      const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      await motor.analizarPosicion(startFEN, 10);
      
      const constructorErrors = consoleErrorSpy.mock.calls.filter(call => 
        call.some(arg => 
          typeof arg === 'string' && 
          arg.toLowerCase().includes('constructor')
        )
      );
      
      expect(constructorErrors.length).toBe(0);
      
      consoleErrorSpy.mockRestore();
    }, 10000);
  });
});
