---
inclusion: always
---

# Regla de Idioma: Castellano

## Regla Principal

**TODO el código, documentación, comentarios, mensajes de usuario, y contenido generado en este proyecto DEBE estar en castellano (español).**

## Alcance

### ✅ Debe estar en Castellano:
- Comentarios en código
- Nombres de variables (cuando sea posible sin afectar legibilidad)
- Nombres de funciones que no sean hooks de React
- Mensajes de error y advertencia
- Textos de interfaz de usuario
- Documentación inline
- Logs y mensajes de consola
- Explicaciones generadas por IA
- Nombres de props cuando sean descriptivos

### ❌ Puede permanecer en Inglés:
- Nombres de componentes React (PascalCase)
- Hooks de React (use* pattern)
- Nombres de tipos TypeScript (interfaces, types)
- Palabras clave del lenguaje (const, function, return, etc.)
- Nombres de librerías y APIs externas
- Términos técnicos sin traducción equivalente (hook, callback, props)

## Ejemplos

### ✅ Correcto:
```typescript
// Obtener la última partida del usuario
const obtenerUltimaPartida = async (usuario: string) => {
  const respuesta = await fetch(`/api/partidas/${usuario}`);
  if (!respuesta.ok) {
    throw new Error('No se pudo obtener la partida');
  }
  return respuesta.json();
};
```

### ❌ Incorrecto:
```typescript
// Get user's last game
const getLastGame = async (username: string) => {
  const response = await fetch(`/api/games/${username}`);
  if (!response.ok) {
    throw new Error('Could not fetch game');
  }
  return response.json();
};
```

## Groq API - Instrucciones Específicas

Todas las solicitudes a Groq API DEBEN incluir en el prompt del sistema:
- Instrucción explícita de responder ÚNICAMENTE en castellano
- Uso de terminología de ajedrez en español
- Tono educativo y amigable

## Excepciones Permitidas

- URLs y endpoints de APIs externas
- Nombres de paquetes npm
- Comandos de terminal
- Configuración de herramientas (package.json scripts, etc.)
