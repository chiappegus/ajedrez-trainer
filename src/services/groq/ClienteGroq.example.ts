/**
 * Ejemplos de uso de ClienteGroq
 * Feature: lichess-game-analysis
 * 
 * Este archivo contiene ejemplos de cómo usar el cliente de Groq API
 * para generar explicaciones de errores de ajedrez.
 */

import { ClienteGroq } from './ClienteGroq';
import type { ParámetrosChatCompletion } from './ClienteGroq';

// ============================================================================
// Ejemplo 1: Crear una instancia del cliente
// ============================================================================

const apiKey = 'gsk_tu_api_key_aqui';
const cliente = new ClienteGroq(apiKey);

// ============================================================================
// Ejemplo 2: Generar una explicación concisa de un error de ajedrez
// ============================================================================

async function ejemploExplicaciónConcisa() {
  const parámetros: ParámetrosChatCompletion = {
    modelo: 'llama-3.1-8b-instant',
    mensajes: [
      {
        rol: 'system',
        contenido: `Eres un entrenador de ajedrez educativo y amigable.
Tu tarea es explicar errores en partidas de ajedrez en castellano, de forma clara y concisa.

Para cada error, debes explicar:
1. Qué jugada se realizó
2. Por qué fue un error (consecuencias tácticas/posicionales)
3. Qué se debió jugar en su lugar
4. Qué amenazas o tácticas se pasaron por alto

Usa terminología de ajedrez en español. Mantén un tono educativo y motivador.
Sé conciso pero completo.`
      },
      {
        rol: 'user',
        contenido: `Analiza este error de ajedrez:

Posición (FEN): rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4
Turno: Blancas
Jugada realizada: Qxf7??
Mejor jugada alternativa: Qe2
Pérdida de evaluación: 350 centipawns

Proporciona una explicación educativa en máximo 150 palabras.`
      }
    ],
    longitudMáxima: 500,
    temperatura: 0.7
  };

  try {
    const respuesta = await cliente.chatCompletion(parámetros);
    const explicación = respuesta.choices[0].message.content;
    
    console.log('Explicación generada:');
    console.log(explicación);
    console.log('\nTokens usados:', respuesta.usage.total_tokens);
  } catch (error) {
    console.error('Error al generar explicación:', error);
  }
}

// ============================================================================
// Ejemplo 3: Generar una explicación extendida con más detalles
// ============================================================================

async function ejemploExplicaciónExtendida() {
  const parámetros: ParámetrosChatCompletion = {
    modelo: 'llama-3.1-8b-instant',
    mensajes: [
      {
        rol: 'system',
        contenido: `Eres un entrenador de ajedrez experto que proporciona análisis tácticos detallados.
Explica errores de ajedrez con profundidad, incluyendo variantes, consecuencias y lecciones estratégicas.`
      },
      {
        rol: 'user',
        contenido: `Proporciona un análisis detallado de este error:

Posición (FEN): r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4
Turno: Negras
Jugada realizada: Nxe4??
Mejor jugada alternativa: d6
Pérdida de evaluación: 280 centipawns

Incluye:
- Análisis táctico de por qué la jugada fue un error
- Variante principal después de la mejor jugada
- Consecuencias de la jugada realizada
- Lección estratégica que el jugador debe aprender

Máximo 300 palabras.`
      }
    ],
    longitudMáxima: 1000,
    temperatura: 0.7
  };

  try {
    const respuesta = await cliente.chatCompletion(parámetros);
    const explicaciónExtendida = respuesta.choices[0].message.content;
    
    console.log('Explicación extendida generada:');
    console.log(explicaciónExtendida);
    console.log('\nTokens usados:', respuesta.usage.total_tokens);
  } catch (error) {
    console.error('Error al generar explicación extendida:', error);
  }
}

// ============================================================================
// Ejemplo 4: Manejo de errores comunes
// ============================================================================

async function ejemploManejoErrores() {
  // Error 1: API Key inválida
  try {
    const clienteInválido = new ClienteGroq('api_key_invalida');
    await clienteInválido.chatCompletion({
      modelo: 'llama-3.1-8b-instant',
      mensajes: [{ rol: 'user', contenido: 'Test' }]
    });
  } catch (error) {
    console.error('Error esperado - API key inválida:', error);
  }

  // Error 2: Rate limit excedido
  try {
    // Simulación de múltiples peticiones rápidas que podrían exceder el rate limit
    const promesas = Array(10).fill(null).map(() =>
      cliente.chatCompletion({
        modelo: 'llama-3.1-8b-instant',
        mensajes: [{ rol: 'user', contenido: 'Test' }]
      })
    );
    await Promise.all(promesas);
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      console.error('Rate limit excedido. Espera un momento antes de reintentar.');
    }
  }

  // Error 3: Error de red
  try {
    // Si hay problemas de conexión
    await cliente.chatCompletion({
      modelo: 'llama-3.1-8b-instant',
      mensajes: [{ rol: 'user', contenido: 'Test' }]
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Network')) {
      console.error('Error de red. Verifica tu conexión a internet.');
    }
  }
}

