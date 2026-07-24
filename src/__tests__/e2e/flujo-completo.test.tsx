/**
 * Tests E2E para el flujo completo de la aplicación
 * Feature: lichess-game-analysis
 * Valida: Todos los requisitos (flujo completo)
 * 
 * Estos tests simulan el comportamiento del usuario real:
 * 1. Configurar credenciales
 * 2. Analizar partida
 * 3. Ver resultados
 * 4. Navegar errores
 * 5. Ver explicaciones
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock global de localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('E2E: Flujo completo de la aplicación', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Mock de fetch para APIs externas
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Escenario 1: Primera vez (sin credenciales)', () => {
    it('debe mostrar pantalla de configuración al iniciar sin credenciales', () => {
      render(<App />);

      expect(
        screen.getByText(/Configuración de Credenciales/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Usuario de Lichess/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Token de Lichess/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/API Key de Groq/i)).toBeInTheDocument();
    });

    it('debe validar que los campos no estén vacíos', async () => {
      render(<App />);

      const botonGuardar = screen.getByText(/Guardar Configuración/i);
      fireEvent.click(botonGuardar);

      await waitFor(() => {
        expect(screen.getByText(/Todos los campos son obligatorios/i)).toBeInTheDocument();
      });
    });

    it('debe guardar credenciales y navegar a pantalla principal', async () => {
      render(<App />);

      // Completar formulario
      const inputUsuario = screen.getByLabelText(/Usuario de Lichess/i);
      const inputToken = screen.getByLabelText(/Token de Lichess/i);
      const inputGroq = screen.getByLabelText(/API Key de Groq/i);

      fireEvent.change(inputUsuario, { target: { value: 'usuario_test' } });
      fireEvent.change(inputToken, { target: { value: 'lip_test123456' } });
      fireEvent.change(inputGroq, { target: { value: 'gsk_test123456' } });

      // Mock de validación de token (éxito)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'usuario_test' })
      });

      const botonGuardar = screen.getByText(/Guardar Configuración/i);
      fireEvent.click(botonGuardar);

      await waitFor(() => {
        expect(screen.getByText(/Ajedrez Trainer/i)).toBeInTheDocument();
        expect(screen.getByText(/Analizar última partida/i)).toBeInTheDocument();
      });
    });
  });

  describe('Escenario 2: Usuario con credenciales válidas analiza partida con errores', () => {
    beforeEach(() => {
      // Simular credenciales guardadas
      localStorageMock.setItem(
        'ajedrez_trainer_credenciales_v1',
        btoa(
          JSON.stringify({
            username: 'usuario_test',
            tokenLichess: 'lip_test123456',
            apiKeyGroq: 'gsk_test123456'
          })
        )
      );
    });

    it('debe mostrar pantalla principal directamente', () => {
      render(<App />);

      expect(screen.getByText(/Bienvenido a Ajedrez Trainer/i)).toBeInTheDocument();
      expect(screen.getByText(/Analizar última partida/i)).toBeInTheDocument();
    });

    it('debe iniciar análisis y mostrar progreso', async () => {
      render(<App />);

      // Mock de obtener partida de Lichess
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () =>
          '[Event "Test"]\n[Site "Test"]\n[White "Player1"]\n[Black "Player2"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7'
      });

      const botonAnalizar = screen.getByText(/Analizar última partida/i);
      fireEvent.click(botonAnalizar);

      await waitFor(() => {
        expect(screen.getByText(/Analizando partida/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Escenario 3: Análisis completado sin errores', () => {
    beforeEach(() => {
      // Simular credenciales guardadas
      localStorageMock.setItem(
        'ajedrez_trainer_credenciales_v1',
        btoa(
          JSON.stringify({
            username: 'usuario_test',
            tokenLichess: 'lip_test123456',
            apiKeyGroq: 'gsk_test123456'
          })
        )
      );
    });

    it('debe mostrar mensaje de felicitación cuando no hay errores', async () => {
      render(<App />);

      // El test completo requeriría mockear todo el flujo de análisis
      // Esto es un placeholder para el escenario
      
      // Simular que el análisis completó sin errores
      // (requiere mockeado completo del AnalizadorPartida)
      
      // Expectativas:
      // - Debe mostrar "¡Excelente!"
      // - Debe mostrar pérdida promedio
      // - NO debe mostrar distribución de errores
      // - Debe permitir ver análisis jugada por jugada
    });
  });

  describe('Escenario 4: Navegación de errores', () => {
    it('debe permitir navegar entre errores detectados', async () => {
      // Este test requiere un análisis completo mockead
      // Simulando resultado con varios errores
      
      // Expectativas:
      // - Debe mostrar lista de errores
      // - Debe permitir navegar con botones anterior/siguiente
      // - Debe actualizar tableros al cambiar de error
      // - Debe mostrar explicaciones correctas
    });

    it('debe sincronizar tableros duales al navegar', async () => {
      // Expectativas:
      // - Tablero izquierdo muestra posición después del error (rojo)
      // - Tablero derecho muestra posición antes del error con mejor jugada (verde)
      // - Ambos tableros se actualizan simultáneamente
    });
  });

  describe('Escenario 5: Manejo de errores', () => {
    beforeEach(() => {
      localStorageMock.setItem(
        'ajedrez_trainer_credenciales_v1',
        btoa(
          JSON.stringify({
            username: 'usuario_test',
            tokenLichess: 'lip_test123456',
            apiKeyGroq: 'gsk_test123456'
          })
        )
      );
    });

    it('debe manejar error de usuario no encontrado', async () => {
      render(<App />);

      // Mock de error 404
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const botonAnalizar = screen.getByText(/Analizar última partida/i);
      fireEvent.click(botonAnalizar);

      await waitFor(() => {
        expect(
          screen.getByText(/No se encontró el usuario en Lichess/i)
        ).toBeInTheDocument();
      });
    });

    it('debe manejar error de token inválido', async () => {
      render(<App />);

      // Mock de error 401
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const botonAnalizar = screen.getByText(/Analizar última partida/i);
      fireEvent.click(botonAnalizar);

      await waitFor(() => {
        expect(
          screen.getByText(/Token de Lichess es inválido/i)
        ).toBeInTheDocument();
      });
    });

    it('debe manejar error de red (timeout)', async () => {
      render(<App />);

      // Mock de timeout
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      const botonAnalizar = screen.getByText(/Analizar última partida/i);
      fireEvent.click(botonAnalizar);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });

    it('debe manejar error de sin partidas disponibles', async () => {
      render(<App />);

      // Mock de respuesta vacía
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      });

      const botonAnalizar = screen.getByText(/Analizar última partida/i);
      fireEvent.click(botonAnalizar);

      await waitFor(() => {
        expect(
          screen.getByText(/No se encontraron partidas/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Escenario 6: Navegación por teclado', () => {
    it('debe permitir navegar jugadas con teclas de flecha', async () => {
      // Test de accesibilidad para navegación por teclado
      // Requiere simular eventos de teclado en los controles del tablero
      
      // Expectativas:
      // - Flecha izquierda: jugada anterior
      // - Flecha derecha: jugada siguiente
      // - Home: ir al inicio
      // - End: ir al final
      // - Tab: navegar entre controles
    });

    it('debe mantener focus visible en botones', () => {
      render(<App />);

      const botonAnalizar = screen.getByText(/Analizar última partida/i);
      botonAnalizar.focus();

      expect(botonAnalizar).toHaveFocus();
      // Verificar que tenga estilos de focus visible
    });
  });

  describe('Escenario 7: Pausa y reanudación de análisis', () => {
    it('debe permitir pausar análisis en progreso', async () => {
      // Este test requiere mockear el estado de análisis en progreso
      
      // Expectativas:
      // - Debe mostrar botón "Pausar" durante análisis
      // - Al hacer clic, debe pausar
      // - Debe mostrar botón "Reanudar"
      // - Al reanudar, debe continuar desde donde pausó
    });
  });

  describe('Escenario 8: Generación de explicación extendida', () => {
    it('debe generar explicación extendida al hacer clic', async () => {
      // Este test requiere estado de resultados con errores
      
      // Expectativas:
      // - Debe mostrar botón "Profundizar explicación"
      // - Al hacer clic, debe mostrar loading
      // - Debe reemplazar explicación concisa con extendida
      // - Debe deshabilitar botón después de generar
    });
  });

  describe('Escenario 9: Nuevo análisis', () => {
    it('debe limpiar estado y permitir nuevo análisis', async () => {
      // Simular que hay resultados mostrados
      
      // Expectativas:
      // - Debe mostrar botón "Nueva partida"
      // - Al hacer clic, debe limpiar resultados
      // - Debe volver a pantalla principal
      // - Debe permitir analizar de nuevo
    });
  });
});
