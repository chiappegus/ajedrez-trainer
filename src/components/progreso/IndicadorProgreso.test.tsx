/**
 * Tests para el componente IndicadorProgreso
 * 
 * Valida:
 * - Visualización correcta de progreso
 * - Actualización en tiempo real mediante polling
 * - Botones Pausar/Reanudar según estado
 * - Cálculo de porcentajes
 * - Formato de tiempo restante
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 9.1, 9.2, 9.3, 10.3, 10.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IndicadorProgreso } from './IndicadorProgreso';
import type { ProgresoAnálisis } from '../../types/error';

describe('IndicadorProgreso', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Visualización de progreso básico', () => {
    it('debería mostrar el progreso inicial correctamente', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 10,
        totalJugadas: 40,
        erroresEncontrados: 2,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 30000
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      // Verificar que se muestra el título de analizando
      expect(screen.getByText(/Analizando partida/i)).toBeInTheDocument();

      // Verificar progreso de jugadas
      expect(screen.getByText('10 / 40')).toBeInTheDocument();

      // Verificar errores encontrados
      expect(screen.getByText('2')).toBeInTheDocument();

      // Verificar porcentaje (10/40 = 25%)
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('debería mostrar porcentaje 0% cuando totalJugadas es 0', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'inactivo',
        jugadaActual: 0,
        totalJugadas: 0,
        erroresEncontrados: 0,
        tiempoPromedioPorJugada: 0,
        tiempoRestanteEstimado: 0
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('debería calcular el porcentaje correctamente', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 33,
        totalJugadas: 100,
        erroresEncontrados: 5,
        tiempoPromedioPorJugada: 1500,
        tiempoRestanteEstimado: 100500
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      // 33/100 = 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('Estados del análisis', () => {
    it('debería mostrar estado "Analizando partida..." cuando estado es analizando', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 5,
        totalJugadas: 20,
        erroresEncontrados: 0,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 15000
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/⚙️ Analizando partida/i)).toBeInTheDocument();
    });

    it('debería mostrar estado "Análisis pausado" cuando estado es pausado', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'pausado',
        jugadaActual: 15,
        totalJugadas: 30,
        erroresEncontrados: 3,
        tiempoPromedioPorJugada: 1200,
        tiempoRestanteEstimado: 18000
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/⏸️ Análisis pausado/i)).toBeInTheDocument();
    });

    it('debería mostrar estado "Análisis completado" cuando estado es completado', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'completado',
        jugadaActual: 50,
        totalJugadas: 50,
        erroresEncontrados: 7,
        tiempoPromedioPorJugada: 1100,
        tiempoRestanteEstimado: 0
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/✅ Análisis completado/i)).toBeInTheDocument();
    });

    it('debería mostrar estado "Error en análisis" cuando estado es error', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'error',
        jugadaActual: 10,
        totalJugadas: 40,
        erroresEncontrados: 1,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 0
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/❌ Error en análisis/i)).toBeInTheDocument();
    });

    it('debería mostrar estado "Esperando..." cuando estado es inactivo', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'inactivo',
        jugadaActual: 0,
        totalJugadas: 0,
        erroresEncontrados: 0,
        tiempoPromedioPorJugada: 0,
        tiempoRestanteEstimado: 0
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/⏳ Esperando/i)).toBeInTheDocument();
    });
  });

  describe('Tiempo restante estimado', () => {
    it('debería mostrar tiempo restante cuando está analizando', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 20,
        totalJugadas: 50,
        erroresEncontrados: 3,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 65000 // 1m 5s
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/Tiempo restante:/i)).toBeInTheDocument();
      expect(screen.getByText(/~1m 5s/i)).toBeInTheDocument();
    });

    it('debería formatear tiempo correctamente (solo segundos)', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 48,
        totalJugadas: 50,
        erroresEncontrados: 5,
        tiempoPromedioPorJugada: 1500,
        tiempoRestanteEstimado: 15000 // 15s
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/~15s/i)).toBeInTheDocument();
    });

    it('debería formatear tiempo correctamente (minutos y segundos)', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 10,
        totalJugadas: 100,
        erroresEncontrados: 2,
        tiempoPromedioPorJugada: 2000,
        tiempoRestanteEstimado: 180000 // 3m 0s
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.getByText(/~3m 0s/i)).toBeInTheDocument();
    });

    it('NO debería mostrar tiempo restante cuando estado NO es analizando', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'pausado',
        jugadaActual: 20,
        totalJugadas: 50,
        erroresEncontrados: 3,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 30000
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.queryByText(/Tiempo restante:/i)).not.toBeInTheDocument();
    });

    it('NO debería mostrar tiempo restante cuando es 0', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 50,
        totalJugadas: 50,
        erroresEncontrados: 8,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 0
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.queryByText(/Tiempo restante:/i)).not.toBeInTheDocument();
    });
  });

  describe('Botones Pausar/Reanudar', () => {
    it('debería mostrar botón Pausar cuando estado es analizando', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 10,
        totalJugadas: 40,
        erroresEncontrados: 2,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 30000
      }));

      const onPausar = vi.fn();

      render(
        <IndicadorProgreso
          obtenerProgreso={obtenerProgreso}
          onPausar={onPausar}
        />
      );

      const botonPausar = screen.getByRole('button', { name: /Pausar análisis/i });
      expect(botonPausar).toBeInTheDocument();
    });

    it('debería mostrar botón Reanudar cuando estado es pausado', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'pausado',
        jugadaActual: 15,
        totalJugadas: 40,
        erroresEncontrados: 3,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 25000
      }));

      const onReanudar = vi.fn();

      render(
        <IndicadorProgreso
          obtenerProgreso={obtenerProgreso}
          onReanudar={onReanudar}
        />
      );

      const botonReanudar = screen.getByRole('button', { name: /Reanudar análisis/i });
      expect(botonReanudar).toBeInTheDocument();
    });

    it('NO debería mostrar botones cuando estado es completado', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'completado',
        jugadaActual: 50,
        totalJugadas: 50,
        erroresEncontrados: 7,
        tiempoPromedioPorJugada: 1100,
        tiempoRestanteEstimado: 0
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      expect(screen.queryByRole('button', { name: /Pausar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Reanudar/i })).not.toBeInTheDocument();
    });

    it('debería llamar onPausar cuando se hace clic en Pausar', async () => {
      // Usar timers reales para este test de interacción
      vi.useRealTimers();
      
      const user = userEvent.setup();
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 10,
        totalJugadas: 40,
        erroresEncontrados: 2,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 30000
      }));

      const onPausar = vi.fn();

      render(
        <IndicadorProgreso
          obtenerProgreso={obtenerProgreso}
          onPausar={onPausar}
        />
      );

      const botonPausar = screen.getByRole('button', { name: /Pausar análisis/i });
      await user.click(botonPausar);

      expect(onPausar).toHaveBeenCalledTimes(1);
      
      // Restaurar fake timers para siguientes tests
      vi.useFakeTimers();
    });

    it('debería llamar onReanudar cuando se hace clic en Reanudar', async () => {
      // Usar timers reales para este test de interacción
      vi.useRealTimers();
      
      const user = userEvent.setup();
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'pausado',
        jugadaActual: 15,
        totalJugadas: 40,
        erroresEncontrados: 3,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 25000
      }));

      const onReanudar = vi.fn();

      render(
        <IndicadorProgreso
          obtenerProgreso={obtenerProgreso}
          onReanudar={onReanudar}
        />
      );

      const botonReanudar = screen.getByRole('button', { name: /Reanudar análisis/i });
      await user.click(botonReanudar);

      expect(onReanudar).toHaveBeenCalledTimes(1);
      
      // Restaurar fake timers para siguientes tests
      vi.useFakeTimers();
    });
  });

  describe('Polling automático (actualización cada 500ms)', () => {
    it('debería actualizar el progreso automáticamente cada 500ms', async () => {
      // Usar timers reales para este test
      vi.useRealTimers();
      
      let jugadaActual = 10;

      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: jugadaActual,
        totalJugadas: 50,
        erroresEncontrados: 2,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 40000
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} intervaloActualizacion={100} />);

      // Verificar estado inicial
      expect(screen.getByText('10 / 50')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();

      // Simular progreso
      jugadaActual = 20;

      // Esperar actualización real (100ms de intervalo configurado)
      await waitFor(() => {
        expect(screen.getByText('20 / 50')).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
      }, { timeout: 500 });

      // Simular más progreso
      jugadaActual = 30;

      // Esperar otra actualización
      await waitFor(() => {
        expect(screen.getByText('30 / 50')).toBeInTheDocument();
        expect(screen.getByText('60%')).toBeInTheDocument();
      }, { timeout: 500 });
      
      // Restaurar fake timers
      vi.useFakeTimers();
    });

    it('debería llamar obtenerProgreso periódicamente', async () => {
      // Usar timers reales para este test
      vi.useRealTimers();
      
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 5,
        totalJugadas: 20,
        erroresEncontrados: 1,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 15000
      }));

      render(
        <IndicadorProgreso
          obtenerProgreso={obtenerProgreso}
          intervaloActualizacion={100} // 100ms para test rápido
        />
      );

      // Limpiar llamada inicial
      obtenerProgreso.mockClear();

      // Esperar a que se llame al menos 2 veces más
      await waitFor(() => {
        expect(obtenerProgreso).toHaveBeenCalledTimes(2);
      }, { timeout: 500 });
      
      // Restaurar fake timers
      vi.useFakeTimers();
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener atributos ARIA correctos en la barra de progreso', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 25,
        totalJugadas: 100,
        erroresEncontrados: 5,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 75000
      }));

      render(<IndicadorProgreso obtenerProgreso={obtenerProgreso} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('debería tener aria-label en los botones', () => {
      const obtenerProgreso = vi.fn((): ProgresoAnálisis => ({
        estado: 'analizando',
        jugadaActual: 10,
        totalJugadas: 40,
        erroresEncontrados: 2,
        tiempoPromedioPorJugada: 1000,
        tiempoRestanteEstimado: 30000
      }));

      render(
        <IndicadorProgreso
          obtenerProgreso={obtenerProgreso}
          onPausar={vi.fn()}
        />
      );

      const botonPausar = screen.getByRole('button', { name: /Pausar análisis/i });
      expect(botonPausar).toHaveAttribute('aria-label', 'Pausar análisis');
    });
  });
});
