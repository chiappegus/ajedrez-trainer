/**
 * MotorStockfish - Wrapper para Stockfish.js con soporte de Web Workers
 * 
 * Gestiona la comunicacion con Stockfish ejecutandose en un Web Worker
 * usando el protocolo UCI (Universal Chess Interface).
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisito 3.1, 3.3, 3.5, 10.5
 */

/**
 * Resultado del analisis de una posicion por Stockfish
 */
export interface ResultadoAnalisisStockfish {
  /** Mejor jugada en formato UCI (ej: "e2e4") */
  mejorJugada: string;
  /** Mejor jugada en formato SAN (ej: "e4") - opcional */
  mejorJugadaSAN?: string;
  /** Evaluacion en centipawns (positivo = ventaja blancas) */
  evaluacion: number;
  /** Numero de jugadas hasta mate (si aplica) */
  mate?: number;
  /** Profundidad de analisis alcanzada */
  profundidad: number;
  /** Numero de nodos analizados */
  nodos?: number;
  /** Tiempo de analisis en milisegundos */
  tiempo?: number;
}

/**
 * Promesa pendiente para analisis
 */
interface PromesaPendiente {
  resolve: (resultado: ResultadoAnalisisStockfish) => void;
  reject: (error: Error) => void;
  tiempoInicio: number;
}

/**
 * Clase wrapper para el motor Stockfish con Web Worker
 * 
 * Comunica directamente con stockfish.wasm.js via protocolo UCI.
 * El archivo WASM de Stockfish ES el worker (Emscripten self-contained build).
 */
export class MotorStockfish {
  private worker: Worker | null = null;
  private inicializado = false;
  private promesaActual: PromesaPendiente | null = null;
  
  // Estado del analisis actual (parseado de lineas UCI "info")
  private mejorJugadaActual: string | null = null;
  private evaluacionActual: number | null = null;
  private mateActual: number | null = null;
  private profundidadActual = 0;
  private nodosActuales = 0;

  /**
   * Inicializa el motor Stockfish cargando el Web Worker
   * @throws Error si la inicializacion falla o toma mas de 10 segundos
   */
  async inicializar(): Promise<void> {
    if (this.inicializado) {
      return;
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        // stockfish.wasm.js ES el worker (Emscripten self-contained build)
        // Se comunica via UCI: recibe strings, responde strings
        this.worker = new Worker('/stockfish/stockfish.wasm.js');

        // Timeout de 10 segundos para inicializacion
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout inicializando Stockfish (10 segundos)'));
        }, 10000);
        
        let uciOk = false;
        
        // Manejador de mensajes UCI del worker
        this.worker.onmessage = (evento: MessageEvent) => {
          const linea: string = evento.data;
          
          if (!this.inicializado) {
            // Fase de inicializacion
            if (linea === 'uciok') {
              uciOk = true;
              this.worker!.postMessage('isready');
            } else if (linea === 'readyok' && uciOk) {
              clearTimeout(timeoutId);
              this.inicializado = true;
              // Reasignar handler para fase de analisis
              this.worker!.onmessage = (ev: MessageEvent) => {
                this.manejarMensajeUCI(ev.data as string);
              };
              resolve();
            }
          }
        };
        
        // Manejador de errores del worker
        this.worker.onerror = (error: ErrorEvent) => {
          clearTimeout(timeoutId);
          if (!this.inicializado) {
            reject(new Error(`Error en worker Stockfish: ${error.message}`));
          } else if (this.promesaActual) {
            this.promesaActual.reject(new Error(`Error en worker: ${error.message}`));
            this.promesaActual = null;
          }
        };
        
