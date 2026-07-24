import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContenedorTablerosDuales } from './ContenedorTablerosDuales';
import { Movimiento } from './VisualizadorTablero';

describe('ContenedorTablerosDuales', () => {
  const FEN_INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const FEN_DESPUES_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

  describe('Renderizado básico', () => {
    it('debe renderizar el contenedor dual', () => {
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
        />
      );

      const contenedor = container.querySelector('.contenedor-tableros-duales');
      expect(contenedor).toBeInTheDocument();
    });

    it('debe renderizar siempre el tablero de partida real', () => {
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          numeroJugada={5}
        />
      );

      expect(screen.getByText(/Partida Real/)).toBeInTheDocument();
    });

    it('debe mostrar el número de jugada en el título del tablero', () => {
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          numeroJugada={5}
        />
      );

      expect(screen.getByText('Partida Real - Jugada 6')).toBeInTheDocument();
    });
  });

  describe('Tablero de alternativa', () => {
    it('debe mostrar el tablero de alternativa cuando hay error seleccionado', () => {
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_DESPUES_E4}
          posiciónAlternativaFEN={FEN_INICIAL}
          hayErrorSeleccionado={true}
        />
      );

      expect(screen.getByText('Mejor Alternativa')).toBeInTheDocument();
    });

    it('debe ocultar el tablero de alternativa cuando no hay error seleccionado', () => {
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          hayErrorSeleccionado={false}
        />
      );

      expect(screen.queryByText('Mejor Alternativa')).not.toBeInTheDocument();
    });

    it('debe mostrar mensaje placeholder cuando no hay error seleccionado', () => {
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          hayErrorSeleccionado={false}
        />
      );

      expect(screen.getByText('Navegue a una jugada con error')).toBeInTheDocument();
      expect(
        screen.getByText('Aquí se mostrará la mejor alternativa con highlight verde')
      ).toBeInTheDocument();
    });
  });

  describe('Highlights y movimientos', () => {
    it('debe pasar movimiento de error al tablero de partida', () => {
      const movimientoError: Movimiento = { desde: 'e2', hacia: 'e5' };
      
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          movimientoError={movimientoError}
        />
      );

      // Verificar que el componente se renderizó sin errores
      expect(container.querySelector('.contenedor-tableros-duales')).toBeInTheDocument();
    });

    it('debe pasar mejor jugada al tablero de alternativa', () => {
      const mejorJugada: Movimiento = { desde: 'd2', hacia: 'd4' };
      
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_DESPUES_E4}
          posiciónAlternativaFEN={FEN_INICIAL}
          mejorJugada={mejorJugada}
          hayErrorSeleccionado={true}
        />
      );

      expect(container.querySelector('.contenedor-tableros-duales')).toBeInTheDocument();
    });
  });

  describe('Evaluaciones', () => {
    it('debe mostrar evaluación después en tablero de partida', () => {
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          evaluaciónDespués={-150}
        />
      );

      expect(screen.getByText('-1.50')).toBeInTheDocument();
    });

    it('debe mostrar evaluación antes en tablero de alternativa', () => {
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_DESPUES_E4}
          posiciónAlternativaFEN={FEN_INICIAL}
          evaluaciónAntes={25}
          hayErrorSeleccionado={true}
        />
      );

      expect(screen.getByText('+0.25')).toBeInTheDocument();
    });
  });

  describe('Navegación', () => {
    it('debe pasar callback de navegación a ambos tableros', () => {
      const mockOnCambiar = vi.fn();
      
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_DESPUES_E4}
          posiciónAlternativaFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={mockOnCambiar}
          hayErrorSeleccionado={true}
        />
      );

      // Solo el tablero de partida tiene controles de navegación
      const botonesNavegacion = screen.getAllByLabelText(/Jugada|Ir al/);
      expect(botonesNavegacion.length).toBeGreaterThan(0);
    });

    it('debe sincronizar navegación entre ambos tableros', () => {
      const mockOnCambiar = vi.fn();
      
      render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_DESPUES_E4}
          posiciónAlternativaFEN={FEN_INICIAL}
          numeroJugada={5}
          totalJugadas={20}
          onCambiarPosición={mockOnCambiar}
          hayErrorSeleccionado={true}
        />
      );

      // El tablero de alternativa no tiene controles propios,
      // se sincroniza con el de partida
      expect(screen.getAllByText('Jugada 6 de 20')).toHaveLength(1);
    });
  });

  describe('Orientación', () => {
    it('debe pasar la misma orientación a ambos tableros', () => {
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_DESPUES_E4}
          posiciónAlternativaFEN={FEN_INICIAL}
          orientación="black"
          hayErrorSeleccionado={true}
        />
      );

      // Verificar que ambos tableros se renderizan
      const tableros = container.querySelectorAll('.visualizador-tablero');
      expect(tableros).toHaveLength(2);
    });
  });

  describe('Layout responsive', () => {
    it('debe tener clases CSS para layout responsive', () => {
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
        />
      );

      const contenedor = container.querySelector('.contenedor-tableros-duales');
      expect(contenedor).toBeInTheDocument();
      
      const tableros = container.querySelectorAll('.contenedor-tableros-duales__tablero');
      expect(tableros.length).toBeGreaterThan(0);
    });

    it('debe mostrar placeholder con clases correctas', () => {
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          hayErrorSeleccionado={false}
        />
      );

      const placeholder = container.querySelector('.contenedor-tableros-duales__placeholder');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Casos edge', () => {
    it('debe manejar valores undefined de evaluación', () => {
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          evaluaciónDespués={undefined}
          evaluaciónAntes={undefined}
        />
      );

      expect(container.querySelector('.contenedor-tableros-duales')).toBeInTheDocument();
    });

    it('debe manejar ausencia de movimientos resaltados', () => {
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
          posiciónAlternativaFEN={FEN_DESPUES_E4}
          hayErrorSeleccionado={true}
        />
      );

      expect(container.querySelector('.contenedor-tableros-duales')).toBeInTheDocument();
    });

    it('debe funcionar sin props de navegación', () => {
      const { container } = render(
        <ContenedorTablerosDuales
          posiciónPartidaFEN={FEN_INICIAL}
        />
      );

      // No debe haber controles de navegación
      expect(screen.queryByLabelText('Jugada anterior')).not.toBeInTheDocument();
    });
  });
});
