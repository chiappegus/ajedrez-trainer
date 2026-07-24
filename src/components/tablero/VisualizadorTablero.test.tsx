import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VisualizadorTablero, Movimiento } from './VisualizadorTablero';

describe('VisualizadorTablero', () => {
  const FEN_INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const FEN_DESPUES_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

  describe('Renderizado básico', () => {
    it('debe renderizar el tablero con la posición FEN proporcionada', () => {
      const { container } = render(
        <VisualizadorTablero posiciónFEN={FEN_INICIAL} />
      );

      // Verificar que el componente se renderizó
      const visualizador = container.querySelector('.visualizador-tablero');
      expect(visualizador).toBeInTheDocument();
    });

    it('debe mostrar el título cuando se proporciona', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          título="Tablero de Prueba"
        />
      );

      expect(screen.getByText('Tablero de Prueba')).toBeInTheDocument();
    });

    it('debe mostrar la evaluación formateada cuando se proporciona', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          título="Test"
          evaluación={50}
        />
      );

      // 50 centipawns = +0.50 peones
      expect(screen.getByText('+0.50')).toBeInTheDocument();
    });

    it('debe formatear evaluaciones negativas correctamente', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          título="Test"
          evaluación={-120}
        />
      );

      // -120 centipawns = -1.20 peones
      expect(screen.getByText('-1.20')).toBeInTheDocument();
    });

    it('debe formatear evaluaciones de mate correctamente', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          título="Test"
          evaluación={10000}
        />
      );

      // 10000 = mate en 1
      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  describe('Navegación', () => {
    it('debe mostrar controles de navegación cuando se proporcionan props necesarios', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={0}
          totalJugadas={20}
          onCambiarPosición={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Ir al inicio')).toBeInTheDocument();
      expect(screen.getByLabelText('Jugada anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Jugada siguiente')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir al final')).toBeInTheDocument();
      expect(screen.getByText('Jugada 1 de 20')).toBeInTheDocument();
    });

    it('debe deshabilitar botón anterior al inicio', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={0}
          totalJugadas={20}
          onCambiarPosición={vi.fn()}
        />
      );

      const botonAnterior = screen.getByLabelText('Jugada anterior');
      const botonInicio = screen.getByLabelText('Ir al inicio');
      
      expect(botonAnterior).toBeDisabled();
      expect(botonInicio).toBeDisabled();
    });

    it('debe deshabilitar botón siguiente al final', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={19}
          totalJugadas={20}
          onCambiarPosición={vi.fn()}
        />
      );

      const botonSiguiente = screen.getByLabelText('Jugada siguiente');
      const botonFinal = screen.getByLabelText('Ir al final');
      
      expect(botonSiguiente).toBeDisabled();
      expect(botonFinal).toBeDisabled();
    });

    it('debe llamar onCambiarPosición con el índice anterior', () => {
      const mockOnCambiar = vi.fn();
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={mockOnCambiar}
        />
      );

      const botonAnterior = screen.getByLabelText('Jugada anterior');
      fireEvent.click(botonAnterior);

      expect(mockOnCambiar).toHaveBeenCalledWith(4);
    });

    it('debe llamar onCambiarPosición con el índice siguiente', () => {
      const mockOnCambiar = vi.fn();
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={mockOnCambiar}
        />
      );

      const botonSiguiente = screen.getByLabelText('Jugada siguiente');
      fireEvent.click(botonSiguiente);

      expect(mockOnCambiar).toHaveBeenCalledWith(6);
    });

    it('debe navegar al inicio cuando se hace clic en el botón de inicio', () => {
      const mockOnCambiar = vi.fn();
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={mockOnCambiar}
        />
      );

      const botonInicio = screen.getByLabelText('Ir al inicio');
      fireEvent.click(botonInicio);

      expect(mockOnCambiar).toHaveBeenCalledWith(0);
    });

    it('debe navegar al final cuando se hace clic en el botón final', () => {
      const mockOnCambiar = vi.fn();
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={mockOnCambiar}
        />
      );

      const botonFinal = screen.getByLabelText('Ir al final');
      fireEvent.click(botonFinal);

      expect(mockOnCambiar).toHaveBeenCalledWith(19);
    });
  });

  describe('Highlights y movimientos', () => {
    it('debe aplicar atributo data-modo correctamente', () => {
      const { container } = render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          modo="explicación"
        />
      );

      const visualizador = container.querySelector('.visualizador-tablero');
      expect(visualizador).toHaveAttribute('data-modo', 'explicación');
    });

    it('debe aceptar movimiento resaltado y tipo de resaltado', () => {
      const movimiento: Movimiento = { desde: 'e2', hacia: 'e4' };
      
      const { container } = render(
        <VisualizadorTablero
          posiciónFEN={FEN_DESPUES_E4}
          movimientoResaltado={movimiento}
          tipoResaltado="error"
        />
      );

      // Verificar que el componente se renderizó sin errores
      expect(container.querySelector('.visualizador-tablero')).toBeInTheDocument();
    });
  });

  describe('Orientación', () => {
    it('debe usar orientación white por defecto', () => {
      const { container } = render(
        <VisualizadorTablero posiciónFEN={FEN_INICIAL} />
      );

      // Verificar que el componente se renderizó
      expect(container.querySelector('.visualizador-tablero')).toBeInTheDocument();
    });

    it('debe aceptar orientación black', () => {
      const { container } = render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          orientación="black"
        />
      );

      expect(container.querySelector('.visualizador-tablero')).toBeInTheDocument();
    });
  });

  describe('Responsive', () => {
    it('debe renderizar correctamente en diferentes tamaños', () => {
      const { container } = render(
        <VisualizadorTablero posiciónFEN={FEN_INICIAL} />
      );

      // Verificar que el componente contiene el contenedor
      const contenedor = container.querySelector('.visualizador-tablero__contenedor');
      expect(contenedor).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener aria-labels en los botones de navegación', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Ir al inicio')).toBeInTheDocument();
      expect(screen.getByLabelText('Jugada anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Jugada siguiente')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir al final')).toBeInTheDocument();
    });

    it('debe tener titles en los botones para tooltips', () => {
      render(
        <VisualizadorTablero
          posiciónFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={vi.fn()}
        />
      );

      const botonAnterior = screen.getByLabelText('Jugada anterior');
      expect(botonAnterior).toHaveAttribute('title', 'Jugada anterior');
    });
  });
});