        // Iniciar protocolo UCI
        this.worker.postMessage('uci');
        
      } catch (error) {
        reject(new Error(
          `Error creando worker: ${error instanceof Error ? error.message : String(error)}`
        ));
      }
    });
  }
  
  /**
   * Maneja mensajes UCI durante la fase de analisis
   */
  private manejarMensajeUCI(linea: string): void {
    if (!linea || typeof linea !== 'string') return;
    
    // Informacion de analisis en progreso
    if (linea.startsWith('info') && this.promesaActual) {
      // Extraer evaluacion
      const matchMate = linea.match(/score mate (-?\d+)/);
      if (matchMate) {
        this.mateActual = parseInt(matchMate[1], 10);
        this.evaluacionActual = this.mateActual > 0 ? 10000 : -10000;
      } else {
        const matchCp = linea.match(/score cp (-?\d+)/);
        if (matchCp) {
          this.evaluacionActual = parseInt(matchCp[1], 10);
          this.mateActual = null;
        }
      }
      
      // Extraer profundidad
      const matchDepth = linea.match(/depth (\d+)/);
      if (matchDepth) {
        this.profundidadActual = parseInt(matchDepth[1], 10);
      }
      
      // Extraer nodos
      const matchNodes = linea.match(/nodes (\d+)/);
      if (matchNodes) {
        this.nodosActuales = parseInt(matchNodes[1], 10);
      }
      return;
    }
    
    // Mejor jugada (resultado final del analisis)
    if (linea.startsWith('bestmove') && this.promesaActual) {
      const partes = linea.split(' ');
      this.mejorJugadaActual = partes[1] || null;
      
      const tiempoTotal = Date.now() - this.promesaActual.tiempoInicio;
      
      if (!this.mejorJugadaActual || this.evaluacionActual === null) {
        this.promesaActual.reject(
          new Error('Resultado incompleto de Stockfish')
        );
      } else {
        const resultado: ResultadoAnalisisStockfish = {
          mejorJugada: this.mejorJugadaActual,
          evaluacion: this.evaluacionActual,
          mate: this.mateActual ?? undefined,
          profundidad: this.profundidadActual,
          nodos: this.nodosActuales || undefined,
          tiempo: tiempoTotal
        };
        this.promesaActual.resolve(resultado);
      }
      
      // Reset
      this.promesaActual = null;
      this.mejorJugadaActual = null;
      this.evaluacionActual = null;
      this.mateActual = null;
      this.profundidadActual = 0;
      this.nodosActuales = 0;
    }
  }
  
  /**
   * Analiza una posicion de ajedrez usando Stockfish
   * 
   * @param fen Posicion en notacion FEN
   * @param profundidad Profundidad de analisis en plies (por defecto 15)
   * @returns Resultado del analisis con mejor jugada y evaluacion
   * @throws Error si Stockfish no esta inicializado o el analisis falla
   */
  async analizarPosicion(
    fen: string,
    profundidad = 15
  ): Promise<ResultadoAnalisisStockfish> {
    if (!this.inicializado || !this.worker) {
      throw new Error('Stockfish no esta inicializado. Llama a inicializar() primero.');
    }
    
    if (this.promesaActual !== null) {
      throw new Error('Ya hay un analisis en progreso. Espera a que termine o llama a detener().');
    }
    
    return new Promise<ResultadoAnalisisStockfish>((resolve, reject) => {
      this.promesaActual = {
        resolve,
        reject,
        tiempoInicio: Date.now()
      };
      
      // Reset estado
      this.mejorJugadaActual = null;
      this.evaluacionActual = null;
      this.mateActual = null;
      this.profundidadActual = 0;
      this.nodosActuales = 0;
      
      // Enviar comandos UCI
      this.worker!.postMessage(`position fen ${fen}`);
      this.worker!.postMessage(`go depth ${profundidad}`);
    });
  }
  
  /**
   * Detiene el analisis actual y libera recursos
   */
  detener(): void {
    if (this.worker) {
      this.worker.postMessage('stop');
      
      if (this.promesaActual) {
        this.promesaActual.reject(new Error('Analisis detenido manualmente'));
        this.promesaActual = null;
      }
    }
  }
  
  /**
   * Termina el worker y libera todos los recursos
   */
  terminar(): void {
    this.detener();
    
    if (this.worker) {
      this.worker.postMessage('quit');
      this.worker.terminate();
      this.worker = null;
    }
    
    this.inicializado = false;
  }
  
  /**
   * Envia un comando UCI personalizado directamente a Stockfish
   * 
   * @param comando Comando UCI (ej: "setoption name Hash value 128")
   */
  enviarComandoUCI(comando: string): void {
    if (!this.inicializado || !this.worker) {
      throw new Error('Stockfish no esta inicializado');
    }
    
    this.worker.postMessage(comando);
  }
}
