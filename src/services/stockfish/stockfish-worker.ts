/**
 * Web Worker para Stockfish WASM
 * 
 * Este worker maneja la comunicación bidireccional con Stockfish.js/WASM
 * usando el protocolo UCI (Universal Chess Interface).
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 3.1, 3.3, 10.5
 */

/// <reference path="./worker-types.d.ts" />

/**
 * Tipos de mensajes que el worker puede recibir del hilo principal
 */
interface MensajeHaciaTrabajador {
  tipo: 'inicializar' | 'analizar' | 'detener' | 'comando';
  fen?: string;
  profundidad?: number;
  comando?: string;
}

/**
 * Tipos de mensajes que el worker envía al hilo principal
 */
interface MensajeDesdeWorker {
  tipo: 'listo' | 'resultado' | 'error' | 'info';
  error?: string;
  mejorJugada?: string;
  evaluación?: number;
  mate?: number;
  profundidad?: number;
  nodos?: number;
  tiempo?: number;
  mensaje?: string;
}

// Referencia al motor Stockfish (se cargará dinámicamente)
let stockfish: Worker | null = null;

// Estado del análisis actual
let analizando = false;
let timeoutId: number | null = null;
let mejorJugadaActual: string | null = null;
let evaluaciónActual: number | null = null;
let mateActual: number | null = null;
let profundidadActual = 0;
let nodosActuales = 0;

/**
 * Envía un mensaje al hilo principal
 */
function enviarMensaje(mensaje: MensajeDesdeWorker): void {
  self.postMessage(mensaje);
}

/**
 * Parsea la línea de info de Stockfish para extraer evaluación
 * Formato: "info depth 15 score cp 25" o "info depth 20 score mate 3"
 */
function extraerEvaluación(líneaInfo: string): { cp?: number; mate?: number } {
  const resultado: { cp?: number; mate?: number } = {};
  
  // Buscar mate
  const matchMate = líneaInfo.match(/score mate (-?\d+)/);
  if (matchMate) {
    const jugadasMate = Number.parseInt(matchMate[1], 10);
    resultado.mate = jugadasMate;
    // Normalizar a centipawns para comparación (mate vale como posición ganadora)
    resultado.cp = jugadasMate > 0 ? 10000 : -10000;
    return resultado;
  }
  
  // Buscar centipawns
  const matchCp = líneaInfo.match(/score cp (-?\d+)/);
  if (matchCp) {
    resultado.cp = Number.parseInt(matchCp[1], 10);
  }
  
  return resultado;
}

/**
 * Extrae información de profundidad de la línea info
 */
