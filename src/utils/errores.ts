/**
 * Jerarquía de errores personalizados para la aplicación
 * 
 * Proporciona clases de error específicas con códigos únicos para facilitar
 * el debugging y mostrar mensajes apropiados al usuario.
 * 
 * Feature: lichess-game-analysis
 * Valida: Todos los requisitos (manejo de errores robusto)
 */

/**
 * Clase base para todos los errores de Ajedrez Trainer
 */
export class ErrorAjedrezTrainer extends Error {
  /** Código único del error para debugging */
  public readonly codigo: string;
  /** Error original que causó este error (si aplica) */
  public readonly causaOriginal?: Error;

  constructor(mensaje: string, codigo: string, causaOriginal?: Error) {
    super(mensaje);
    this.name = this.constructor.name;
    this.codigo = codigo;
    this.causaOriginal = causaOriginal;

    // Mantener stack trace correcto
    if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error relacionado con configuración de credenciales
 */
export class ErrorConfiguracion extends ErrorAjedrezTrainer {
  constructor(mensaje: string, codigo: string, causaOriginal?: Error) {
    super(mensaje, `CONFIG_${codigo}`, causaOriginal);
  }
}

/**
 * Error relacionado con operaciones de red (Lichess API, Groq API)
 */
export class ErrorRed extends ErrorAjedrezTrainer {
  /** Código de estado HTTP si aplica */
  public readonly statusCode?: number;

  constructor(mensaje: string, codigo: string, statusCode?: number, causaOriginal?: Error) {
    super(mensaje, `RED_${codigo}`, causaOriginal);
    this.statusCode = statusCode;
  }
}

/**
 * Error relacionado con parseo de PGN
 */
export class ErrorParseo extends ErrorAjedrezTrainer {
  /** Línea donde ocurrió el error (si se puede determinar) */
  public readonly linea?: number;

  constructor(mensaje: string, codigo: string, linea?: number, causaOriginal?: Error) {
    super(mensaje, `PARSEO_${codigo}`, causaOriginal);
    this.linea = linea;
  }
}

/**
 * Error relacionado con análisis de partidas (Stockfish, detección de errores)
 */
export class ErrorAnálisis extends ErrorAjedrezTrainer {
  constructor(mensaje: string, codigo: string, causaOriginal?: Error) {
    super(mensaje, `ANALISIS_${codigo}`, causaOriginal);
  }
}

/**
 * Códigos de error específicos para cada categoría
 */
export const CodigosError = {
  // Configuración (CONFIG_XXX)
  CREDENCIALES_INVALIDAS: 'CONFIG_001',
  CREDENCIALES_FALTANTES: 'CONFIG_002',
  STORAGE_NO_DISPONIBLE: 'CONFIG_003',
  
  // Red (RED_XXX)
  TOKEN_INVALIDO: 'RED_001',
  USUARIO_NO_ENCONTRADO: 'RED_002',
  SIN_PARTIDAS: 'RED_003',
  TIMEOUT: 'RED_004',
  RATE_LIMIT: 'RED_005',
  ERROR_SERVIDOR: 'RED_006',
  API_KEY_INVALIDA: 'RED_007',
  ERROR_DESCONOCIDO: 'RED_999',
  
  // Parseo (PARSEO_XXX)
  PGN_INVALIDO: 'PARSEO_001',
  PGN_VACIO: 'PARSEO_002',
  SINTAXIS_INCORRECTA: 'PARSEO_003',
  
  // Análisis (ANALISIS_XXX)
  STOCKFISH_NO_INICIALIZADO: 'ANALISIS_001',
  STOCKFISH_TIMEOUT: 'ANALISIS_002',
  EVALUACION_FALLIDA: 'ANALISIS_003',
  POSICION_INVALIDA: 'ANALISIS_004',
} as const;

/**
 * Obtiene un mensaje amigable para el usuario basado en el código de error
 * 
 * @param error - Error de Ajedrez Trainer
 * @returns Mensaje descriptivo en castellano para mostrar al usuario
 */
export function obtenerMensajeUsuario(error: ErrorAjedrezTrainer): string {
  const mensajes: Record<string, string> = {
    // Configuración
    [CodigosError.CREDENCIALES_INVALIDAS]:
      'Las credenciales ingresadas no son válidas. Por favor, verifica que los campos no estén vacíos.',
    [CodigosError.CREDENCIALES_FALTANTES]:
      'Faltan credenciales de configuración. Ve a la sección de Configuración para ingresarlas.',
    [CodigosError.STORAGE_NO_DISPONIBLE]:
      'No se puede acceder al almacenamiento local del navegador. Verifica los permisos del navegador.',
    
    // Red - Lichess
    [CodigosError.TOKEN_INVALIDO]:
      'El token de Lichess es inválido o ha expirado. Genera un nuevo token en https://lichess.org/account/oauth/token.',
    [CodigosError.USUARIO_NO_ENCONTRADO]:
      'No se encontró el usuario en Lichess. Verifica que el nombre de usuario sea correcto.',
    [CodigosError.SIN_PARTIDAS]:
      'No se encontraron partidas para este usuario. Juega al menos una partida en Lichess antes de analizar.',
    [CodigosError.TIMEOUT]:
      'La conexión tardó demasiado tiempo. Verifica tu conexión a internet e intenta nuevamente.',
    [CodigosError.RATE_LIMIT]:
      'Se excedió el límite de solicitudes a la API. Por favor, espera unos minutos antes de intentar de nuevo.',
    [CodigosError.ERROR_SERVIDOR]:
      'El servidor no está disponible en este momento. Intenta nuevamente más tarde.',
    [CodigosError.API_KEY_INVALIDA]:
      'La API Key de Groq es inválida. Verifica tu API Key en https://console.groq.com/keys.',
    [CodigosError.ERROR_DESCONOCIDO]:
      'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    
    // Parseo
    [CodigosError.PGN_INVALIDO]:
      'El formato PGN de la partida no es válido. No se puede procesar esta partida.',
    [CodigosError.PGN_VACIO]:
      'La partida está vacía o no contiene jugadas.',
    [CodigosError.SINTAXIS_INCORRECTA]:
      'La sintaxis del PGN es incorrecta. El archivo está corrupto o mal formateado.',
    
    // Análisis
    [CodigosError.STOCKFISH_NO_INICIALIZADO]:
      'El motor de análisis no se pudo inicializar. Recarga la página e intenta nuevamente.',
    [CodigosError.STOCKFISH_TIMEOUT]:
      'El motor de análisis tardó demasiado en responder. Intenta nuevamente.',
    [CodigosError.EVALUACION_FALLIDA]:
      'No se pudo evaluar la posición. Continúa con la siguiente jugada.',
    [CodigosError.POSICION_INVALIDA]:
      'La posición del tablero no es válida.',
  };

  return mensajes[error.codigo] || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
}

/**
 * Determina si un error es recuperable (el usuario puede intentar nuevamente)
 * 
 * @param error - Error de Ajedrez Trainer
 * @returns true si el error es recuperable
 */
export function esErrorRecuperable(error: ErrorAjedrezTrainer): boolean {
  const erroresNoRecuperables = [
    CodigosError.CREDENCIALES_INVALIDAS,
    CodigosError.STORAGE_NO_DISPONIBLE,
    CodigosError.TOKEN_INVALIDO,
    CodigosError.API_KEY_INVALIDA,
    CodigosError.USUARIO_NO_ENCONTRADO,
    CodigosError.PGN_INVALIDO,
    CodigosError.SINTAXIS_INCORRECTA,
  ];

  return !erroresNoRecuperables.includes(error.codigo as any);
}

/**
 * Crea un error de configuración
 */
export function crearErrorConfiguracion(
  tipo: 'invalidas' | 'faltantes' | 'storage',
  causaOriginal?: Error
): ErrorConfiguracion {
  const mapeo = {
    invalidas: {
      mensaje: 'Credenciales inválidas',
      codigo: CodigosError.CREDENCIALES_INVALIDAS
    },
    faltantes: {
      mensaje: 'Credenciales faltantes',
      codigo: CodigosError.CREDENCIALES_FALTANTES
    },
    storage: {
      mensaje: 'Storage no disponible',
      codigo: CodigosError.STORAGE_NO_DISPONIBLE
    }
  };

  const { mensaje, codigo } = mapeo[tipo];
  return new ErrorConfiguracion(mensaje, codigo, causaOriginal);
}

/**
 * Crea un error de red basado en el código de estado HTTP
 */
export function crearErrorRed(
  statusCode: number,
  mensajeServidor?: string,
  causaOriginal?: Error
): ErrorRed {
  let mensaje: string;
  let codigo: string;

  switch (statusCode) {
    case 401:
      mensaje = 'Token de autenticación inválido';
      codigo = CodigosError.TOKEN_INVALIDO;
      break;
    case 404:
      mensaje = 'Recurso no encontrado';
      codigo = CodigosError.USUARIO_NO_ENCONTRADO;
      break;
    case 429:
      mensaje = 'Rate limit excedido';
      codigo = CodigosError.RATE_LIMIT;
      break;
    case 500:
    case 502:
    case 503:
      mensaje = 'Error del servidor';
      codigo = CodigosError.ERROR_SERVIDOR;
      break;
    default:
      mensaje = mensajeServidor || 'Error de red desconocido';
      codigo = CodigosError.ERROR_DESCONOCIDO;
  }

  return new ErrorRed(mensaje, codigo, statusCode, causaOriginal);
}

/**
 * Crea un error de parseo
 */
export function crearErrorParseo(
  tipo: 'invalido' | 'vacio' | 'sintaxis',
  linea?: number,
  causaOriginal?: Error
): ErrorParseo {
  const mapeo = {
    invalido: {
      mensaje: 'PGN inválido',
      codigo: CodigosError.PGN_INVALIDO
    },
    vacio: {
      mensaje: 'PGN vacío',
      codigo: CodigosError.PGN_VACIO
    },
    sintaxis: {
      mensaje: 'Sintaxis incorrecta',
      codigo: CodigosError.SINTAXIS_INCORRECTA
    }
  };

  const { mensaje, codigo } = mapeo[tipo];
  return new ErrorParseo(mensaje, codigo, linea, causaOriginal);
}

/**
 * Crea un error de análisis
 */
export function crearErrorAnálisis(
  tipo: 'no_inicializado' | 'timeout' | 'evaluacion_fallida' | 'posicion_invalida',
  causaOriginal?: Error
): ErrorAnálisis {
  const mapeo = {
    no_inicializado: {
      mensaje: 'Stockfish no inicializado',
      codigo: CodigosError.STOCKFISH_NO_INICIALIZADO
    },
    timeout: {
      mensaje: 'Timeout de Stockfish',
      codigo: CodigosError.STOCKFISH_TIMEOUT
    },
    evaluacion_fallida: {
      mensaje: 'Evaluación fallida',
      codigo: CodigosError.EVALUACION_FALLIDA
    },
    posicion_invalida: {
      mensaje: 'Posición inválida',
      codigo: CodigosError.POSICION_INVALIDA
    }
  };

  const { mensaje, codigo } = mapeo[tipo];
  return new ErrorAnálisis(mensaje, codigo, causaOriginal);
}
