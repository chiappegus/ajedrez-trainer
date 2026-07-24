/**
 * Web Worker para Stockfish WASM
 * Maneja comunicacion bidireccional con Stockfish.js/WASM via protocolo UCI.
 */

var stockfish = null;
var analizando = false;
var timeoutId = null;
var mejorJugadaActual = null;
var evaluacionActual = null;
var mateActual = null;
var profundidadActual = 0;
var nodosActuales = 0;

function enviarMensaje(mensaje) {
  self.postMessage(mensaje);
}

function extraerEvaluacion(lineaInfo) {
  var resultado = {};
  var matchMate = lineaInfo.match(/score mate (-?\d+)/);
  if (matchMate) {
    resultado.mate = parseInt(matchMate[1], 10);
    resultado.cp = resultado.mate > 0 ? 10000 : -10000;
    return resultado;
  }
  var matchCp = lineaInfo.match(/score cp (-?\d+)/);
  if (matchCp) {
    resultado.cp = parseInt(matchCp[1], 10);
  }
  return resultado;
}

function extraerProfundidad(lineaInfo) {
  var match = lineaInfo.match(/depth (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function extraerNodos(lineaInfo) {
  var match = lineaInfo.match(/nodes (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function manejarMensajeStockfish(evento) {
  var linea = typeof evento === 'string' ? evento : evento.data;
  if (!linea || !linea.startsWith) return;

  if (linea === 'uciok') {
    enviarMensaje({ tipo: 'info', mensaje: 'UCI inicializado correctamente' });
    stockfish.postMessage('isready');
    return;
  }

  if (linea === 'readyok') {
    enviarMensaje({ tipo: 'listo' });
    return;
  }

  if (linea.startsWith('info') && analizando) {
    var evaluacion = extraerEvaluacion(linea);
    if (evaluacion.cp !== undefined) {
      evaluacionActual = evaluacion.cp;
      if (evaluacion.mate !== undefined) {
        mateActual = evaluacion.mate;
      }
    }
    var profundidad = extraerProfundidad(linea);
    if (profundidad !== null) profundidadActual = profundidad;
    var nodos = extraerNodos(linea);
    if (nodos !== null) nodosActuales = nodos;
    return;
  }

  if (linea.startsWith('bestmove') && analizando) {
    var partes = linea.split(' ');
    mejorJugadaActual = partes[1];
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    analizando = false;
    enviarMensaje({
      tipo: 'resultado',
      mejorJugada: mejorJugadaActual || undefined,
      evaluacion: evaluacionActual != null ? evaluacionActual : undefined,
      mate: mateActual != null ? mateActual : undefined,
      profundidad: profundidadActual,
      nodos: nodosActuales
    });
    mejorJugadaActual = null;
    evaluacionActual = null;
    mateActual = null;
    profundidadActual = 0;
    nodosActuales = 0;
    return;
  }
}

function inicializarStockfish() {
  try {
    // Set Module.locateFile so Emscripten finds stockfish.wasm in the correct path
    self.Module = {
      locateFile: function(file) {
        return '/stockfish/' + file;
      }
    };
    importScripts('/stockfish/stockfish.wasm.js');
    var StockfishFactory = self.Stockfish || self.STOCKFISH;
    if (!StockfishFactory) {
      enviarMensaje({
        tipo: 'error',
        error: 'Stockfish no se cargo correctamente. Verifica que el archivo este en /public/stockfish/'
      });
      return;
    }
    stockfish = StockfishFactory();
    if (!stockfish) {
      enviarMensaje({ tipo: 'error', error: 'No se pudo crear la instancia de Stockfish' });
      return;
    }
    stockfish.onmessage = manejarMensajeStockfish;
    stockfish.onerror = function(ev) {
      enviarMensaje({ tipo: 'error', error: 'Error en Stockfish: ' + (ev.message || ev) });
    };
    stockfish.postMessage('uci');
  } catch (error) {
    enviarMensaje({
      tipo: 'error',
      error: 'Error inicializando Stockfish: ' + (error.message || String(error))
    });
  }
}

function analizarPosicion(fen, profundidad) {
  if (!stockfish) {
    enviarMensaje({ tipo: 'error', error: 'Stockfish no esta inicializado' });
    return;
  }
  if (analizando) {
    enviarMensaje({ tipo: 'error', error: 'Ya hay un analisis en progreso' });
    return;
  }
  analizando = true;
  mejorJugadaActual = null;
  evaluacionActual = null;
  mateActual = null;
  profundidadActual = 0;
  nodosActuales = 0;
  stockfish.postMessage('position fen ' + fen);
  stockfish.postMessage('go depth ' + profundidad);
  timeoutId = setTimeout(function() {
    if (analizando && stockfish) {
      stockfish.postMessage('stop');
      analizando = false;
      enviarMensaje({ tipo: 'error', error: 'Timeout analizando posicion' });
    }
  }, 2000);
}

function detenerAnalisis() {
  if (stockfish && analizando) {
    stockfish.postMessage('stop');
    analizando = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }
}

self.onmessage = function(evento) {
  var mensaje = evento.data;
  switch (mensaje.tipo) {
    case 'inicializar':
      inicializarStockfish();
      break;
    case 'analizar':
      if (mensaje.fen && mensaje.profundidad) {
        analizarPosicion(mensaje.fen, mensaje.profundidad);
      } else {
        enviarMensaje({ tipo: 'error', error: 'Faltan parametros para analizar (fen, profundidad)' });
      }
      break;
    case 'detener':
      detenerAnalisis();
      break;
    case 'comando':
      if (mensaje.comando && stockfish) {
        stockfish.postMessage(mensaje.comando);
      } else {
        enviarMensaje({ tipo: 'error', error: 'Falta el comando UCI o Stockfish no inicializado' });
      }
      break;
    default:
      enviarMensaje({ tipo: 'error', error: 'Tipo de mensaje desconocido: ' + mensaje.tipo });
  }
};
