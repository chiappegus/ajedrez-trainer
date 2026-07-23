/**
 * Pruebas unitarias para ClienteGroq
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.1, 8.9
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClienteGroq } from './ClienteGroq';
import type { ParámetrosChatCompletion, RespuestaGroq } from './ClienteGroq';

// Mock global de fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ClienteGroq', () => {
  let cliente: ClienteGroq;
  const API_KEY_VÁLIDA = 'gsk_test_key_123456789';

  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    mockFetch.mockReset();
  });

  describe('Constructor', () => {
    it('debe crear instancia con API key válida', () => {
      expect(() => {
        cliente = new ClienteGroq(API_KEY_VÁLIDA);
      }).not.toThrow();
    });

    it('debe lanzar error si API key está vacía', () => {
      expect(() => {
        new ClienteGroq('');
      }).toThrow('API Key de Groq es requerida');
    });

    it('debe lanzar error si API key es solo espacios', () => {
      expect(() => {
        new ClienteGroq('   ');
      }).toThrow('API Key de Groq es requerida');
    });
  });

  describe('chatCompletion', () => {
    beforeEach(() => {
      cliente = new ClienteGroq(API_KEY_VÁLIDA);
    });

    it('debe realizar petición exitosa con respuesta válida', async () => {
      // Preparar respuesta mock
      const respuestaMock: RespuestaGroq = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'llama-3.1-8b-instant',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Esta es una explicación de ajedrez en castellano.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => respuestaMock
      });

      // Ejecutar
      const parámetros: ParámetrosChatCompletion = {
        modelo: 'llama-3.1-8b-instant',
        mensajes: [
          { rol: 'system', contenido: 'Eres un entrenador de ajedrez.' },
          { rol: 'user', contenido: 'Explica este error de ajedrez.' }
        ],
        longitudMáxima: 500,
        temperatura: 0.7
      };

      const respuesta = await cliente.chatCompletion(parámetros);

      // Verificar
      expect(respuesta).toEqual(respuestaMock);
      expect(respuesta.choices[0].message.content).toContain('ajedrez');

      // Verificar que fetch fue llamado correctamente
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${API_KEY_VÁLIDA}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('debe enviar parámetros opcionales cuando se proporcionan', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test',
          object: 'chat.completion',
          created: Date.now(),
          model: 'llama-3.1-8b-instant',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: 'Test' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await cliente.chatCompletion({
        modelo: 'llama-3.1-8b-instant',
        mensajes: [{ rol: 'user', contenido: 'Test' }],
        longitudMáxima: 300,
        temperatura: 0.8
      });

      const llamada = mockFetch.mock.calls[0];
      const body = JSON.parse(llamada[1].body);

      expect(body.max_tokens).toBe(300);
      expect(body.temperature).toBe(0.8);
    });

    it('debe omitir parámetros opcionales cuando no se proporcionan', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test',
          object: 'chat.completion',
          created: Date.now(),
          model: 'llama-3.1-8b-instant',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: 'Test' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await cliente.chatCompletion({
        modelo: 'llama-3.1-8b-instant',
        mensajes: [{ rol: 'user', contenido: 'Test' }]
      });

      const llamada = mockFetch.mock.calls[0];
      const body = JSON.parse(llamada[1].body);

      expect(body.max_tokens).toBeUndefined();
      expect(body.temperature).toBeUndefined();
    });

    it('debe manejar error 401 (API key inválida)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error'
          }
        })
      });

      await expect(
        cliente.chatCompletion({
          modelo: 'llama-3.1-8b-instant',
          mensajes: [{ rol: 'user', contenido: 'Test' }]
        })
      ).rejects.toThrow('Error de Groq API: 401 - Invalid API key');
    });

    it('debe manejar error 429 (rate limit)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error'
          }
        })
      });

      await expect(
        cliente.chatCompletion({
          modelo: 'llama-3.1-8b-instant',
          mensajes: [{ rol: 'user', contenido: 'Test' }]
        })
      ).rejects.toThrow('Error de Groq API: 429 - Rate limit exceeded');
    });

    it('debe manejar error 500 (error del servidor)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            message: 'Internal server error',
            type: 'server_error'
          }
        })
      });

      await expect(
        cliente.chatCompletion({
          modelo: 'llama-3.1-8b-instant',
          mensajes: [{ rol: 'user', contenido: 'Test' }]
        })
      ).rejects.toThrow('Error de Groq API: 500 - Internal server error');
    });

    it('debe manejar error sin cuerpo JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error('No JSON');
        }
      });

      await expect(
        cliente.chatCompletion({
          modelo: 'llama-3.1-8b-instant',
          mensajes: [{ rol: 'user', contenido: 'Test' }]
        })
      ).rejects.toThrow('Error de Groq API: 503 - Error desconocido');
    });

    it('debe manejar errores de red', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        cliente.chatCompletion({
          modelo: 'llama-3.1-8b-instant',
          mensajes: [{ rol: 'user', contenido: 'Test' }]
        })
      ).rejects.toThrow('Network error');
    });

    it('debe convertir correctamente los mensajes al formato de API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test',
          object: 'chat.completion',
          created: Date.now(),
          model: 'llama-3.1-8b-instant',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: 'Test' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await cliente.chatCompletion({
        modelo: 'llama-3.1-8b-instant',
        mensajes: [
          { rol: 'system', contenido: 'System prompt' },
          { rol: 'user', contenido: 'User message' },
          { rol: 'assistant', contenido: 'Assistant response' }
        ]
      });

      const llamada = mockFetch.mock.calls[0];
      const body = JSON.parse(llamada[1].body);

      expect(body.messages).toEqual([
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: 'Assistant response' }
      ]);
    });

    it('debe usar el endpoint correcto de Groq', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test',
          object: 'chat.completion',
          created: Date.now(),
          model: 'llama-3.1-8b-instant',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: 'Test' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await cliente.chatCompletion({
        modelo: 'llama-3.1-8b-instant',
        mensajes: [{ rol: 'user', contenido: 'Test' }]
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.any(Object)
      );
    });
  });
});
