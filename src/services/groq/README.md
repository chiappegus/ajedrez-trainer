# ClienteGroq

Cliente para comunicarse con la API de Groq para generar explicaciones en lenguaje natural de errores de ajedrez.

## Feature

`lichess-game-analysis`

## Requisitos Validados

- **8.1**: Enviar contexto del error a Groq API usando el modelo llama-3.1-8b-instant
- **8.2**: Incluir en el contexto: FEN, jugada realizada, mejor jugada, cambio de evaluación y turno

## Descripción

La clase `ClienteGroq` proporciona una interfaz TypeScript para interactuar con la API de Groq, permitiendo generar explicaciones educativas de errores de ajedrez mediante el modelo de lenguaje `llama-3.1-8b-instant`.

## Uso

### Importación

```typescript
import { ClienteGroq } from '@/services/groq';
```

### Crear una instancia

```typescript
const cliente = new ClienteGroq('gsk_tu_api_key');
```

### Generar una explicación

```typescript
const respuesta = await cliente.chatCompletion({
  modelo: 'llama-3.1-8b-instant',
  mensajes: [
    {
      rol: 'system',
      contenido: 'Eres un entrenador de ajedrez educativo.'
    },
    {
      rol: 'user',
      contenido: 'Analiza este error de ajedrez...'
    }
  ],
  longitudMáxima: 500,
  temperatura: 0.7
});

const explicación = respuesta.choices[0].message.content;
```

## API

### Constructor

```typescript
constructor(apiKey: string)
```

Crea una nueva instancia del cliente Groq.

**Parámetros:**
- `apiKey`: Clave de API de Groq para autenticación

**Lanza:**
- `Error` si la API key está vacía

### Método chatCompletion

```typescript
async chatCompletion(parámetros: ParámetrosChatCompletion): Promise<RespuestaGroq>
```

Realiza una petición de chat completion a la API de Groq.

**Parámetros:**
- `parámetros.modelo`: Modelo a utilizar (ej: 'llama-3.1-8b-instant')
- `parámetros.mensajes`: Lista de mensajes de la conversación
- `parámetros.longitudMáxima`: (Opcional) Número máximo de tokens a generar
- `parámetros.temperatura`: (Opcional) Temperatura para controlar aleatoriedad (0.0-2.0)

**Retorna:**
- `Promise<RespuestaGroq>`: Respuesta de la API con el contenido generado

**Lanza:**
- `Error` si la petición falla o la respuesta es inválida

## Interfaces

### Mensaje

```typescript
interface Mensaje {
  rol: 'system' | 'user' | 'assistant';
  contenido: string;
}
```

### ParámetrosChatCompletion

```typescript
interface ParámetrosChatCompletion {
  modelo: string;
  mensajes: Mensaje[];
  longitudMáxima?: number;
  temperatura?: number;
}
```

### RespuestaGroq

```typescript
interface RespuestaGroq {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## Endpoint

El cliente se comunica con el siguiente endpoint de Groq:

```
https://api.groq.com/openai/v1/chat/completions
```

## Manejo de Errores

El cliente maneja los siguientes códigos de error HTTP:

- **401**: API key inválida o expirada
- **429**: Rate limit excedido
- **500**: Error interno del servidor de Groq
- **503**: Servicio no disponible

En caso de error, el cliente lanza una excepción con un mensaje descriptivo.

## Modelo Utilizado

**llama-3.1-8b-instant**

- Velocidad: Muy rápida
- Contexto: 8k tokens
- Ideal para: Explicaciones concisas de ajedrez
- Balance: Óptimo entre velocidad y calidad

## Ejemplos

Ver `ClienteGroq.example.ts` para ejemplos completos de uso incluyendo:

- Explicaciones concisas
- Explicaciones extendidas
- Manejo de errores
- Uso con diferentes temperaturas
- Integración con análisis de partidas

## Testing

Las pruebas unitarias se encuentran en `ClienteGroq.test.ts` y cubren:

- Creación de instancia
- Peticiones exitosas
- Parámetros opcionales
- Manejo de errores HTTP (401, 429, 500)
- Errores de red
- Conversión de formato de mensajes
- Validación de endpoint

Ejecutar tests:

```bash
npm test -- ClienteGroq.test.ts
```

## Documentación en Castellano

Toda la documentación, comentarios y nombres de variables están en castellano siguiendo la convención del proyecto.
