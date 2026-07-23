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
    it('debe generar explicación básica sin usar IA', () => {
      const explicación = generador.generarExplicaciónBásica(errorEjemplo);

      // Verificar que la explicación contiene información clave
      expect(explicación).toContain('Jugada 15');
      expect(explicación).toContain('Blancas');
      expect(explicación).toContain('Qxf7??');
      expect(explicación).toContain('350 centipawns');
      expect(explicación).toContain('O-O');
    });

    it('debe generar explicación para error de negras', () => {
      const errorNegras: ErrorDetectado = {
        ...errorEjemplo,
        turno: 'black',
        jugadaRealizada: {
          ...errorEjemplo.jugadaRealizada,
          turno: 'black'
        }
      };

      const explicación = generador.generarExplicaciónBásica(errorNegras);

      expect(explicación).toContain('Negras');
    });

    it('debe formatear pérdida de centipawns correctamente', () => {
      const errorConPérdidaDecimal: ErrorDetectado = {
        ...errorEjemplo,
        pérdidaCentipawns: 123.456
      };

      const explicación = generador.generarExplicaciónBásica(errorConPérdidaDecimal);

      // Debe redondear a entero
      expect(explicación).toContain('123 centipawns');
    });
  });

  describe('generarExplicaciónConcisa', () => {
    it('debe llamar a ClienteGroq con parámetros correctos', async () => {
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
      expect(llamada.modelo).toBe('llama-3.1-8b-instant');
      expect(llamada.mensajes).toHaveLength(2);
      expect(llamada.mensajes[0].rol).toBe('system');
      expect(llamada.mensajes[1].rol).toBe('user');
      expect(llamada.longitudMáxima).toBe(500); // ~150 palabras
      expect(llamada.temperatura).toBe(0.7);

      // Verificar contenido del prompt de usuario
      const promptUsuario = llamada.mensajes[1].contenido;
      expect(promptUsuario).toContain('Qxf7??');
      expect(promptUsuario).toContain('O-O');
      expect(promptUsuario).toContain('350 centipawns');

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
      expect(llamada.modelo).toBe('llama-3.1-8b-instant');
      expect(llamada.longitudMáxima).toBe(1000); // ~300 palabras
      expect(llamada.temperatura).toBe(0.7);

      // Verificar que el prompt extendido incluye más contexto
      const promptUsuario = llamada.mensajes[1].contenido;
      expect(promptUsuario).toContain('Analiza en profundidad');
      expect(promptUsuario).toContain('Evaluación antes del error: 50');
      expect(promptUsuario).toContain('Evaluación después del error: -300');
      expect(promptUsuario).toContain('300 palabras');

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
    it('debe incluir prompt del sistema en todas las llamadas', async () => {
      const respuestaMock = {
        choices: [{ message: { content: 'Respuesta' } }]
      };

      vi.mocked(clienteGroqMock.chatCompletion).mockResolvedValue(respuestaMock as any);

      await generador.generarExplicaciónConcisa(errorEjemplo);

      const llamada = vi.mocked(clienteGroqMock.chatCompletion).mock.calls[0][0];
      const mensajeSistema = llamada.mensajes[0];

      // Verificar que el mensaje del sistema establece el rol de entrenador
      expect(mensajeSistema.rol).toBe('system');
      expect(mensajeSistema.contenido).toContain('entrenador de ajedrez');
      expect(mensajeSistema.contenido).toContain('castellano');
      expect(mensajeSistema.contenido).toContain('educativo');
    });
  });

  describe('Casos especiales', () => {
    it('debe manejar errores con pérdida muy grande', () => {
      const errorGrande: ErrorDetectado = {
        ...errorEjemplo,
        pérdidaCentipawns: 2000
      };

      const explicación = generador.generarExplicaciónBásica(errorGrande);
      expect(explicación).toContain('2000 centipawns');
    });

    it('debe manejar jugadas con notación especial', () => {
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
      expect(explicación).toContain('Nf3');
    });
  });
});
