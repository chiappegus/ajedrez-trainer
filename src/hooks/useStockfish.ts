/**
 * useStockfish - Hook para lazy loading de Stockfish WASM
 * 
 * Implementa carga diferida del motor Stockfish para:
 * - Mejorar tiempo de carga inicial de la aplicación
 * - Cargar Stockfish solo cuando el usuario inicia análisis
 * - Cachear instancia para análisis futuros
 * - Mostrar estado de carga al usuario
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 3.1, 10.5
 */

import { useState, useCallback, useRef } from 'react';
import type { MotorStockfish } from '../services/stockfish/MotorStockfish';
import { Logger } from '../utils/logger';
import { crearErrorAnálisis } from '../utils/errores';

interface UseStockfishResult {
  /** Instancia de MotorStockfish (null si no está cargado) */
  motor: MotorStockfish | null;
  /** Estado de carga del motor */
  cargando: boolean;
  /** Error durante la carga (null si no hay error) */
  error: string | null;
  /** Función para inicializar el motor */
  inicializarMotor: () => Promise<MotorStockfish>;
  /** Indica si el motor ya está listo para usar */
  motorListo: boolean;
}

/**
 * Hook que implementa lazy loading de Stockfish WASM
 * 
 * El motor NO se carga al montar el componente, sino cuando se llama
 * a inicializarMotor() por primera vez. Las llamadas subsecuentes
 * retornan la instancia cacheada.
 * 
 * @example
 * ```tsx
 * function ComponenteAnalisis() {
 *   const { motor, cargando, error, inicializarMotor, motorListo } = useStockfish();
 * 
 *   const handleAnalizar = async () => {
 *     try {
 *       const motorInstance = await inicializarMotor();
 *       // Usar motorInstance para análisis
 *     } catch (err) {
 *       console.error('Error cargando Stockfish:', err);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {cargando && <p>Cargando motor de análisis...</p>}
 *       {error && <p>Error: {error}</p>}
 *       {motorListo && <p>Motor listo</p>}
 *       <button onClick={handleAnalizar}>Analizar</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStockfish(): UseStockfishResult {
  const [motor, setMotor] = useState<MotorStockfish | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para evitar múltiples inicializaciones simultáneas
  const inicializandoRef = useRef(false);

  /**
   * Inicializa el motor Stockfish de forma lazy
   * Si ya está inicializado, retorna la instancia cacheada
   */
  const inicializarMotor = useCallback(async (): Promise<MotorStockfish> => {
    // Si ya está inicializado, retornar instancia cacheada
    if (motor) {
      Logger.debug('Stockfish ya inicializado, usando instancia cacheada');
      return motor;
    }

    // Si ya está en proceso de inicialización, esperar
    if (inicializandoRef.current) {
      Logger.debug('Stockfish ya está inicializándose, esperando...');
      
      // Polling cada 100ms hasta que esté listo o haya error
      return new Promise((resolve, reject) => {
        const intervalo = setInterval(() => {
          if (motor) {
            clearInterval(intervalo);
            resolve(motor);
          } else if (error) {
            clearInterval(intervalo);
            reject(new Error(error));
          }
        }, 100);
        
        // Timeout de 10 segundos
        setTimeout(() => {
          clearInterval(intervalo);
          reject(crearErrorAnálisis('timeout'));
        }, 10000);
      });
    }

    try {
      inicializandoRef.current = true;
      setCargando(true);
      setError(null);
      
      Logger.info('Iniciando carga de Stockfish WASM...');
      
      // Importación dinámica del motor (lazy loading)
      const { MotorStockfish: MotorStockfishClass } = await import(
        '../services/stockfish/MotorStockfish'
      );
      
      Logger.debug('Módulo MotorStockfish importado, inicializando...');
      
      const nuevoMotor = new MotorStockfishClass();
      await nuevoMotor.inicializar();
      
      Logger.info('Stockfish inicializado correctamente');
      
      setMotor(nuevoMotor);
      setCargando(false);
      inicializandoRef.current = false;
      
      return nuevoMotor;
    } catch (err) {
      const mensajeError = err instanceof Error 
        ? err.message 
        : 'Error desconocido al cargar Stockfish';
      
      Logger.error('Error inicializando Stockfish', err);
      
      setError(mensajeError);
      setCargando(false);
      inicializandoRef.current = false;
      
      throw crearErrorAnálisis('no_inicializado', err as Error);
    }
  }, [motor, error]);

  return {
    motor,
    cargando,
    error,
    inicializarMotor,
    motorListo: motor !== null && !cargando && !error
  };
}
