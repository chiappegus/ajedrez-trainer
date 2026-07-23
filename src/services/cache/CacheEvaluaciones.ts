/**
 * CacheEvaluaciones - Sistema de caché LRU para evaluaciones de Stockfish
 * 
 * Responsabilidad: Cachear evaluaciones de posiciones para evitar re-análisis
 * y mejorar el rendimiento del análisis de partidas.
 * 
 * Implementa una estrategia LRU (Least Recently Used) con límite de 1000 posiciones.
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisito 4.6 (optimización de rendimiento)
 */

import type { Evaluación } from '../../types/evaluacion';

/**
 * Clase de caché con estrategia de evicción LRU (Least Recently Used)
 */
export class CacheEvaluaciones {
  private cache: Map<string, Evaluación>;
  private readonly limiteMaximo: number;

  /**
   * Constructor
   * @param limiteMaximo Número máximo de posiciones a cachear (por defecto: 1000)
   */
  constructor(limiteMaximo: number = 1000) {
    if (limiteMaximo < 1) {
      throw new Error('El límite máximo del caché debe ser al menos 1');
    }
    
    this.cache = new Map<string, Evaluación>();
    this.limiteMaximo = limiteMaximo;
  }

  /**
   * Obtiene una evaluación del caché
   * @param fen Posición en notación FEN
   * @returns Evaluación cacheada o undefined si no existe
   */
  obtener(fen: string): Evaluación | undefined {
    const evaluacion = this.cache.get(fen);
    
    if (evaluacion !== undefined) {
      // Actualizar LRU: eliminar y reinsertar al final
      this.cache.delete(fen);
      this.cache.set(fen, evaluacion);
    }
    
    return evaluacion;
  }

  /**
   * Almacena una evaluación en el caché
   * Si el caché está lleno, elimina la entrada más antigua (LRU)
   * @param fen Posición en notación FEN
   * @param evaluacion Evaluación a almacenar
   */
  almacenar(fen: string, evaluacion: Evaluación): void {
    // Si ya existe, eliminarla primero para actualizar el orden LRU
    if (this.cache.has(fen)) {
      this.cache.delete(fen);
    }
    
    // Si se alcanzó el límite, eliminar la entrada más antigua (primera del Map)
    if (this.cache.size >= this.limiteMaximo) {
      const primeraClaveIterador = this.cache.keys();
      const primeraClave = primeraClaveIterador.next().value;
      if (primeraClave !== undefined) {
        this.cache.delete(primeraClave);
      }
    }
    
    // Insertar al final (posición más reciente)
    this.cache.set(fen, evaluacion);
  }

  /**
   * Limpia completamente el caché
   */
  limpiar(): void {
    this.cache.clear();
  }

  /**
   * Obtiene el tamaño actual del caché
   * @returns Número de evaluaciones almacenadas
   */
  obtenerTamaño(): number {
    return this.cache.size;
  }

  /**
   * Verifica si una posición está en el caché
   * @param fen Posición en notación FEN
   * @returns true si la posición está cacheada
   */
  contiene(fen: string): boolean {
    return this.cache.has(fen);
  }

  /**
   * Obtiene estadísticas del caché
   * @returns Objeto con estadísticas de uso
   */
  obtenerEstadisticas(): { tamaño: number; limite: number; utilizacion: number } {
    return {
      tamaño: this.cache.size,
      limite: this.limiteMaximo,
      utilizacion: (this.cache.size / this.limiteMaximo) * 100
    };
  }
}
