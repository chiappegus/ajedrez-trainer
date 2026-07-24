/**
 * Pruebas de integración para ClienteLichess
 * Feature: lichess-game-analysis
 * Valida: Requisitos 1.1, 1.3, 1.4, 1.5
 * 
 * Estas pruebas verifican la integración con la API de Lichess usando mocks de fetch.
 * Se prueban todos los casos de éxito y error especificados en los requisitos.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClienteLichess } from '../../services/lichess/ClienteLichess';

describe('ClienteLichess - Pruebas de Integración', () => {
  // Guardar el fetch original para restaurarlo después
  const fetchOriginal = global.fetch;
  
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restaurar el fetch original después de cada prueba
    global.fetch = fetchOriginal;
  });

  describe('validarToken', () => {
    it('debe retornar true cuando el token es válido (200 OK)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_test_valid_token');

      // Act
      const resultado = await cliente.validarToken();

      // Assert
      expect(resultado).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://lichess.org/api/account',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer lip_test_valid_token',
          },
        })
      );
    });

    it('debe retornar false cuando el token es inválido (401 Unauthorized)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_invalid_token');

      // Act
      const resultado = await cliente.validarToken();

      // Assert
      expect(resultado).toBe(false);
    });

    it('debe retornar false cuando hay error de red (fetch falla)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_test_token');

      // Act
      const resultado = await cliente.validarToken();

      // Assert
      expect(resultado).toBe(false);
    });

    it('debe lanzar error cuando ocurre timeout (>5 segundos)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error('The operation was aborted');
          error.name = 'TimeoutError';
          reject(error);
        });
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_test_token');

      // Act & Assert
      await expect(cliente.validarToken()).rejects.toThrow(
        'La validación del token tardó demasiado. Verifica tu conexión.'
      );
    });

    it('debe lanzar error descriptivo cuando hay error de red genérico', async () => {
      // Arrange
      const mockFetch = vi.fn().mockRejectedValue(
        new Error('Network connection failed')
      );
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_test_token');

      // Act & Assert
      await expect(cliente.validarToken()).rejects.toThrow(
        'Error de red al validar token'
      );
    });
  });

  describe('obtenerCuentaUsuario', () => {
    it('debe obtener información de cuenta con token válido', async () => {
      // Arrange
      const cuentaMock = {
        id: 'testuser123',
        username: 'TestUser',
        perfs: {
          blitz: { rating: 1500 },
          rapid: { rating: 1600 },
        },
        createdAt: 1234567890000,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => cuentaMock,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_valid_token');

      // Act
      const cuenta = await cliente.obtenerCuentaUsuario();

      // Assert
      expect(cuenta).toEqual(cuentaMock);
      expect(cuenta.username).toBe('TestUser');
      expect(cuenta.perfs.blitz.rating).toBe(1500);
    });

    it('debe lanzar error cuando el token es inválido (401)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_invalid_token');

      // Act & Assert
      await expect(cliente.obtenerCuentaUsuario()).rejects.toThrow(
        'Token de API inválido o expirado'
      );
    });

    it('debe lanzar error cuando se excede el rate limit (429)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_test_token');

      // Act & Assert
      await expect(cliente.obtenerCuentaUsuario()).rejects.toThrow(
        'Rate limit excedido. Por favor espera un minuto e intenta de nuevo'
      );
    });

    it('debe lanzar error genérico para otros códigos de estado', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_test_token');

      // Act & Assert
      await expect(cliente.obtenerCuentaUsuario()).rejects.toThrow(
        'Error de API de Lichess: 503'
      );
    });
  });

  describe('obtenerÚltimaPartida', () => {
    it('debe obtener última partida en formato PGN con usuario válido', async () => {
      // Arrange - Simular respuesta PGN de Lichess
      const pgnRespuesta = `[Event "Rated Blitz"]\n[White "Player1"]\n[Black "Player2"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 *`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => pgnRespuesta,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_valid_token');

      // Act
      const pgn = await cliente.obtenerÚltimaPartida('testuser');

      // Assert
      expect(pgn).toContain('[Event "Rated Blitz"]');
      expect(pgn).toContain('1. e4 e5');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://lichess.org/api/games/user/testuser?max=1',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer lip_valid_token',
            'Accept': 'application/x-chess-pgn',
          },
        })
      );
    });

    it('debe usar el nombre de usuario del constructor si no se proporciona parámetro', async () => {
      // Arrange
      const pgnRespuesta = `1. e4 e5 *`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => pgnRespuesta,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_token', 'defaultuser');

      // Act
      const pgn = await cliente.obtenerÚltimaPartida();

      // Assert
      expect(pgn).toContain('1. e4 e5');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://lichess.org/api/games/user/defaultuser?max=1',
        expect.anything()
      );
    });

    it('debe lanzar error cuando el nombre de usuario no existe (404)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_valid_token');

      // Act & Assert
      await expect(cliente.obtenerÚltimaPartida('usuarioinexistente')).rejects.toThrow(
        'Nombre de usuario no encontrado'
      );
    });

    it('debe lanzar error cuando no se proporcionó nombre de usuario', async () => {
      // Arrange
      const cliente = new ClienteLichess('lip_token'); // Sin nombre de usuario

      // Act & Assert
      await expect(cliente.obtenerÚltimaPartida()).rejects.toThrow(
        'Nombre de usuario no proporcionado'
      );
    });

    it('debe lanzar error cuando el usuario no tiene partidas (respuesta vacía)', async () => {
      // Arrange - Respuesta vacía
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '\n\n  \n',
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_valid_token');

      // Act & Assert
      await expect(cliente.obtenerÚltimaPartida('usersinjuegos')).rejects.toThrow(
        'No se encontraron partidas de ese tipo para este usuario'
      );
    });

    it('debe lanzar error cuando el token es inválido (401)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_invalid_token');

      // Act & Assert
      await expect(cliente.obtenerÚltimaPartida('testuser')).rejects.toThrow(
        'Token de API inválido o expirado'
      );
    });

    it('debe lanzar error cuando se excede el rate limit (429)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_token');

      // Act & Assert
      await expect(cliente.obtenerÚltimaPartida('testuser')).rejects.toThrow(
        'Rate limit excedido. Por favor espera un minuto e intenta de nuevo'
      );
    });

    it('debe retornar el PGN trimmed correctamente', async () => {
      // Arrange - PGN con whitespace extra
      const pgnRespuesta = `\n[Event "Blitz"]\n\n1. e4 e5 *\n\n`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => pgnRespuesta,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_token');

      // Act
      const pgn = await cliente.obtenerÚltimaPartida('testuser');

      // Assert - Debe retornar PGN sin whitespace al inicio/final
      expect(pgn).toBe('[Event "Blitz"]\n\n1. e4 e5 *');
    });

    it('debe manejar timeout correctamente (>15 segundos)', async () => {
      // Arrange
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 100);
        });
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_token');

      // Act & Assert
      await expect(cliente.obtenerÚltimaPartida('testuser')).rejects.toThrow();
    });

    it('debe incluir encabezado Accept correcto para PGN', async () => {
      // Arrange
      const pgnRespuesta = `1. e4 e5 *`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => pgnRespuesta,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_token');

      // Act
      await cliente.obtenerÚltimaPartida('testuser');

      // Assert - Verificar que se envió el header correcto
      const llamada = mockFetch.mock.calls[0];
      expect(llamada[1].headers['Accept']).toBe('application/x-chess-pgn');
    });

    it('debe configurar timeout en la petición', async () => {
      // Arrange
      const pgnRespuesta = `1. e4 e5 *`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => pgnRespuesta,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_token');

      // Act
      await cliente.obtenerÚltimaPartida('testuser');

      // Assert - Verificar que se configuró el signal con timeout
      const llamada = mockFetch.mock.calls[0];
      expect(llamada[1].signal).toBeDefined();
    });
  });

  describe('Casos de borde y edge cases', () => {
    it('debe manejar PGN con caracteres especiales', async () => {
      // Arrange
      const pgnRespuesta = `[Event "Test\\nGame"]\n\n1. e4 e5 { Comentario con "comillas" } *`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => pgnRespuesta,
      });
      global.fetch = mockFetch;

      const cliente = new ClienteLichess('lip_token');

      // Act
      const pgn = await cliente.obtenerÚltimaPartida('testuser');

      // Assert
      expect(pgn).toBeDefined();
      expect(typeof pgn).toBe('string');
    });

    it('debe manejar respuestas con diferentes códigos de error HTTP', async () => {
      // Arrange
      const codigosError = [400, 403, 500, 502, 503];

      for (const codigo of codigosError) {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: false,
          status: codigo,
        });
        global.fetch = mockFetch;

        const cliente = new ClienteLichess('lip_token');

        // Act & Assert
        await expect(cliente.obtenerÚltimaPartida('testuser')).rejects.toThrow(
          `Error de API de Lichess: ${codigo}`
        );
      }
    });
  });
});
