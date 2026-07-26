/**
 * useAnalisis - Hook personalizado para integrar AnalizadorPartida en componentes React
 * 
 * Proporciona una interfaz React-friendly para:
 * - Iniciar análisis
 * - Obtener progreso en tiempo real
 * - Pausar/reanudar análisis
 * - Acceder a resultados
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 9.1, 9.2, 9.3, 9.5, 10.3, 10.4
 */

import { useState, useCallback, useRef } from 'react';
import type { AnalizadorPartida } from '../services/analisis/AnalizadorPartida';
import type { ResultadoAnálisis } from '../types/evaluacion';
import type { ProgresoAnálisis } from '../types/error';

interface UseAnalisisResult {
  /** Función para iniciar el análisis de una partida */
  iniciarAnalisis: (nombreUsuario: string) => Promise<ResultadoAnálisis>;
  /** Función para pausar el análisis en curso */
  pausarAnalisis: () => void;
  /** Función para reanudar el análisis pausado */
  reanudarAnalisis: () => void;
  /** Función para obtener el progreso actual */
  obtenerProgreso: () => ProgresoAnálisis;
  /** Resultado del análisis (disponible cuando estado = 'completado') */
  resultado: ResultadoAnálisis | null;
  /** Estado actual del análisis */
  estado: 'inactivo' | 'analizando' | 'pausado' | 'completado' | 'error' | 'generando_explicaciones';
  /** Mensaje de error si ocurre algún problema */
  error: string | null;
  /** Indica si está en proceso de análisis */
  analizando: boolean;
}

/**
 * Hook que encapsula la lógica de interacción con AnalizadorPartida
 * 
 * @param analizador - Instancia de AnalizadorPartida (puede ser null al inicio)
 * @returns Interfaz con funciones y estado del análisis
 */
export function useAnalisis(analizador: AnalizadorPartida | null): UseAnalisisResult {
  const [resultado, setResultado] = useState<ResultadoAnálisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analizadorRef = useRef<AnalizadorPartida | null>(analizador);

  // Actualizar ref si cambia el analizador
  analizadorRef.current = analizador;

  /**
   * Inicia el análisis de una partida
   */
  const iniciarAnalisis = useCallback(async (nombreUsuario: string): Promise<ResultadoAnálisis> => {
    try {
      setError(null);
      setResultado(null);

      if (!analizadorRef.current) {
        throw new Error('Analizador no inicializado');
      }

      const resultadoAnalisis = await analizadorRef.current.iniciarAnálisis(nombreUsuario);
      setResultado(resultadoAnalisis);
      return resultadoAnalisis;
    } catch (err) {
      const mensajeError = err instanceof Error ? err.message : 'Error desconocido durante el análisis';
      setError(mensajeError);
      throw err;
    }
  }, []);

  /**
   * Pausa el análisis en curso
   */
  const pausarAnalisis = useCallback(() => {
    if (!analizadorRef.current) return;
    analizadorRef.current.pausarAnálisis();
  }, []);

  /**
   * Reanuda el análisis pausado
   */
  const reanudarAnalisis = useCallback(() => {
    if (!analizadorRef.current) return;
    analizadorRef.current.reanudarAnálisis();
  }, []);

  /**
   * Obtiene el progreso actual del análisis
   */
  const obtenerProgreso = useCallback((): ProgresoAnálisis => {
    // Retornar progreso seguro si el analizador es null
    if (!analizadorRef.current) {
      return {
        estado: 'inactivo',
        jugadaActual: 0,
        totalJugadas: 0,
        erroresEncontrados: 0,
        tiempoPromedioPorJugada: 0,
        tiempoRestanteEstimado: 0
      };
    }
    return analizadorRef.current.obtenerProgreso();
  }, []);

  // Obtener estado actual
  const progresoActual = obtenerProgreso();
  const analizando = progresoActual.estado === 'analizando' || progresoActual.estado === 'pausado' || progresoActual.estado === 'generando_explicaciones';

  return {
    iniciarAnalisis,
    pausarAnalisis,
    reanudarAnalisis,
    obtenerProgreso,
    resultado,
    estado: progresoActual.estado,
    error,
    analizando
  };
}
