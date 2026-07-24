/**
 * Logger - Sistema de registro de eventos para debugging
 * 
 * Proporciona un sistema centralizado de logging con:
 * - Niveles de severidad (debug, info, warn, error)
 * - Almacenamiento en memoria (últimos 100 eventos)
 * - Console.log automático en desarrollo
 * - Exportación de logs para debugging
 * - Timestamps precisos
 * 
 * Feature: lichess-game-analysis
 * Valida: Todos los requisitos (debugging y mantenibilidad)
 */

/** Niveles de severidad de logs */
export type NivelLog = 'debug' | 'info' | 'warn' | 'error';

/** Entrada de log individual */
export interface EntradaLog {
  /** Timestamp cuando se registró el evento */
  timestamp: Date;
  /** Nivel de severidad */
  nivel: NivelLog;
  /** Mensaje del log */
  mensaje: string;
  /** Datos adicionales (opcional) */
  datos?: unknown;
  /** Stack trace para errores (opcional) */
  stack?: string;
}

/**
 * Clase Logger singleton para registro centralizado de eventos
 */
class LoggerClass {
  /** Historial de logs (máximo 100 entradas) */
  private logs: EntradaLog[] = [];

  /** Límite máximo de logs en memoria */
  private readonly LIMITE_LOGS = 100;

  /** Indica si estamos en modo desarrollo */
  private readonly esDesarrollo = import.meta.env.DEV;

  /**
   * Registra un mensaje de debug
   * 
   * @param mensaje - Mensaje a registrar
   * @param datos - Datos adicionales (opcional)
   */
  debug(mensaje: string, datos?: unknown): void {
    this.registrar('debug', mensaje, datos);
  }

  /**
   * Registra un mensaje informativo
   * 
   * @param mensaje - Mensaje a registrar
   * @param datos - Datos adicionales (opcional)
   */
  info(mensaje: string, datos?: unknown): void {
    this.registrar('info', mensaje, datos);
  }

  /**
   * Registra una advertencia
   * 
   * @param mensaje - Mensaje a registrar
   * @param datos - Datos adicionales (opcional)
   */
  warn(mensaje: string, datos?: unknown): void {
    this.registrar('warn', mensaje, datos);
  }

  /**
   * Registra un error
   * 
   * @param mensaje - Mensaje a registrar
   * @param error - Error original (opcional)
   * @param datos - Datos adicionales (opcional)
   */
  error(mensaje: string, error?: Error | unknown, datos?: unknown): void {
    const entrada: EntradaLog = {
      timestamp: new Date(),
      nivel: 'error',
      mensaje,
      datos,
      stack: error instanceof Error ? error.stack : undefined
    };

    this.agregarLog(entrada);

    // En desarrollo, hacer console.error automático
    if (this.esDesarrollo) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${mensaje}`, error, datos);
      } else {
        console.error(`[ERROR] ${mensaje}`, datos);
      }
    }
  }

  /**
   * Registra un evento genérico
   * 
   * @param nivel - Nivel de severidad
   * @param mensaje - Mensaje a registrar
   * @param datos - Datos adicionales (opcional)
   */
  private registrar(nivel: NivelLog, mensaje: string, datos?: unknown): void {
    const entrada: EntradaLog = {
      timestamp: new Date(),
      nivel,
      mensaje,
      datos
    };

    this.agregarLog(entrada);

    // En desarrollo, hacer console.log automático según nivel
    if (this.esDesarrollo) {
      const tag = `[${nivel.toUpperCase()}]`;
      switch (nivel) {
        case 'debug':
          console.debug(tag, mensaje, datos);
          break;
        case 'info':
          console.info(tag, mensaje, datos);
          break;
        case 'warn':
          console.warn(tag, mensaje, datos);
          break;
        case 'error':
          console.error(tag, mensaje, datos);
          break;
      }
    }
  }

  /**
   * Agrega una entrada al historial de logs
   * Mantiene el límite de 100 entradas eliminando las más antiguas
   * 
   * @param entrada - Entrada de log a agregar
   */
  private agregarLog(entrada: EntradaLog): void {
    this.logs.push(entrada);

    // Mantener solo los últimos LIMITE_LOGS eventos
    if (this.logs.length > this.LIMITE_LOGS) {
      this.logs.shift(); // Eliminar el más antiguo
    }
  }

  /**
   * Obtiene todos los logs almacenados
   * 
   * @returns Array de entradas de log
   */
  obtenerLogs(): EntradaLog[] {
    return [...this.logs]; // Retornar copia para evitar mutaciones
  }

  /**
   * Filtra logs por nivel de severidad
   * 
   * @param nivel - Nivel de severidad a filtrar
   * @returns Array de entradas de log del nivel especificado
   */
  obtenerLogsPorNivel(nivel: NivelLog): EntradaLog[] {
    return this.logs.filter(log => log.nivel === nivel);
  }

  /**
   * Exporta los logs como JSON
   * Útil para debugging y reportes de errores
   * 
   * @returns String JSON con todos los logs
   */
  exportarLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exporta los logs como texto legible
   * 
   * @returns String de texto con logs formateados
   */
  exportarLogsTexto(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const nivel = log.nivel.toUpperCase().padEnd(5);
        let linea = `[${timestamp}] [${nivel}] ${log.mensaje}`;
        
        if (log.datos) {
          linea += `\n  Datos: ${JSON.stringify(log.datos)}`;
        }
        
        if (log.stack) {
          linea += `\n  Stack: ${log.stack}`;
        }
        
        return linea;
      })
      .join('\n\n');
  }

  /**
   * Limpia todos los logs almacenados
   */
  limpiarLogs(): void {
    this.logs = [];
    if (this.esDesarrollo) {
      console.info('[LOGGER] Logs limpiados');
    }
  }

  /**
   * Obtiene estadísticas de los logs
   * 
   * @returns Objeto con contadores por nivel de severidad
   */
  obtenerEstadisticas(): Record<NivelLog, number> {
    const stats: Record<NivelLog, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    for (const log of this.logs) {
      stats[log.nivel]++;
    }

    return stats;
  }

  /**
   * Descarga los logs como archivo de texto
   * Útil para reportar bugs al desarrollador
   */
  descargarLogs(): void {
    const contenido = this.exportarLogsTexto();
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ajedrez-trainer-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    this.info('Logs descargados correctamente');
  }
}

// Exportar instancia singleton
export const Logger = new LoggerClass();

// Export también la clase para testing
export { LoggerClass };
