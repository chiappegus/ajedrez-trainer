/**
 * Tests unitarios para GeneradorExplicaciones
 * Feature: lichess-game-analysis
 * Valida: Requisitos 8.1, 8.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeneradorExplicaciones } from './GeneradorExplicaciones';
import { ClienteGroq } from '../groq/ClienteGroq';
import type { ErrorDetectado } from '../../types/error';

describe('GeneradorExplicaciones', () => {
  let generador: GeneradorExplicaciones;
  let clienteGroqMock: ClienteGroq;

  // Error de ejemplo para los tests
  const errorEjemplo: ErrorDetectado = {
    numeroJugada: 15,
    turno: 'white',
    fenAntes: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 5',
    jugadaRealizada: {
      numeroJugada: 15,
      turno: 'white',
      jugadaSAN: 'Qxf7??',
      fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNB1K2R b KQkq - 0 5'
    },
    mejorJugada: 'e1g1',
    mejorJugadaSAN: 'O-O',
    evaluaciónAntes: 50,
    evaluaciónDespués: -300,
    pérdidaCentipawns: 350
  };

  beforeEach(() => {
    // Crear mock de ClienteGroq
    clienteGroqMock = {
      chatCompletion: vi.fn()
    } as any;

    // Crear instancia del generador con el mock
    generador = new GeneradorExplicaciones(clienteGroqMock);
  });

  describe('generarExplicaciónBásica', () => {
    it('debe generar explicación básica con figurines Unicode', () => {
      const explicación = generador.generarExplicaciónBásica(errorEjemplo);

      // Verificar que usa figurine para la dama (Q -> ♛)
      expect(explicación).toContain('♛xf7??');
      // O-O no se modifica
      expect(explicación).toContain('O-O');
      // Usa "jugaste" en segunda persona
      expect(explicación).toContain('jugaste');
      // Muestra pérdida en cp
      expect(explicación).toContain('350 cp');
    });

    it('debe mostrar "mate" cuando la pérdida es >= 9000', () => {
      const errorMate: ErrorDetectado = {
        ...errorEjemplo,
        pérdidaCentipawns: 9500
      };

      const explicación = generador.generarExplicaciónBásica(errorMate);
      expect(explicación).toContain('mate');
      expect(explicación).not.toContain('9500');
    });

    it('debe redondear pérdida de centipawns', () => {
      const errorConPérdidaDecimal: ErrorDetectado = {
        ...errorEjemplo,
        pérdidaCentipawns: 123.456
      };

      const explicación = generador.generarExplicaciónBásica(errorConPérdidaDecimal);
      expect(explicación).toContain('123 cp');
    });

    it('debe manejar jugadas de peón sin figurine', () => {
      const errorPeon: ErrorDetectado = {
        ...errorEjemplo,
        jugadaRealizada: {
          ...errorEjemplo.jugadaRealizada,
          jugadaSAN: 'e4'
        },
        mejorJugadaSAN: 'd5'
      };

      const explicación = generador.generarExplicaciónBásica(errorPeon);
      expect(explicación).toContain('e4');
      expect(explicación).toContain('d5');
    });
  });

  describe('generarExplicaciónConcisa', () => {
    it('debe llamar a ClienteGroq con modelo openai/gpt-oss-20b', async () => {
      const respuestaMock = {
        choices: [{
          message: {
            content: 'Explicación concisa generada por IA'
          }
        }]
      };

      vi.mocked(clienteGroqMock.chatCompletion).mockResolvedValue(respuestaMock as any);

      const explicación = await generador.generarExplicaciónConcisa(errorEjemplo);

      // Verificar que se llamó a chatCompletion
      expect(clienteGroqMock.chatCompletion).toHaveBeenCalledTimes(1);

      // Verificar parámetros de la llamada
      const llamada = vi.mocked(clienteGroqMock.chatCompletion).mock.calls[0][0];
      expect(llamada.modelo).toBe('openai/gpt-oss-20b');
      expect(llamada.mensajes).toHaveLength(2);
      expect(llamada.mensajes[0].rol).toBe('system');
      expect(llamada.mensajes[1].rol).toBe('user');
      expect(llamada.longitudMáxima).toBe(800);
      expect(llamada.temperatura).toBe(0.6);

      // Verificar contenido del prompt usa figurines
      const promptUsuario = llamada.mensajes[1].contenido;
      expect(promptUsuario).toContain('♛xf7??');
      expect(promptUsuario).toContain('O-O');

      // Verificar que retorna la explicación de Groq
      expect(explicación).toBe('Explicación concisa generada por IA');
    });

    it('debe propagar error si Groq API falla', async () => {
      vi.mocked(clienteGroqMock.chatCompletion).mockRejectedValue(
        new Error('Error de API de Groq')
      );

      await expect(generador.generarExplicaciónConcisa(errorEjemplo))
        .rejects
        .toThrow('Error de API de Groq');
    });
  });

  describe('generarExplicaciónExtendida', () => {
    it('debe llamar a ClienteGroq con parámetros para explicación extendida', async () => {
      const respuestaMock = {
        choices: [{
          message: {
            content: 'Explicación extendida detallada generada por IA con análisis táctico completo'
          }
        }]
      };

      vi.mocked(clienteGroqMock.chatCompletion).mockResolvedValue(respuestaMock as any);

      const explicación = await generador.generarExplicaciónExtendida(errorEjemplo);

      // Verificar que se llamó a chatCompletion
      expect(clienteGroqMock.chatCompletion).toHaveBeenCalledTimes(1);

      // Verificar parámetros de la llamada
      const llamada = vi.mocked(clienteGroqMock.chatCompletion).mock.calls[0][0];
      expect(llamada.modelo).toBe('openai/gpt-oss-20b');
      expect(llamada.longitudMáxima).toBe(1200);
      expect(llamada.temperatura).toBe(0.6);

      // Verificar que el prompt extendido pide ~300 palabras
      const promptUsuario = llamada.mensajes[1].contenido;
      expect(promptUsuario).toContain('300 palabras');
      expect(promptUsuario).toContain('♛xf7??');

      // Verificar que retorna la explicación de Groq
      expect(explicación).toBe('Explicación extendida detallada generada por IA con análisis táctico completo');
    });

    it('debe propagar error si Groq API falla', async () => {
      vi.mocked(clienteGroqMock.chatCompletion).mockRejectedValue(
        new Error('Error de red')
      );

      await expect(generador.generarExplicaciónExtendida(errorEjemplo))
        .rejects
        .toThrow('Error de red');
    });
  });

  describe('Integración con prompt del sistema', () => {
    it('debe incluir prompt del sistema con reglas de figurines Unicode', async () => {
      const respuestaMock = {
        choices: [{ message: { content: 'Respuesta' } }]
      };

      vi.mocked(clienteGroqMock.chatCompletion).mockResolvedValue(respuestaMock as any);

      await generador.generarExplicaciónConcisa(errorEjemplo);

      const llamada = vi.mocked(clienteGroqMock.chatCompletion).mock.calls[0][0];
      const mensajeSistema = llamada.mensajes[0];

      // Verificar que el mensaje del sistema tiene las reglas correctas
      expect(mensajeSistema.rol).toBe('system');
      expect(mensajeSistema.contenido).toContain('castellano');
      expect(mensajeSistema.contenido).toContain('figurine Unicode');
      expect(mensajeSistema.contenido).toContain('♚');
      expect(mensajeSistema.contenido).toContain('segunda persona');
    });

    it('debe instruir al modelo a solo hablar del error del estudiante', async () => {
      const respuestaMock = {
        choices: [{ message: { content: 'Respuesta' } }]
      };

      vi.mocked(clienteGroqMock.chatCompletion).mockResolvedValue(respuestaMock as any);

      await generador.generarExplicaciónConcisa(errorEjemplo);

      const llamada = vi.mocked(clienteGroqMock.chatCompletion).mock.calls[0][0];
      const mensajeSistema = llamada.mensajes[0];

      expect(mensajeSistema.contenido).toContain('Solo habla de la jugada del estudiante');
      expect(mensajeSistema.contenido).toContain('NO analices la respuesta del oponente');
    });
  });

  describe('Casos especiales', () => {
    it('debe manejar jugadas con notación de enroque', () => {
      const errorEnroque: ErrorDetectado = {
        ...errorEjemplo,
        jugadaRealizada: {
          numeroJugada: 8,
          turno: 'white',
          jugadaSAN: 'O-O-O',
          fen: 'test'
        },
        mejorJugadaSAN: 'Nf3'
      };

      const explicación = generador.generarExplicaciónBásica(errorEnroque);
      expect(explicación).toContain('O-O-O');
      // Nf3 se convierte a figurine ♞f3
      expect(explicación).toContain('♞f3');
    });

    it('debe convertir piezas a figurine en explicación básica', () => {
      const errorCaballo: ErrorDetectado = {
        ...errorEjemplo,
        jugadaRealizada: {
          ...errorEjemplo.jugadaRealizada,
          jugadaSAN: 'Nxd5'
        },
        mejorJugadaSAN: 'Bb5+'
      };

      const explicación = generador.generarExplicaciónBásica(errorCaballo);
      expect(explicación).toContain('♞xd5');
      expect(explicación).toContain('♝b5+');
    });
  });
});
