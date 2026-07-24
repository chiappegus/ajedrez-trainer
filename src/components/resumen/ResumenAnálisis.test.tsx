/**
 * Tests comprehensivos para ResumenAnálisis
 * Feature: lichess-game-analysis
 * Valida: Requisitos 9.4, 12.1, 12.2, 12.3, 12.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumenAnálisis } from './ResumenAnálisis';
import type { ResultadoAnálisis } from '../../types/evaluacion';
import type { Partida } from '../../types/partida';
import type { ErrorDetectado } from '../../types/error';

// Helper para crear resultado de análisis de prueba
function crearResultadoPrueba(
  erroresCount: number,
  pérdidaPromedio: number,
  rendimiento: 'excelente' | 'sólido' | 'aceptable' | 'mejorable'
): ResultadoAnálisis {
  const partida: Partida = {
    metadatos: {
      event: 'Test',
      site: 'Test',
      white: 'Player1',
      black: 'Player2',
      result: '1-0',
      date: '2024-01-01'
    },
    jugadas: []
  };

  const errores: ErrorDetectado[] = [];
  for (let i = 0; i < erroresCount; i++) {
    errores.push({
      numeroJugada: i + 4,
      turno: i % 2 === 0 ? 'white' : 'black',
      fenAntes: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      jugadaRealizada: {
        numeroJugada: i + 4,
        turno: i % 2 === 0 ? 'white' : 'black',
        jugadaSAN: 'e4',
        jugadaUCI: 'e2e4',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      },
      mejorJugada: 'd2d4',
      mejorJugadaSAN: 'd4',
      evaluaciónAntes: 0,
      evaluaciónDespués: -150,
      pérdidaCentipawns: 150
    });
  }

  return {
    partida,
    erroresDetectados: errores,
    pérdidaPromedioCentipawns: pérdidaPromedio,
    jugadasAnalizadas: 40,
    tiempoTotal: 30000,
    estadísticas: {
      totalJugadas: 40,
      erroresBlancas: Math.ceil(erroresCount / 2),
      erroresNegras: Math.floor(erroresCount / 2),
      mayorPérdida: 200,
      jugadaMayorPérdida: 12,
      rendimientoGeneral: rendimiento
    }
  };
}

describe('ResumenAnálisis', () => {
  describe('Caso sin errores', () => {
    it('debe mostrar mensaje de felicitación cuando no hay errores', () => {
      const resultado = crearResultadoPrueba(0, 5, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('¡Excelente!')).toBeInTheDocument();
      expect(
        screen.getByText('No se encontraron errores significativos en tu partida.')
      ).toBeInTheDocument();
    });

    it('debe mostrar pérdida promedio en el mensaje de felicitación', () => {
      const resultado = crearResultadoPrueba(0, 15.7, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText(/15.7 centipawns/)).toBeInTheDocument();
    });

    it('debe mostrar insignia de "Rendimiento Sólido" cuando pérdida promedio < 20', () => {
      const resultado = crearResultadoPrueba(0, 18, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('Rendimiento Sólido')).toBeInTheDocument();
    });

    it('NO debe mostrar insignia cuando pérdida promedio >= 20', () => {
      const resultado = crearResultadoPrueba(0, 25, 'sólido');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.queryByText('Rendimiento Sólido')).not.toBeInTheDocument();
    });

    it('NO debe mostrar distribución de errores cuando no hay errores', () => {
      const resultado = crearResultadoPrueba(0, 10, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.queryByText('Distribución de Errores')).not.toBeInTheDocument();
    });

    it('NO debe mostrar sección de mayor pérdida cuando no hay errores', () => {
      const resultado = crearResultadoPrueba(0, 10, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.queryByText('Mayor Pérdida')).not.toBeInTheDocument();
    });
  });

  describe('Caso con errores', () => {
    it('debe mostrar número correcto de errores detectados', () => {
      const resultado = crearResultadoPrueba(8, 35, 'aceptable');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Errores detectados')).toBeInTheDocument();
    });

    it('debe mostrar distribución de errores por color', () => {
      const resultado = crearResultadoPrueba(8, 35, 'aceptable');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('Distribución de Errores')).toBeInTheDocument();
      expect(screen.getByText('Blancas')).toBeInTheDocument();
      expect(screen.getByText('Negras')).toBeInTheDocument();
    });

    it('debe mostrar sección de mayor pérdida con valor correcto', () => {
      const resultado = crearResultadoPrueba(5, 30, 'aceptable');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('Mayor Pérdida')).toBeInTheDocument();
      expect(screen.getByText('200 centipawns')).toBeInTheDocument();
      expect(screen.getByText(/en la jugada 12/)).toBeInTheDocument();
    });

    it('debe permitir navegar a jugada con mayor pérdida', () => {
      const handleNavegar = vi.fn();
      const resultado = crearResultadoPrueba(5, 30, 'aceptable');
      render(
        <ResumenAnálisis resultado={resultado} onNavigarAJugada={handleNavegar} />
      );

      const botonNavegar = screen.getByLabelText('Navegar a jugada 12');
      fireEvent.click(botonNavegar);

      expect(handleNavegar).toHaveBeenCalledWith(12);
    });

    it('NO debe mostrar mensaje de felicitación cuando hay errores', () => {
      const resultado = crearResultadoPrueba(5, 30, 'aceptable');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.queryByText('¡Excelente!')).not.toBeInTheDocument();
    });
  });

  describe('Estadísticas principales', () => {
    it('debe mostrar total de jugadas analizadas', () => {
      const resultado = crearResultadoPrueba(3, 25, 'sólido');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('40')).toBeInTheDocument();
      expect(screen.getByText('Jugadas analizadas')).toBeInTheDocument();
    });

    it('debe mostrar pérdida promedio con 1 decimal', () => {
      const resultado = crearResultadoPrueba(3, 25.678, 'sólido');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('25.7 cp')).toBeInTheDocument();
    });

    it('debe mostrar tiempo de análisis formateado', () => {
      const resultado = crearResultadoPrueba(3, 25, 'sólido');
      render(<ResumenAnálisis resultado={resultado} />);

      // 30000ms = 30s
      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('debe formatear tiempo en minutos y segundos cuando >= 60s', () => {
      const resultado = crearResultadoPrueba(3, 25, 'sólido');
      resultado.tiempoTotal = 125000; // 2m 5s
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText('2m 5s')).toBeInTheDocument();
    });
  });

  describe('Clasificación de rendimiento', () => {
    it('debe mostrar insignia "Excelente" con emoji correcto', () => {
      const resultado = crearResultadoPrueba(1, 8, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      const insignia = screen.getByText('Excelente').closest('.resumen-insignia');
      expect(insignia).toHaveAttribute('data-rendimiento', 'excelente');
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('debe mostrar insignia "Sólido" con emoji correcto', () => {
      const resultado = crearResultadoPrueba(2, 15, 'sólido');
      render(<ResumenAnálisis resultado={resultado} />);

      const insignia = screen.getByText('Sólido').closest('.resumen-insignia');
      expect(insignia).toHaveAttribute('data-rendimiento', 'sólido');
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('debe mostrar insignia "Aceptable" con emoji correcto', () => {
      const resultado = crearResultadoPrueba(4, 30, 'aceptable');
      render(<ResumenAnálisis resultado={resultado} />);

      const insignia = screen.getByText('Aceptable').closest('.resumen-insignia');
      expect(insignia).toHaveAttribute('data-rendimiento', 'aceptable');
      expect(screen.getByText('👍')).toBeInTheDocument();
    });

    it('debe mostrar insignia "Mejorable" con emoji correcto', () => {
      const resultado = crearResultadoPrueba(8, 50, 'mejorable');
      render(<ResumenAnálisis resultado={resultado} />);

      const insignia = screen.getByText('Mejorable').closest('.resumen-insignia');
      expect(insignia).toHaveAttribute('data-rendimiento', 'mejorable');
      expect(screen.getByText('📚')).toBeInTheDocument();
    });
  });

  describe('Interpretación del rendimiento', () => {
    it('debe mostrar texto interpretativo para "excelente"', () => {
      const resultado = crearResultadoPrueba(1, 8, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(
        screen.getByText(/Tu precisión fue excepcional/)
      ).toBeInTheDocument();
    });

    it('debe mostrar texto interpretativo para "sólido"', () => {
      const resultado = crearResultadoPrueba(2, 15, 'sólido');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText(/Tu juego fue sólido y consistente/)).toBeInTheDocument();
    });

    it('debe mostrar texto interpretativo para "aceptable"', () => {
      const resultado = crearResultadoPrueba(4, 30, 'aceptable');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(screen.getByText(/Tu rendimiento fue aceptable/)).toBeInTheDocument();
    });

    it('debe mostrar texto interpretativo para "mejorable"', () => {
      const resultado = crearResultadoPrueba(8, 50, 'mejorable');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(
        screen.getByText(/Tu partida tuvo varios errores significativos/)
      ).toBeInTheDocument();
    });
  });

  describe('Distribución de errores', () => {
    it('debe calcular porcentajes correctamente cuando hay igual cantidad', () => {
      const resultado = crearResultadoPrueba(8, 30, 'aceptable');
      // 8 errores: 4 blancas, 4 negras
      render(<ResumenAnálisis resultado={resultado} />);

      // Hay dos elementos con este texto (uno para blancas y uno para negras)
      const elementos = screen.getAllByText(/4 \(50%\)/);
      expect(elementos).toHaveLength(2);
    });

    it('debe mostrar barras de distribución con anchos proporcionales', () => {
      const resultado = crearResultadoPrueba(10, 35, 'aceptable');
      // 10 errores: 5 blancas, 5 negras
      const { container } = render(<ResumenAnálisis resultado={resultado} />);

      const barras = container.querySelectorAll('.distribucion-relleno');
      expect(barras).toHaveLength(2);
      
      const barraBlancas = container.querySelector('.distribucion-relleno.blancas');
      const barraNegras = container.querySelector('.distribucion-relleno.negras');
      
      expect(barraBlancas).toHaveStyle({ width: '50%' });
      expect(barraNegras).toHaveStyle({ width: '50%' });
    });
  });

  describe('Acciones', () => {
    it('debe mostrar botón "Ver análisis detallado" cuando se proporciona callback', () => {
      const handleVerDetalles = vi.fn();
      const resultado = crearResultadoPrueba(5, 30, 'aceptable');
      render(
        <ResumenAnálisis resultado={resultado} onVerDetalles={handleVerDetalles} />
      );

      expect(screen.getByText('📋 Ver análisis detallado')).toBeInTheDocument();
    });

    it('debe llamar callback al hacer clic en "Ver análisis detallado"', () => {
      const handleVerDetalles = vi.fn();
      const resultado = crearResultadoPrueba(5, 30, 'aceptable');
      render(
        <ResumenAnálisis resultado={resultado} onVerDetalles={handleVerDetalles} />
      );

      const boton = screen.getByText('📋 Ver análisis detallado');
      fireEvent.click(boton);

      expect(handleVerDetalles).toHaveBeenCalledTimes(1);
    });

    it('debe mostrar sugerencia de navegación cuando hay errores', () => {
      const resultado = crearResultadoPrueba(5, 30, 'aceptable');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(
        screen.getByText(/Navega jugada por jugada para revisar los errores/)
      ).toBeInTheDocument();
    });

    it('NO debe mostrar sugerencia de navegación cuando no hay errores', () => {
      const resultado = crearResultadoPrueba(0, 10, 'excelente');
      render(<ResumenAnálisis resultado={resultado} />);

      expect(
        screen.queryByText(/Navega jugada por jugada/)
      ).not.toBeInTheDocument();
    });
  });
});
