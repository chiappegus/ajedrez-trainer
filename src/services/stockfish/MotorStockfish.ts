/**
 * MotorStockfish - Wrapper para Stockfish.js con soporte de Web Workers
 * 
 * Gestiona la comunicación con Stockfish ejecutándose en un Web Worker
 * usando el protocolo UCI (Universal Chess Interface).
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisito 3.1, 3.3, 3.5, 10.5
 */

import type { MensajeHaciaTrabajador, MensajeDesdeWorker } from './stockfish-worker';

/**
 * Resultado del análisis de una posición por Stockfish
 */
export interface ResultadoAnálisisStockfish {
  /** Mejor jugada en formato UCI (ej: "e2e4") */
  mejorJugada: string;
  /** Mejor jugada en formato SAN (ej: "e4") - opcional */
  mejorJugadaSAN?: string;
  /** Evaluación en centipawns (positivo = ventaja blancas) */
  evaluación: number;
  /** Número de jugadas hasta mate (si aplica) */
  mate?: number;
  /** Profundidad de análisis alcanzada */
  profundidad: number;
  /** Número de nodos analizados */
  nodos?: number;
  /** Tiempo de análisis en milisegundos */
  tiempo?: number;
}

/**
 * Promesa pendiente para análisis
 */
interface PromesaPendiente {
  resolve: (resultado: ResultadoAnálisisStockfish) => void;
  reject: (error: Error) => void;
  tiempoInicio: number;
}

/**
 * Clase wrapper para el motor Stockfish con Web Worker
 * 
 * Gestiona la comunicación asíncrona con Stockfish ejecutándose en
 * un Web Worker separado para evitar bloquear el hilo principal.
 */
export class MotorStockfish {
  private worker: Worker | null = null;
  private inicializado = false;
  private promesaActual: PromesaPendiente | null = null;
  
  /**
   * Inicializa el motor Stockfish cargando el Web Worker
   * @throws Error si la inicialización falla o toma más de 5 segundos
   */
  async inicializar(): Promise<void> {
    if (this.inicializado) {
      return;
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        // Crear el Web Worker desde el archivo TypeScript
        // Vite/el bundler se encargará de empaquetar el worker correctamente
        this.worker = new Worker(
          new URL('./stockfish-worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Timeout de 5 segundos para inicialización (requisito 3.2)
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout inicializando Stockfish (5 segundos)'));
        }, 5000);
        
        // Manejador de mensajes del worker
        this.worker.onmessage = (evento: MessageEvent<MensajeDesdeWorker>) => {
          const mensaje = evento.data;
          
          switch (mensaje.tipo) {
            case 'listo':
              clearTimeout(timeoutId);
              this.inicializado = true;
              resolve();
              break;
              
            case 'resultado':
              this.manejarResultado(mensaje);
              break;
              
            case 'error':
              if (!this.inicializado) {
                clearTimeout(timeoutId);
                reject(new Error(mensaje.error || 'Error desconocido inicializando'));
              } else {
                this.manejarError(mensaje.error || 'Error desconocido');
              }
              break;
              
            case 'info':
              // Mensajes informativos, se pueden ignorar o loggear
              console.debug('[Stockfish Worker]', mensaje.mensaje);
              break;
          }
        };
        
        // Manejador de errores del worker
        this.worker.onerror = (error: ErrorEvent) => {
          clearTimeout(timeoutId);
          if (!this.inicializado) {
            reject(new Error(`Error en worker: ${error.message}`));
          } else {
            this.manejarError(`Error en worker: ${error.message}`);
          }
        };
        
        // Enviar comando de inicialización al worker
        const mensajeInicializar: MensajeHaciaTrabajador = {
          tipo: 'inicializar'
        };
        this.worker.postMessage(mensajeInicializar);
        
      } catch (error) {
        reject(new Error(
          `Error creando worker: ${error instanceof Error ? error.message : String(error)}`
        ));
      }
    });
  }
  
  /**
   * Analiza una posición de ajedrez usando Stockfish
   * 
   * @param fen Posición en notación FEN
   * @param profundidad Profundidad de análisis en plies (por defecto 15)
   * @returns Resultado del análisis con mejor jugada y evaluación
   * @throws Error si Stockfish no está inicializado o el análisis falla
   */
  async analizarPosición(
    fen: string,
    profundidad = 15
  ): Promise<ResultadoAnálisisStockfish> {
    if (!this.inicializado || !this.worker) {
      throw new Error('Stockfish no está inicializado. Llama a inicializar() primero.');
    }
    
    if (this.promesaActual !== null) {
      throw new Error('Ya hay un análisis en progreso. Espera a que termine o llama a detener().');
    }
    
    return new Promise<ResultadoAnálisisStockfish>((resolve, reject) => {
      this.promesaActual = {
        resolve,
        reject,
        tiempoInicio: Date.now()
      };
      
      const mensaje: MensajeHaciaTrabajador = {
        tipo: 'analizar',
        fen,
        profundidad
      };
      
      this.worker!.postMessage(mensaje);
    });
  }
  
  /**
   * Maneja el resultado exitoso de un análisis
   */
  private manejarResultado(mensaje: MensajeDesdeWorker): void {
    if (!this.promesaActual) {
      console.warn('Resultado recibido sin promesa pendiente');
      return;
    }
    
    const tiempoTotal = Date.now() - this.promesaActual.tiempoInicio;
    
    // Validar que tenemos los datos mínimos
    if (!mensaje.mejorJugada || mensaje.evaluación === undefined) {
      this.promesaActual.reject(
        new Error('Resultado incompleto de Stockfish: falta mejorJugada o evaluación')
      );
      this.promesaActual = null;
      return;
    }
    
    const resultado: ResultadoAnálisisStockfish = {
      mejorJugada: mensaje.mejorJugada,
      evaluación: mensaje.evaluación,
      mate: mensaje.mate,
      profundidad: mensaje.profundidad || 0,
      nodos: mensaje.nodos,
      tiempo: tiempoTotal
    };
    
    this.promesaActual.resolve(resultado);
    this.promesaActual = null;
  }
  
  /**
   * Maneja errores del análisis
   */
  private manejarError(mensajeError: string): void {
    if (this.promesaActual) {
      this.promesaActual.reject(new Error(mensajeError));
      this.promesaActual = null;
    } else {
      console.error('[MotorStockfish]', mensajeError);
    }
  }
  
  /**
   * Detiene el análisis actual y libera recursos
   */
  detener(): void {
    if (this.worker) {
      const mensaje: MensajeHaciaTrabajador = {
        tipo: 'detener'
      };
      this.worker.postMessage(mensaje);
      
      // Rechazar promesa pendiente si existe
      if (this.promesaActual) {
        this.promesaActual.reject(new Error('Análisis detenido manualmente'));
        this.promesaActual = null;
      }
    }
  }
  
  /**
   * Termina el worker y libera todos los recursos
   * Debe llamarse cuando ya no se necesite el motor
   */
  terminar(): void {
    this.detener();
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.inicializado = false;
  }
  
  /**
   * Envía un comando UCI personalizado directamente a Stockfish
   * Útil para configuración avanzada
   * 
   * @param comando Comando UCI (ej: "setoption name Hash value 128")
   */
  enviarComandoUCI(comando: string): void {
    if (!this.inicializado || !this.worker) {
      throw new Error('Stockfish no está inicializado');
    }
    
    const mensaje: MensajeHaciaTrabajador = {
      tipo: 'comando',
      comando
    };
    
    this.worker.postMessage(mensaje);
  }
}