function extraerProfundidad(líneaInfo: string): number | null {
  const match = líneaInfo.match(/depth (\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Extrae número de nodos analizados
 */
function extraerNodos(líneaInfo: string): number | null {
  const match = líneaInfo.match(/nodes (\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Maneja los mensajes provenientes de Stockfish
 */
function manejarMensajeStockfish(evento: MessageEvent): void {
  const línea = evento.data as string;
  
  // Respuesta a inicialización UCI
  if (línea === 'uciok') {
    enviarMensaje({
      tipo: 'info',
      mensaje: 'UCI inicializado correctamente'
    });
    // Enviar isready para confirmar que está listo
    stockfish?.postMessage('isready');
    return;
  }
  
  // Motor listo para recibir comandos
  if (línea === 'readyok') {
    enviarMensaje({
      tipo: 'listo'
    });
    return;
  }
  
  // Información de análisis
  if (línea.startsWith('info') && analizando) {
    // Extraer evaluación
    const evaluación = extraerEvaluación(línea);
    if (evaluación.cp !== undefined) {
      evaluaciónActual = evaluación.cp;
      if (evaluación.mate !== undefined) {
        mateActual = evaluación.mate;
      }
    }
    
    // Extraer profundidad
    const profundidad = extraerProfundidad(línea);
    if (profundidad !== null) {
      profundidadActual = profundidad;
    }
    
    // Extraer nodos
    const nodos = extraerNodos(línea);
    if (nodos !== null) {
      nodosActuales = nodos;
    }
    
    return;
  }
  
  // Mejor jugada (resultado final del análisis)
  if (línea.startsWith('bestmove') && analizando) {
    const partes = línea.split(' ');
    mejorJugadaActual = partes[1];
    
    // Limpiar timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    analizando = false;
    
    // Enviar resultado completo
    enviarMensaje({
      tipo: 'resultado',
      mejorJugada: mejorJugadaActual || undefined,
      evaluación: evaluaciónActual || undefined,
      mate: mateActual || undefined,
      profundidad: profundidadActual,
      nodos: nodosActuales
    });
    
    // Resetear estado
    mejorJugadaActual = null;
    evaluaciónActual = null;
    mateActual = null;
    profundidadActual = 0;
    nodosActuales = 0;
    return;
  }
}

/**
 * Maneja errores de Stockfish
 */
function manejarErrorStockfish(evento: ErrorEvent): void {
  enviarMensaje({
    tipo: 'error',
    error: `Error en Stockfish: ${evento.message}`
  });
}

/**
 * Inicializa el motor Stockfish WASM
 */
function inicializarStockfish(): void {
  try {
    // Cargar Stockfish.js desde el directorio público
    // El archivo debe estar en /public/stockfish/stockfish.js
    importScripts('/stockfish/stockfish.wasm.js');
    
    // Crear instancia de Stockfish directamente desde la función global cargada
    // stockfish.js expone una función global Stockfish() o STOCKFISH()
    // @ts-ignore - Stockfish se carga como función global
    const StockfishFactory = (self as any).Stockfish || (self as any).STOCKFISH;
    
    if (!StockfishFactory) {
      enviarMensaje({
        tipo: 'error',
        error: 'Stockfish no se cargó correctamente desde stockfish.js. Verifica que el archivo esté en /public/stockfish/'
      });
      return;
    }
    
    // Crear instancia de Stockfish como worker
    stockfish = StockfishFactory() as Worker;
    
    if (!stockfish) {
      enviarMensaje({
        tipo: 'error',
        error: 'No se pudo crear la instancia de Stockfish'
      });
      return;
    }
    
    // Configurar manejadores
    stockfish.onmessage = manejarMensajeStockfish;
    stockfish.onerror = manejarErrorStockfish;
    
    // Iniciar protocolo UCI
    stockfish.postMessage('uci');
    
  } catch (error) {
    enviarMensaje({
      tipo: 'error',
      error: `Error inicializando Stockfish: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

/**
 * Analiza una posición con Stockfish
 */
function analizarPosición(fen: string, profundidad: number): void {
  if (!stockfish) {
    enviarMensaje({
      tipo: 'error',
      error: 'Stockfish no está inicializado'
    });
    return;
  }
  
  if (analizando) {
    enviarMensaje({
      tipo: 'error',
      error: 'Ya hay un análisis en progreso'
    });
    return;
  }
  
  analizando = true;
  
  // Resetear estado previo
  mejorJugadaActual = null;
  evaluaciónActual = null;
  mateActual = null;
  profundidadActual = 0;
  nodosActuales = 0;
  
  // Configurar posición
  stockfish.postMessage(`position fen ${fen}`);
  
  // Iniciar análisis con profundidad especificada
  stockfish.postMessage(`go depth ${profundidad}`);
  
  // Configurar timeout de 2 segundos (requisito 4.5)
  timeoutId = setTimeout(() => {
    if (analizando && stockfish) {
      stockfish.postMessage('stop');
      analizando = false;
      
      enviarMensaje({
        tipo: 'error',
        error: 'Timeout analizando posición'
      });
    }
  }, 2000) as unknown as number;
}

/**
 * Detiene el análisis actual
 */
function detenerAnalisis(): void {
  if (stockfish && analizando) {
    stockfish.postMessage('stop');
    analizando = false;
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }
}

/**
 * Envía un comando UCI directamente a Stockfish
 */
function enviarComandoUCI(comando: string): void {
  if (!stockfish) {
    enviarMensaje({
      tipo: 'error',
      error: 'Stockfish no está inicializado'
    });
    return;
  }
  
  stockfish.postMessage(comando);
}

/**
 * Manejador principal de mensajes del hilo principal
 */
self.onmessage = (evento: MessageEvent<MensajeHaciaTrabajador>) => {
  const mensaje = evento.data;
  
  switch (mensaje.tipo) {
    case 'inicializar':
      inicializarStockfish();
      break;
      
    case 'analizar':
      if (mensaje.fen && mensaje.profundidad) {
        analizarPosición(mensaje.fen, mensaje.profundidad);
      } else {
        enviarMensaje({
          tipo: 'error',
          error: 'Faltan parámetros para analizar (fen, profundidad)'
        });
      }
      break;
      
    case 'detener':
      detenerAnalisis();
      break;
      
    case 'comando':
      if (mensaje.comando) {
        enviarComandoUCI(mensaje.comando);
      } else {
        enviarMensaje({
          tipo: 'error',
          error: 'Falta el comando UCI'
        });
      }
      break;
      
    default:
      enviarMensaje({
        tipo: 'error',
        error: `Tipo de mensaje desconocido: ${(mensaje as any).tipo}`
      });
  }
};

// Exportar tipos para uso en el hilo principal
export type { MensajeHaciaTrabajador, MensajeDesdeWorker };
