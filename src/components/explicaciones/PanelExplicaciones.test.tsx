/**
 * Tests para PanelExplicaciones
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelExplicaciones } from './PanelExplicaciones';
import type { ErrorDetectado } from '../../types/error';

// Mock de ModalVariante para evitar dependencias de Chessboard
vi.mock('./ModalVariante', () => ({
  ModalVariante: ({ onCerrar }: { onCerrar: () => void }) => (
    <div data-testid="modal-variante">
      <button onClick={onCerrar}>Cerrar Modal</button>
    </div>
  )
}));

describe('PanelExplicaciones', () => {
  const erroresEjemplo: ErrorDetectado[] = [
    {
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
      explicación: 'Las blancas jugaron Qxf7??, perdiendo la dama.',
      variante: ['e7f7']
    },
    {
      numeroJugada: 22,
      turno: 'black',
      fenAntes: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4',
      jugadaRealizada: {
        numeroJugada: 22,
        turno: 'black',
        jugadaSAN: 'Nxe4?',
        fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5'
      },
      mejorJugada: 'e8g8',
      mejorJugadaSAN: 'O-O',
      evaluaciónAntes: -20,
      evaluaciónDespués: 150,
      pérdidaCentipawns: 170,
      explicación: 'Las negras jugaron Nxe4? perdiendo material.',
      variante: []
    }
  ];

  const mockOnSeleccionarError = vi.fn();
  const mockOnVolver = vi.fn();
  const mockOnGenerarExplicaciónExtendida = vi.fn();

  const defaultProps = {
    error: erroresEjemplo[0],
    todosLosErrores: erroresEjemplo,
    índiceActual: 0,
    onSeleccionarError: mockOnSeleccionarError,
    onVolver: mockOnVolver,
    onGenerarExplicaciónExtendida: mockOnGenerarExplicaciónExtendida
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    it('debe renderizar el panel con la información del error', () => {
      render(<PanelExplicaciones {...defaultProps} />);

      // Verificar información del error
      expect(screen.getByText(/Jugada 12 - Blancas/i)).toBeInTheDocument();
      expect(screen.getByText('Qxf7??')).toBeInTheDocument();
      expect(screen.getByText('Qe2')).toBeInTheDocument();
      expect(screen.getByText(/350 centipawns/i)).toBeInTheDocument();
    });

    it('debe mostrar la explicación concisa', () => {
      render(<PanelExplicaciones {...defaultProps} />);

      expect(screen.getByText(/Las blancas jugaron Qxf7\?\?, perdiendo la dama/i)).toBeInTheDocument();
    });

    it('debe mostrar contador de errores', () => {
      render(<PanelExplicaciones {...defaultProps} />);

      expect(screen.getByText('Error 1 de 2')).toBeInTheDocument();
    });

    it('debe mostrar mensaje cuando no hay explicación', () => {
      const errorSinExplicación = { ...erroresEjemplo[0], explicación: undefined };
      render(
        <PanelExplicaciones
          {...defaultProps}
          error={errorSinExplicación}
        />
      );

      expect(screen.getByText(/No hay explicación disponible/i)).toBeInTheDocument();
    });
  });

  describe('Navegación entre errores', () => {
    it('debe permitir navegar al error siguiente', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      const btnSiguiente = screen.getByLabelText('Error siguiente');
      await user.click(btnSiguiente);

      expect(mockOnSeleccionarError).toHaveBeenCalledWith(1);
    });

    it('debe permitir navegar al error anterior', async () => {
      const user = userEvent.setup();
      render(
        <PanelExplicaciones
          {...defaultProps}
          error={erroresEjemplo[1]}
          índiceActual={1}
        />
      );

      const btnAnterior = screen.getByLabelText('Error anterior');
      await user.click(btnAnterior);

      expect(mockOnSeleccionarError).toHaveBeenCalledWith(0);
    });

    it('debe deshabilitar el botón anterior en el primer error', () => {
      render(<PanelExplicaciones {...defaultProps} índiceActual={0} />);

      const btnAnterior = screen.getByLabelText('Error anterior');
      expect(btnAnterior).toBeDisabled();
    });

    it('debe deshabilitar el botón siguiente en el último error', () => {
      render(
        <PanelExplicaciones
          {...defaultProps}
          error={erroresEjemplo[1]}
          índiceActual={1}
        />
      );

      const btnSiguiente = screen.getByLabelText('Error siguiente');
      expect(btnSiguiente).toBeDisabled();
    });
  });

  describe('Lista de errores', () => {
    it('debe mostrar la lista de errores al hacer clic en el botón', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      const btnLista = screen.getByLabelText('Ver lista de errores');
      await user.click(btnLista);

      // Verificar que se muestra la lista
      expect(screen.getByText(/Lista de errores detectados \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText('Jugada 12')).toBeInTheDocument();
      expect(screen.getByText('Jugada 22')).toBeInTheDocument();
    });

    it('debe permitir seleccionar un error desde la lista', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      // Abrir lista
      const btnLista = screen.getByLabelText('Ver lista de errores');
      await user.click(btnLista);

      // Seleccionar segundo error
      const itemError2 = screen.getByText('Jugada 22').closest('button');
      if (itemError2) {
        await user.click(itemError2);
      }

      expect(mockOnSeleccionarError).toHaveBeenCalledWith(1);
    });

    it('debe marcar el error actual en la lista', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} índiceActual={0} />);

      // Abrir lista
      const btnLista = screen.getByLabelText('Ver lista de errores');
      await user.click(btnLista);

      // Verificar badge de error actual
      expect(screen.getByText('Actual')).toBeInTheDocument();
    });

    it('debe volver al error actual desde la lista', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      // Abrir lista
      const btnLista = screen.getByLabelText('Ver lista de errores');
      await user.click(btnLista);

      // Volver
      const btnVolver = screen.getByLabelText('Volver al error actual');
      await user.click(btnVolver);

      // Verificar que volvemos a la vista de detalle
      expect(screen.getByText(/Las blancas jugaron Qxf7/i)).toBeInTheDocument();
    });
  });

  describe('Profundizar explicación', () => {
    it('debe generar explicación extendida al hacer clic', async () => {
      const user = userEvent.setup();
      mockOnGenerarExplicaciónExtendida.mockResolvedValue(
        'Explicación extendida muy detallada del error...'
      );

      render(<PanelExplicaciones {...defaultProps} />);

      const btnProfundizar = screen.getByLabelText('Generar explicación extendida');
      
      // Verificar estado inicial
      expect(btnProfundizar).toHaveTextContent('Profundizar explicación');
      
      await user.click(btnProfundizar);

      // Esperar a que se complete
      await waitFor(() => {
        expect(mockOnGenerarExplicaciónExtendida).toHaveBeenCalledWith(erroresEjemplo[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/Explicación extendida muy detallada/i)).toBeInTheDocument();
      });

      // El botón debe cambiar
      expect(screen.getByText(/Explicación extendida mostrada/i)).toBeInTheDocument();
    });

    it('debe mostrar spinner durante la carga', async () => {
      const user = userEvent.setup();
      mockOnGenerarExplicaciónExtendida.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('Explicación'), 500))
      );

      render(<PanelExplicaciones {...defaultProps} />);

      const btnProfundizar = screen.getByLabelText('Generar explicación extendida');
      await user.click(btnProfundizar);

      // Verificar que el botón está deshabilitado durante la carga
      expect(btnProfundizar).toBeDisabled();
      
      // Verificar que cambia el texto (antes que termine)
      await waitFor(() => {
        expect(btnProfundizar.textContent).toContain('Generando');
      }, { timeout: 100 });
    });

    it('debe deshabilitar el botón durante la carga', async () => {
      const user = userEvent.setup();
      mockOnGenerarExplicaciónExtendida.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('Explicación'), 100))
      );

      render(<PanelExplicaciones {...defaultProps} />);

      const btnProfundizar = screen.getByLabelText('Generar explicación extendida');
      await user.click(btnProfundizar);

      await waitFor(() => {
        expect(btnProfundizar).toBeDisabled();
      });
    });

    it('debe mostrar error si falla la generación', async () => {
      const user = userEvent.setup();
      mockOnGenerarExplicaciónExtendida.mockRejectedValue(new Error('Error de API'));

      const {  container } = render(<PanelExplicaciones {...defaultProps} />);

      const btnProfundizar = screen.getByLabelText('Generar explicación extendida');
      await user.click(btnProfundizar);

      // Esperar a que se muestre el mensaje de error
      await waitFor(() => {
        const errorDiv = container.querySelector('.error-generacion');
        expect(errorDiv).not.toBeNull();
        expect(errorDiv?.textContent).toContain('No se pudo generar');
      }, { timeout: 2000 });
    });

    it('no debe permitir profundizar si ya hay explicación extendida', async () => {
      const errorConExtendida = {
        ...erroresEjemplo[0],
        explicaciónExtendida: 'Ya existe explicación extendida'
      };

      render(
        <PanelExplicaciones
          {...defaultProps}
          error={errorConExtendida}
        />
      );

      const btnProfundizar = screen.getByText(/Explicación extendida mostrada/i);
      expect(btnProfundizar).toBeDisabled();
    });
  });

  describe('Modal de variante', () => {
    it('debe abrir el modal al hacer clic en "Mostrar en tablero"', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      const btnMostrarTablero = screen.getByLabelText('Mostrar variante en tablero interactivo');
      await user.click(btnMostrarTablero);

      // Verificar que el modal se abre
      expect(screen.getByTestId('modal-variante')).toBeInTheDocument();
    });

    it('debe cerrar el modal', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      // Abrir modal
      const btnMostrarTablero = screen.getByLabelText('Mostrar variante en tablero interactivo');
      await user.click(btnMostrarTablero);

      // Cerrar modal
      const btnCerrarModal = screen.getByText('Cerrar Modal');
      await user.click(btnCerrarModal);

      // Verificar que el modal se cierra
      expect(screen.queryByTestId('modal-variante')).not.toBeInTheDocument();
    });
  });

  describe('Botón volver', () => {
    it('debe llamar a onVolver al hacer clic', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      const btnVolver = screen.getByLabelText('Volver al análisis completo');
      await user.click(btnVolver);

      expect(mockOnVolver).toHaveBeenCalled();
    });

    it('debe llamar a onVolver desde la lista', async () => {
      const user = userEvent.setup();
      render(<PanelExplicaciones {...defaultProps} />);

      // Abrir lista
      const btnLista = screen.getByLabelText('Ver lista de errores');
      await user.click(btnLista);

      // Volver desde lista
      const btnVolverAnalisis = screen.getByText('Volver a análisis');
      await user.click(btnVolverAnalisis);

      expect(mockOnVolver).toHaveBeenCalled();
    });
  });

  describe('Formato de información', () => {
    it('debe formatear el turno en español', () => {
      render(<PanelExplicaciones {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /Jugada 12 - Blancas/i })).toBeInTheDocument();

      const { rerender } = render(
        <PanelExplicaciones
          {...defaultProps}
          error={erroresEjemplo[1]}
        />
      );
      
      rerender(
        <PanelExplicaciones
          {...defaultProps}
          error={erroresEjemplo[1]}
        />
      );
      
      expect(screen.getByRole('heading', { name: /Jugada 22 - Negras/i })).toBeInTheDocument();
    });

    it('debe redondear la pérdida de centipawns', () => {
      const errorConDecimales = {
        ...erroresEjemplo[0],
        pérdidaCentipawns: 350.7
      };

      render(
        <PanelExplicaciones
          {...defaultProps}
          error={errorConDecimales}
        />
      );

      expect(screen.getByText(/351 centipawns/i)).toBeInTheDocument();
    });
  });

  describe('Animación fade-in', () => {
    it('debe aplicar clase fade-in a la explicación', () => {
      render(<PanelExplicaciones {...defaultProps} />);

      const explicacionTexto = document.querySelector('.explicacion-texto.fade-in');
      expect(explicacionTexto).toBeInTheDocument();
      expect(explicacionTexto).toHaveClass('fade-in');
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener labels ARIA en botones de navegación', () => {
      render(<PanelExplicaciones {...defaultProps} />);

      expect(screen.getByLabelText('Error anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Error siguiente')).toBeInTheDocument();
      expect(screen.getByLabelText('Ver lista de errores')).toBeInTheDocument();
    });

    it('debe tener labels ARIA en botones de acción', () => {
      render(<PanelExplicaciones {...defaultProps} />);

      expect(screen.getByLabelText('Generar explicación extendida')).toBeInTheDocument();
      expect(screen.getByLabelText('Mostrar variante en tablero interactivo')).toBeInTheDocument();
      expect(screen.getByLabelText('Volver al análisis completo')).toBeInTheDocument();
    });
  });
});
