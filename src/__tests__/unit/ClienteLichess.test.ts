/**
 * Tests unitarios para ClienteLichess
 * Feature: lichess-game-analysis
 * Valida: Requisitos 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClienteLichess } from '../../services/lichess/ClienteLichess';

describe('ClienteLichess', () => {
  let cliente: ClienteLichess;
  const tokenPrueba = 'lip_test_token_123';
  const usuarioPrueba = 'testuser';

  beforeEach(() => {
    cliente = new ClienteLichess(tokenPrueba, usuarioPrueba);
    // Limpiar mocks entre tests
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('debe crear instancia con token y username', () => {
      const clienteNuevo = new ClienteLichess('lip_abc', 'usuario');
      expect(clienteNuevo).toBeInstanceOf(ClienteLichess);
    });

    it('debe crear instancia solo con token', () => {
      const clienteNuevo = new ClienteLichess('lip_abc');
      expect(clienteNuevo).toBeInstanceOf(ClienteLichess);
    });
  });

  describe('validarToken', () => {
    it('debe retornar true cuando el token es válido', async () => {
      // Mock de fetch con respuesta exitosa
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const resultado = await cliente.validarToken();

      expect(resultado).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://lichess.org/api/account',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenPrueba}`,
          },
        })
      );
    });

    it('debe retornar false cuando el token es inválido', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const resultado = await cliente.validarToken();

      expect(resultado).toBe(false);
    });

    it('debe lanzar error descriptivo en caso de timeout', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      global.fetch = vi.fn().mockRejectedValue(timeoutError);

      await expect(cliente.validarToken()).rejects.toThrow(
        'La validación del token tardó demasiado. Verifica tu conexión.'
      );
    });

    it('debe lanzar error genérico en caso de error de red', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(cliente.validarToken()).rejects.toThrow('Error de red al validar token');
    });
  });

  describe('obtenerCuentaUsuario', () => {
    it('debe retornar información de cuenta cuando el token es válido', async () => {
      const cuentaMock = {
        id: 'user123',
        username: 'testuser',
        perfs: {
          blitz: { rating: 1500 },
          rapid: { rating: 1600 },
        },
        createdAt: 1234567890000,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => cuentaMock,
      });

      const cuenta = await cliente.obtenerCuentaUsuario();

      expect(cuenta).toEqual(cuentaMock);
      expect(cuenta.username).toBe('testuser');
      expect(cuenta.perfs.blitz.rating).toBe(1500);
    });

    it('debe lanzar error cuando el token es inválido', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(cliente.obtenerCuentaUsuario()).rejects.toThrow(
        'Token de API inválido o expirado'
      );
    });

    it('debe lanzar error con código de status para otros errores', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(cliente.obtenerCuentaUsuario()).rejects.toThrow(
        'Error de API de Lichess: 500'
      );
    });
  });

  describe('obtenerÚltimaPartida', () => {
    const pgnMock = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *';
    const ndjsonRespuesta = JSON.stringify({
      id: 'abc123',
      pgn: pgnMock,
      rated: true,
    });

    it('debe retornar PGN de la última partida', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => ndjsonRespuesta,
      });

      const pgn = await cliente.obtenerÚltimaPartida();

      expect(pgn).toBe(pgnMock);
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lichess.org/api/games/user/${usuarioPrueba}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenPrueba}`,
            'Accept': 'application/x-ndjson',
          },
        })
      );
    });

    it('debe usar username proporcionado como parámetro', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => ndjsonRespuesta,
      });

      const usuarioCustom = 'otrousuario';
      await cliente.obtenerÚltimaPartida(usuarioCustom);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://lichess.org/api/games/user/${usuarioCustom}`,
        expect.anything()
      );
    });

    it('debe lanzar error cuando no se proporciona username', async () => {
      const clienteSinUsuario = new ClienteLichess(tokenPrueba);

      await expect(clienteSinUsuario.obtenerÚltimaPartida()).rejects.toThrow(
        'Nombre de usuario no proporcionado'
      );
    });

    it('debe lanzar error cuando el usuario no existe (404)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(cliente.obtenerÚltimaPartida()).rejects.toThrow(
        'Nombre de usuario no encontrado'
      );
    });

    it('debe lanzar error cuando el token es inválido (401)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(cliente.obtenerÚltimaPartida()).rejects.toThrow(
        'Token de API inválido o expirado'
      );
    });

    it('debe lanzar error cuando no hay partidas', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '', // Respuesta vacía
      });

      await expect(cliente.obtenerÚltimaPartida()).rejects.toThrow(
        'No se encontraron partidas para este usuario'
      );
    });

    it('debe lanzar error cuando la partida no contiene PGN', async () => {
      const partidaSinPGN = JSON.stringify({
        id: 'abc123',
        rated: true,
        // Sin campo pgn
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => partidaSinPGN,
      });

      await expect(cliente.obtenerÚltimaPartida()).rejects.toThrow(
        'La partida no contiene datos PGN'
      );
    });

    it('debe manejar respuesta NDJSON con múltiples partidas y retornar solo la primera', async () => {
      const partida1 = JSON.stringify({ id: '1', pgn: '1. e4 e5 *' });
      const partida2 = JSON.stringify({ id: '2', pgn: '1. d4 d5 *' });
      const ndjsonMultiple = `${partida1}\n${partida2}`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => ndjsonMultiple,
      });

      const pgn = await cliente.obtenerÚltimaPartida();

      expect(pgn).toBe('1. e4 e5 *');
    });

    it('debe lanzar error con código genérico para otros errores de API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(cliente.obtenerÚltimaPartida()).rejects.toThrow(
        'Error de API de Lichess: 500'
      );
    });
  });

  describe('configuración de headers', () => {
    it('debe incluir Authorization Bearer en todas las peticiones', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ pgn: '1. e4 *' }),
        json: async () => ({ id: 'test' }),
      });

      await cliente.validarToken();
      await cliente.obtenerCuentaUsuario();
      await cliente.obtenerÚltimaPartida();

      // Verificar que todas las llamadas incluyen el header de autorización
      const llamadas = (global.fetch as any).mock.calls;
      llamadas.forEach((llamada: any) => {
        expect(llamada[1].headers.Authorization).toBe(`Bearer ${tokenPrueba}`);
      });
    });
  });

  describe('manejo de timeouts', () => {
    it('debe usar timeout de 5 segundos para validación', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      await cliente.validarToken();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('debe usar timeout de 10 segundos para obtener partidas', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ pgn: '1. e4 *' }),
      });

      await cliente.obtenerÚltimaPartida();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});