// ============================================================================
// Ejemplo 5: Uso con diferentes temperaturas
// ============================================================================

async function ejemploTemperaturas() {
  const prompt = {
    modelo: 'llama-3.1-8b-instant',
    mensajes: [
      {
        rol: 'system',
        contenido: 'Eres un entrenador de ajedrez.'
      },
      {
        rol: 'user',
        contenido: 'Explica brevemente por qué controlar el centro es importante en la apertura.'
      }
    ]
  };

  // Temperatura baja (0.3) - más determinista y conservador
  console.log('Respuesta con temperatura baja (0.3):');
  const respuestaBaja = await cliente.chatCompletion({
    ...prompt,
    temperatura: 0.3,
    longitudMáxima: 200
  });
  console.log(respuestaBaja.choices[0].message.content);
  console.log('---\n');

  // Temperatura media (0.7) - balance entre creatividad y coherencia
  console.log('Respuesta con temperatura media (0.7):');
  const respuestaMedia = await cliente.chatCompletion({
    ...prompt,
    temperatura: 0.7,
    longitudMáxima: 200
  });
  console.log(respuestaMedia.choices[0].message.content);
  console.log('---\n');

  // Temperatura alta (1.2) - más creativo y variado
  console.log('Respuesta con temperatura alta (1.2):');
  const respuestaAlta = await cliente.chatCompletion({
    ...prompt,
    temperatura: 1.2,
    longitudMáxima: 200
  });
  console.log(respuestaAlta.choices[0].message.content);
}

// ============================================================================
// Ejemplo 6: Integración con el flujo de análisis de partidas
// ============================================================================

interface ErrorAjedrez {
  numeroJugada: number;
  turno: 'white' | 'black';
  fenAntes: string;
  jugadaRealizada: string;
  mejorJugada: string;
  pérdidaCentipawns: number;
}

async function generarExplicaciónParaError(error: ErrorAjedrez): Promise<string> {
  const turnoStr = error.turno === 'white' ? 'Blancas' : 'Negras';
  
  const parámetros: ParámetrosChatCompletion = {
    modelo: 'llama-3.1-8b-instant',
    mensajes: [
      {
        rol: 'system',
        contenido: `Eres un entrenador de ajedrez educativo que explica errores de forma clara y motivadora en castellano.`
      },
      {
        rol: 'user',
        contenido: `Analiza este error de ajedrez:

Jugada ${error.numeroJugada}
Posición (FEN): ${error.fenAntes}
Turno: ${turnoStr}
Jugada realizada: ${error.jugadaRealizada}
Mejor jugada alternativa: ${error.mejorJugada}
Pérdida de evaluación: ${error.pérdidaCentipawns} centipawns

Proporciona una explicación educativa concisa en máximo 150 palabras explicando:
1. Qué se jugó y por qué fue un error
2. Qué se debió jugar
3. Qué amenazas o tácticas se pasaron por alto
4. Las consecuencias de este error`
      }
    ],
    longitudMáxima: 500,
    temperatura: 0.7
  };

  try {
    const respuesta = await cliente.chatCompletion(parámetros);
    return respuesta.choices[0].message.content;
  } catch (error) {
    // Fallback a explicación básica si Groq falla
    return `Jugada ${error.numeroJugada}: ${turnoStr} jugó ${error.jugadaRealizada}, 
perdiendo ${error.pérdidaCentipawns} centipawns. 
La mejor jugada era ${error.mejorJugada}. 
Esta jugada empeoró significativamente la posición.`;
  }
}

// Ejemplo de uso
const errorEjemplo: ErrorAjedrez = {
  numeroJugada: 12,
  turno: 'white',
  fenAntes: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 6',
  jugadaRealizada: 'Ng5??',
  mejorJugada: 'O-O',
  pérdidaCentipawns: 220
};

generarExplicaciónParaError(errorEjemplo).then(explicación => {
  console.log('Explicación del error:');
  console.log(explicación);
});

// ============================================================================
// Ejecutar ejemplos (comentar/descomentar según necesidad)
// ============================================================================

// Nota: Estos ejemplos requieren una API key válida de Groq para funcionar.
// Descomenta las líneas siguientes para ejecutar los ejemplos:

// ejemploExplicaciónConcisa();
// ejemploExplicaciónExtendida();
// ejemploManejoErrores();
// ejemploTemperaturas();
