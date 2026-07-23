# Motor Stockfish con Web Worker

Este módulo proporciona una interfaz TypeScript para integrar Stockfish.js en el navegador usando Web Workers para análisis no bloqueante.

## Arquitectura

```
Hilo Principal              Web Worker                Stockfish WASM
┌────────────┐             ┌──────────────┐          ┌───────────────┐
│            │  postMessage │              │   UCI    │               │
│ MotorStock │─────────────>│ stockfish-   │─────────>│  Stockfish.js │
│  fish.ts   │              │  worker.ts   │          │     WASM      │
│            │<─────────────│              │<─────────│               │
└────────────┘  onmessage  └──────────────┘          └───────────────┘
```

## Componentes

### MotorStockfish.ts

Clase wrapper principal que gestiona la comunicación con el Web Worker.

**Métodos principales:**

- `inicializar()`: Carga y prepara Stockfish (timeout 5s)
- `analizarPosición(fen, profundidad)`: Analiza una posición
- `detener()`: Detiene el análisis actual
- `terminar()`: Libera todos los recursos
- `enviarComandoUCI(comando)`: Envía comandos UCI personalizados

### stockfish-worker.ts

Web Worker que ejecuta Stockfish en un hilo separado.

**Protocolo de mensajes:**

Hacia el worker:
- `inicializar`: Carga Stockfish WASM
- `analizar`: Analiza una posición (requiere fen, profundidad)
- `detener`: Detiene análisis en progreso
- `comando`: Envía comando UCI directo

Desde el worker:
- `listo`: Stockfish inicializado correctamente
- `resultado`: Análisis completado con mejorJugada, evaluación, etc.
- `error`: Error durante la operación
- `info`: Mensajes informativos

## Uso

### Básico

```typescript
import { MotorStockfish } from '@/services/stockfish';

// Crear instancia
const motor = new MotorStockfish();

// Inicializar (solo una vez)
await motor.inicializar();

// Analizar posición inicial
const resultado = await motor.analizarPosición(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  15 // profundidad
);

console.log('Mejor jugada:', resultado.mejorJugada); // ej: "e2e4"
console.log('Evaluación:', resultado.evaluación);     // ej: 25 (centipawns)
console.log('Profundidad:', resultado.profundidad);   // ej: 15

// Limpiar al finalizar
motor.terminar();
```

### Con Manejo de Errores

```typescript
try {
  const motor = new MotorStockfish();
  await motor.inicializar();
  
  const resultado = await motor.analizarPosición(fen, 15);
  
  if (resultado.mate) {
    console.log(`Mate en ${resultado.mate} jugadas`);
  } else {
    console.log(`Evaluación: ${resultado.evaluación} cp`);
  }
  
} catch (error) {
  console.error('Error en análisis:', error);
}
```

### Configuración Avanzada

```typescript
// Configurar opciones UCI después de inicializar
motor.enviarComandoUCI('setoption name Threads value 2');
motor.enviarComandoUCI('setoption name Hash value 128'); // 128 MB
motor.enviarComandoUCI('setoption name MultiPV value 1');

// Luego analizar normalmente
const resultado = await motor.analizarPosición(fen, 15);
```

### Análisis Secuencial

```typescript
const motor = new MotorStockfish();
await motor.inicializar();

const fens = [/* array de posiciones */];
const resultados = [];

for (const fen of fens) {
  try {
    const resultado = await motor.analizarPosición(fen, 15);
    resultados.push(resultado);
  } catch (error) {
    console.error(`Error analizando ${fen}:`, error);
  }
}

motor.terminar();
```

## Requisitos

### Archivos Stockfish

El proyecto debe incluir los archivos de Stockfish.js en la carpeta `/public/stockfish/`:

```
public/
└── stockfish/
    ├── stockfish.js          # Script principal
    └── stockfish.wasm.js     # Motor WASM
```

Puedes obtenerlos de:
- https://github.com/nmrugg/stockfish.js
- https://cdn.jsdelivr.net/npm/stockfish.js@11/

### Configuración Vite

Asegurate de que Vite permita Web Workers:

```typescript
// vite.config.ts
export default defineConfig({
  worker: {
    format: 'es' // o 'iife'
  }
});
```

## Protocolo UCI

El worker implementa los siguientes comandos UCI:

- `uci`: Inicializa el protocolo
- `isready`: Verifica si el motor está listo
- `position fen <fen>`: Establece la posición
- `go depth <n>`: Analiza a profundidad N
- `stop`: Detiene el análisis
- `setoption name <option> value <value>`: Configura opciones

## Timeouts y Límites

- **Inicialización**: 5 segundos (requisito 3.2)
- **Análisis por posición**: 2 segundos (requisito 4.5)
- **Profundidad por defecto**: 15 plies (requisito 4.2)

## Evaluación

Los valores de evaluación son en centipawns:
- **Positivo**: Ventaja de blancas
- **Negativo**: Ventaja de negras
- **0**: Posición equilibrada
- **±10000**: Mate (normalizado)

## Notas Importantes

1. **Una instancia a la vez**: No crear múltiples instancias simultáneas
2. **Inicializar antes de usar**: Siempre llamar a `inicializar()` primero
3. **Limpiar recursos**: Llamar a `terminar()` cuando no se necesite más
4. **Análisis secuencial**: Esperar a que termine un análisis antes de iniciar otro
5. **Hilo separado**: Todo el procesamiento ocurre en Web Worker (no bloquea UI)

## Solución de Problemas

### "Stockfish no está inicializado"
Asegúrate de llamar a `await motor.inicializar()` antes de analizar.

### "Ya hay un análisis en progreso"
Espera a que termine el análisis actual o llama a `motor.detener()`.

### "Timeout inicializando Stockfish"
Verifica que los archivos de Stockfish estén en `/public/stockfish/`.

### "Error en worker: ..."
Revisa la consola del navegador para ver errores del worker.
Verifica que el navegador soporte Web Workers y WASM.

## Referencias

- **Stockfish.js**: https://github.com/nmrugg/stockfish.js
- **Protocolo UCI**: https://www.shredderchess.com/download/div/uci.zip
- **Web Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
