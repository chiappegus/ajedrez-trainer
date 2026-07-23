/**
 * Tests para CacheEvaluaciones
 * Feature: lichess-game-analysis
 * Valida: Requisito 4.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CacheEvaluaciones } from './CacheEvaluaciones';
import type { Evaluación } from '../../types/evaluacion';

describe('CacheEvaluaciones', () => {
  let cache: CacheEvaluaciones;

  const crearEvaluacionMock = (fen: string, centipawns: number): Evaluación => ({
    fen,
    centipawns,
    mejorJugada: 'e2e4',
    mejorJugadaSAN: 'e4',
    profundidad: 15,
    tiempoEvaluación: 1000
  });

  beforeEach(() => {
    cache = new CacheEvaluaciones(3); // Límite pequeño para facilitar tests
  });

  describe('Constructor', () => {
    it('debe crear un caché vacío', () => {
      expect(cache.obtenerTamaño()).toBe(0);
    });

    it('debe lanzar error si el límite es menor a 1', () => {
      expect(() => new CacheEvaluaciones(0)).toThrow(
        'El límite máximo del caché debe ser al menos 1'
      );
      expect(() => new CacheEvaluaciones(-5)).toThrow(
        'El límite máximo del caché debe ser al menos 1'
      );
    });

    it('debe aceptar límite personalizado', () => {
      const cacheCustom = new CacheEvaluaciones(500);
      const stats = cacheCustom.obtenerEstadisticas();
      expect(stats.limite).toBe(500);
    });
  });

  describe('almacenar y obtener', () => {
    it('debe almacenar y recuperar una evaluación', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const eval1 = crearEvaluacionMock(fen, 25);

      cache.almacenar(fen, eval1);

      const recuperada = cache.obtener(fen);
      expect(recuperada).toEqual(eval1);
    });

    it('debe retornar undefined para FEN no cacheado', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const recuperada = cache.obtener(fen);
      expect(recuperada).toBeUndefined();
    });

    it('debe almacenar múltiples evaluaciones', () => {
      const fen1 = 'fen1';
      const fen2 = 'fen2';
      const eval1 = crearEvaluacionMock(fen1, 10);
      const eval2 = crearEvaluacionMock(fen2, 20);

      cache.almacenar(fen1, eval1);
      cache.almacenar(fen2, eval2);

      expect(cache.obtener(fen1)).toEqual(eval1);
      expect(cache.obtener(fen2)).toEqual(eval2);
      expect(cache.obtenerTamaño()).toBe(2);
    });

    it('debe sobrescribir evaluación si se almacena la misma clave', () => {
      const fen = 'fen1';
      const eval1 = crearEvaluacionMock(fen, 10);
      const eval2 = crearEvaluacionMock(fen, 50);

      cache.almacenar(fen, eval1);
      cache.almacenar(fen, eval2);

      expect(cache.obtener(fen)).toEqual(eval2);
      expect(cache.obtenerTamaño()).toBe(1); // No duplicados
    });
  });

  describe('Estrategia LRU (Least Recently Used)', () => {
    it('debe eliminar la entrada más antigua cuando se alcanza el límite', () => {
      const fen1 = 'fen1';
      const fen2 = 'fen2';
      const fen3 = 'fen3';
      const fen4 = 'fen4';

      cache.almacenar(fen1, crearEvaluacionMock(fen1, 10));
      cache.almacenar(fen2, crearEvaluacionMock(fen2, 20));
      cache.almacenar(fen3, crearEvaluacionMock(fen3, 30));
      
      // Caché lleno (límite = 3)
      expect(cache.obtenerTamaño()).toBe(3);

      // Agregar cuarta entrada debe eliminar la primera (fen1)
      cache.almacenar(fen4, crearEvaluacionMock(fen4, 40));

      expect(cache.obtenerTamaño()).toBe(3);
      expect(cache.obtener(fen1)).toBeUndefined(); // fen1 eliminado
      expect(cache.obtener(fen2)).toBeDefined();
      expect(cache.obtener(fen3)).toBeDefined();
      expect(cache.obtener(fen4)).toBeDefined();
    });

    it('debe actualizar el orden LRU al acceder a una entrada', () => {
      const fen1 = 'fen1';
      const fen2 = 'fen2';
      const fen3 = 'fen3';
      const fen4 = 'fen4';

      cache.almacenar(fen1, crearEvaluacionMock(fen1, 10));
      cache.almacenar(fen2, crearEvaluacionMock(fen2, 20));
      cache.almacenar(fen3, crearEvaluacionMock(fen3, 30));

      // Acceder a fen1 para moverlo al final (más reciente)
      cache.obtener(fen1);

      // Agregar fen4 debe eliminar fen2 (ahora el más antiguo)
      cache.almacenar(fen4, crearEvaluacionMock(fen4, 40));

      expect(cache.obtener(fen1)).toBeDefined(); // fen1 protegido por acceso reciente
      expect(cache.obtener(fen2)).toBeUndefined(); // fen2 eliminado
      expect(cache.obtener(fen3)).toBeDefined();
      expect(cache.obtener(fen4)).toBeDefined();
    });

    it('debe manejar correctamente múltiples evictions', () => {
      // Llenar caché
      cache.almacenar('fen1', crearEvaluacionMock('fen1', 10));
      cache.almacenar('fen2', crearEvaluacionMock('fen2', 20));
      cache.almacenar('fen3', crearEvaluacionMock('fen3', 30));

      // Agregar 5 más (todas deben causar eviction)
      cache.almacenar('fen4', crearEvaluacionMock('fen4', 40));
      cache.almacenar('fen5', crearEvaluacionMock('fen5', 50));
      cache.almacenar('fen6', crearEvaluacionMock('fen6', 60));
      cache.almacenar('fen7', crearEvaluacionMock('fen7', 70));
      cache.almacenar('fen8', crearEvaluacionMock('fen8', 80));

      // Solo las últimas 3 deben permanecer
      expect(cache.obtenerTamaño()).toBe(3);
      expect(cache.obtener('fen6')).toBeDefined();
      expect(cache.obtener('fen7')).toBeDefined();
      expect(cache.obtener('fen8')).toBeDefined();
      expect(cache.obtener('fen1')).toBeUndefined();
      expect(cache.obtener('fen2')).toBeUndefined();
    });
  });

  describe('limpiar', () => {
    it('debe eliminar todas las entradas del caché', () => {
      cache.almacenar('fen1', crearEvaluacionMock('fen1', 10));
      cache.almacenar('fen2', crearEvaluacionMock('fen2', 20));

      expect(cache.obtenerTamaño()).toBe(2);

      cache.limpiar();

      expect(cache.obtenerTamaño()).toBe(0);
      expect(cache.obtener('fen1')).toBeUndefined();
      expect(cache.obtener('fen2')).toBeUndefined();
    });

    it('debe permitir agregar entradas después de limpiar', () => {
      cache.almacenar('fen1', crearEvaluacionMock('fen1', 10));
      cache.limpiar();

      cache.almacenar('fen2', crearEvaluacionMock('fen2', 20));

      expect(cache.obtenerTamaño()).toBe(1);
      expect(cache.obtener('fen2')).toBeDefined();
    });
  });

  describe('contiene', () => {
    it('debe retornar true si la clave existe', () => {
      const fen = 'fen1';
      cache.almacenar(fen, crearEvaluacionMock(fen, 10));

      expect(cache.contiene(fen)).toBe(true);
    });

    it('debe retornar false si la clave no existe', () => {
      expect(cache.contiene('fen_inexistente')).toBe(false);
    });

    it('debe retornar false después de limpiar', () => {
      const fen = 'fen1';
      cache.almacenar(fen, crearEvaluacionMock(fen, 10));
      cache.limpiar();

      expect(cache.contiene(fen)).toBe(false);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debe retornar estadísticas correctas del caché vacío', () => {
      const stats = cache.obtenerEstadisticas();

      expect(stats.tamaño).toBe(0);
      expect(stats.limite).toBe(3);
      expect(stats.utilizacion).toBe(0);
    });

    it('debe retornar estadísticas correctas con caché parcialmente lleno', () => {
      cache.almacenar('fen1', crearEvaluacionMock('fen1', 10));
      cache.almacenar('fen2', crearEvaluacionMock('fen2', 20));

      const stats = cache.obtenerEstadisticas();

      expect(stats.tamaño).toBe(2);
      expect(stats.limite).toBe(3);
      expect(stats.utilizacion).toBeCloseTo(66.67, 1);
    });

    it('debe retornar 100% de utilización cuando está lleno', () => {
      cache.almacenar('fen1', crearEvaluacionMock('fen1', 10));
      cache.almacenar('fen2', crearEvaluacionMock('fen2', 20));
      cache.almacenar('fen3', crearEvaluacionMock('fen3', 30));

      const stats = cache.obtenerEstadisticas();

      expect(stats.tamaño).toBe(3);
      expect(stats.utilizacion).toBe(100);
    });
  });

  describe('Casos límite', () => {
    it('debe manejar caché con límite 1', () => {
      const cacheUno = new CacheEvaluaciones(1);

      cacheUno.almacenar('fen1', crearEvaluacionMock('fen1', 10));
      expect(cacheUno.obtenerTamaño()).toBe(1);

      cacheUno.almacenar('fen2', crearEvaluacionMock('fen2', 20));
      expect(cacheUno.obtenerTamaño()).toBe(1);
      expect(cacheUno.obtener('fen1')).toBeUndefined();
      expect(cacheUno.obtener('fen2')).toBeDefined();
    });

    it('debe manejar FEN idénticos correctamente', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const eval1 = crearEvaluacionMock(fen, 10);
      const eval2 = crearEvaluacionMock(fen, 30);

      cache.almacenar(fen, eval1);
      cache.almacenar(fen, eval2);

      expect(cache.obtenerTamaño()).toBe(1);
      expect(cache.obtener(fen)?.centipawns).toBe(30);
    });

    it('debe manejar FEN vacío como clave válida', () => {
      const fenVacio = '';
      const eval1 = crearEvaluacionMock(fenVacio, 0);

      cache.almacenar(fenVacio, eval1);

      expect(cache.obtener(fenVacio)).toEqual(eval1);
      expect(cache.contiene(fenVacio)).toBe(true);
    });
  });

  describe('Rendimiento con caché grande', () => {
    it('debe manejar 1000 posiciones sin degradación', () => {
      const cacheLarge = new CacheEvaluaciones(1000);

      // Agregar 1000 posiciones
      for (let i = 0; i < 1000; i++) {
        cacheLarge.almacenar(`fen${i}`, crearEvaluacionMock(`fen${i}`, i));
      }

      expect(cacheLarge.obtenerTamaño()).toBe(1000);

      // Verificar que todas estén presentes
      for (let i = 0; i < 1000; i++) {
        expect(cacheLarge.contiene(`fen${i}`)).toBe(true);
      }

      // Agregar una más debe eliminar la primera
      cacheLarge.almacenar('fen1000', crearEvaluacionMock('fen1000', 1000));

      expect(cacheLarge.obtenerTamaño()).toBe(1000);
      expect(cacheLarge.contiene('fen0')).toBe(false);
      expect(cacheLarge.contiene('fen1000')).toBe(true);
    });
  });
});
