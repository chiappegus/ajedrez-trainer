/**
 * Tests para ModalVariante
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.7, 8.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalVariante } from './ModalVariante';
import type { ErrorDetectado } from '../../types/error';

// Mock de Chessboard para evitar problemas de renderizado en tests
vi.mock('react-chessboard', () => ({
  Chessboard: ({ position }: { position: string }) => (
    <div data-testid="chessboard" data-position={position}>
      Tablero de ajedrez - {position.substring(0, 20)}...
    </div>
  )
}));

describe('ModalVariante', () => {
  const errorEjemplo: ErrorDetectado = {
    numeroJugada: 12,
    turno: 'white',
    fenAntes: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4',
    jugadaRealizada: {
      numeroJugada: 12,
      turno: 'white',
      jugadaSAN: 'Qxf7??',
      fen: 'rnbqkb1r/pppp1Qpp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 4'
    },
    mejorJugada: 'd1e2',
    mejorJugadaSAN: 'Qe2',
    evaluaciónAntes: 50,
    evaluaciónDespués: -300,
    pérdidaCentipawns: 350,
    explicación: 'Las blancas jugaron Qxf7??',
    // Fix: After Qe2 (white), black has turn. Valid moves from the position:
    variante: ['f6e4', 'e2e4', 'd7d6'] // Ne4, Qxe4, d6
  };

  const mockOnCerrar = vi.fn();

  const defaultProps = {
    error: errorEjemplo,
    onCerrar: mockOnCerrar
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    it('debe renderizar el modal con la información del error', () => {
      render(<ModalVariante {...defaultProps} />);

      expect(screen.getByText('Variante de mejor jugada')).toBeInTheDocument();
      expect(screen.getByText(/Jugada:/i)).toBeInTheDocument();
      expect(screen.getByText('12 - Blancas')).toBeInTheDocument();
      expect(screen.getByText('Qe2')).toBeInTheDocument();
    });

    it('debe renderizar el tablero con la posición inicial', () => {
      render(<ModalVariante {...defaultProps} />);

      const tablero = screen.getByTestId('chessboard');
      expect(tablero).toBeInTheDocument();
      expect(tablero).toHaveAttribute('data-position', expect.stringContaining('rnbqkb1r'));
    });

    it('debe mostrar contador de posiciones', () => {
      render(<ModalVariante {...defaultProps} />);

      const counter = screen.getByTestId('position-counter');
      expect(counter.textContent).toMatch(/1\s*\/\s*5/);
    });

    it('debe mostrar información de posición inicial', () => {
      render(<ModalVariante {...defaultProps} />);

      expect(screen.getByText('Inicial')).toBeInTheDocument();
    });
  });

  describe('Navegación de variante', () => {
    it('debe permitir avanzar a la siguiente posición', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      const btnSiguiente = screen.getByLabelText('Jugada siguiente');
      await user.click(btnSiguiente);

      // Verificar que el contador cambia
      const counter = screen.getByTestId('position-counter');
      expect(counter.textContent).toMatch(/2\s*\/\s*5/);
      expect(screen.getByText(/Después de 1 jugada/i)).toBeInTheDocument();
    });

    it('debe permitir retroceder a la posición anterior', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      // Avanzar primero
      const btnSiguiente = screen.getByLabelText('Jugada siguiente');
      await user.click(btnSiguiente);

      // Retroceder
      const btnAnterior = screen.getByLabelText('Jugada anterior');
      await user.click(btnAnterior);

      const counter = screen.getByTestId('position-counter');
      expect(counter.textContent).toMatch(/1\s*\/\s*5/);
      expect(screen.getByText('Inicial')).toBeInTheDocument();
    });

    it('debe permitir ir al inicio', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      // Avanzar varias posiciones
      const btnSiguiente = screen.getByLabelText('Jugada siguiente');
      await user.click(btnSiguiente);
      await user.click(btnSiguiente);

      // Ir al inicio
      const btnInicio = screen.getByLabelText('Ir al inicio de la variante');
      await user.click(btnInicio);

      const counter = screen.getByTestId('position-counter');
      expect(counter.textContent).toMatch(/1\s*\/\s*5/);
      expect(screen.getByText('Inicial')).toBeInTheDocument();
    });

    it('debe permitir ir al final', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      const btnFinal = screen.getByLabelText('Ir al final de la variante');
      await user.click(btnFinal);

      const counter = screen.getByTestId('position-counter');
      expect(counter.textContent).toMatch(/5\s*\/\s*5/);
      expect(screen.getByText(/Después de 4 jugadas/i)).toBeInTheDocument();
    });

    it('debe deshabilitar botón anterior en posición inicial', () => {
      render(<ModalVariante {...defaultProps} />);

      const btnAnterior = screen.getByLabelText('Jugada anterior');
      const btnInicio = screen.getByLabelText('Ir al inicio de la variante');

      expect(btnAnterior).toBeDisabled();
      expect(btnInicio).toBeDisabled();
    });

    it('debe deshabilitar botón siguiente en posición final', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      // Ir al final
      const btnFinal = screen.getByLabelText('Ir al final de la variante');
      await user.click(btnFinal);

      const btnSiguiente = screen.getByLabelText('Jugada siguiente');
      expect(btnSiguiente).toBeDisabled();
      expect(btnFinal).toBeDisabled();
    });
  });

  describe('Navegación con teclado', () => {
    it('debe cerrar el modal con tecla Escape', async () => {
      render(<ModalVariante {...defaultProps} />);

      // Simular tecla Escape
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(mockOnCerrar).toHaveBeenCalled();
      });
    });

    it('debe avanzar con tecla flecha derecha', async () => {
      render(<ModalVariante {...defaultProps} />);

      // Simular tecla flecha derecha
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      window.dispatchEvent(event);

      await waitFor(() => {
        const counter = screen.getByTestId('position-counter');
        expect(counter.textContent).toMatch(/2\s*\/\s*5/);
      });
    });

    it('debe retroceder con tecla flecha izquierda', async () => {
      render(<ModalVariante {...defaultProps} />);

      // Avanzar primero
      let event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      window.dispatchEvent(event);

      await waitFor(() => {
        const counter = screen.getByTestId('position-counter');
        expect(counter.textContent).toMatch(/2\s*\/\s*5/);
      });

      // Retroceder
      event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);

      await waitFor(() => {
        const counter = screen.getByTestId('position-counter');
        expect(counter.textContent).toMatch(/1\s*\/\s*5/);
      });
    });
  });

  describe('Cerrar modal', () => {
    it('debe cerrar al hacer clic en el botón X', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      const btnCerrar = screen.getByLabelText('Cerrar modal');
      await user.click(btnCerrar);

      expect(mockOnCerrar).toHaveBeenCalled();
    });

    it('debe cerrar al hacer clic en el botón Cerrar', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      const btnCerrar = screen.getByText('Cerrar');
      await user.click(btnCerrar);

      expect(mockOnCerrar).toHaveBeenCalled();
    });

    it('debe cerrar al hacer clic fuera del modal', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      const overlay = document.querySelector('.modal-overlay');
      if (overlay) {
        await user.click(overlay);
        expect(mockOnCerrar).toHaveBeenCalled();
      }
    });

    it('NO debe cerrar al hacer clic dentro del modal', async () => {
      const user = userEvent.setup();
      render(<ModalVariante {...defaultProps} />);

      const modalContenido = document.querySelector('.modal-contenido');
      if (modalContenido) {
        await user.click(modalContenido);
        expect(mockOnCerrar).not.toHaveBeenCalled();
      }
    });
  });

  describe('Construcción de variante', () => {
    it('debe construir variante con la mejor jugada y jugadas adicionales', () => {
      render(<ModalVariante {...defaultProps} />);

      // Debería tener: posición inicial + mejor jugada + 3 jugadas de variante = 5 posiciones
      const counter = screen.getByTestId('position-counter');
      expect(counter.textContent).toMatch(/1\s*\/\s*5/);
    });

    it('debe funcionar sin variante adicional', () => {
      const errorSinVariante = { ...errorEjemplo, variante: [] };
      render(<ModalVariante {...defaultProps} error={errorSinVariante} />);

      // Debería tener: posición inicial + mejor jugada = 2 posiciones
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('debe manejar variante undefined', () => {
      const errorSinVariante = { ...errorEjemplo, variante: undefined };
      render(<ModalVariante {...defaultProps} error={errorSinVariante} />);

      // Debería tener: posición inicial + mejor jugada = 2 posiciones
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('debe detener construcción de variante en jugada inválida', () => {
      const errorConJugadaInvalida = {
        ...errorEjemplo,
        variante: ['f6e4', 'invalid_move', 'd7d6']
      };

      render(<ModalVariante {...defaultProps} error={errorConJugadaInvalida} />);

      // Debería detenerse después de Ne4 (f6e4)
      // Posiciones: inicial + mejor jugada (Qe2) + Ne4 = 3
      const counter = screen.getByTestId('position-counter');
      expect(counter.textContent).toMatch(/1\s*\/\s*3/);
    });
  });

  describe('Formato de turno', () => {
    it('debe mostrar "Blancas" para turno white', () => {
      render(<ModalVariante {...defaultProps} />);

      expect(screen.getByText('12 - Blancas')).toBeInTheDocument();
    });

    it('debe mostrar "Negras" para turno black', () => {
      const errorNegras = { ...errorEjemplo, turno: 'black' as const };
      render(<ModalVariante {...defaultProps} error={errorNegras} />);

      expect(screen.getByText('12 - Negras')).toBeInTheDocument();
    });
  });

  describe('Texto de ayuda', () => {
    it('debe mostrar ayuda de teclado', () => {
      render(<ModalVariante {...defaultProps} />);

      expect(screen.getByText(/Usa las teclas ← → para navegar, Esc para cerrar/i)).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener labels ARIA en todos los botones', () => {
      render(<ModalVariante {...defaultProps} />);

      expect(screen.getByLabelText('Ir al inicio de la variante')).toBeInTheDocument();
      expect(screen.getByLabelText('Jugada anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Jugada siguiente')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir al final de la variante')).toBeInTheDocument();
      expect(screen.getByLabelText('Cerrar modal')).toBeInTheDocument();
    });
  });

  describe('Limpieza de event listeners', () => {
    it('debe remover event listeners al desmontar', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<ModalVariante {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
