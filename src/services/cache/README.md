# CacheEvaluaciones

Sistema de caché LRU (Least Recently Used) para evaluaciones de posiciones de ajedrez con Stockfish.

## Propósito

El `CacheEvaluaciones` optimiza el rendimiento del análisis de partidas evitando re-evaluar posiciones que ya fueron analizadas. Esto es especialmente útil cuando:

- Se analizan partidas con posiciones repetidas (aperturas comunes, transposiciones)
- Se analizan múltiples partidas con aperturas similares
- Se navega repetidamente por las mismas posiciones en la UI

## Características

- **Estrategia LRU**: Elimina automáticamente las entradas más antiguas cuando se alcanza el límite
- **Límite configurable**: Por defecto 1000 posiciones, personalizable según necesidades
- **Estadísticas de uso**: Proporciona métricas sobre tamaño, límite y utilización
- **Operaciones O(1)**: Uso de `Map` de JavaScript para acceso rápido

## Uso Básico

```typescript
import { CacheEvaluaciones } from './services/cache';

// Crear caché con límite de 1000 posiciones (por defecto)
const cache = new CacheEvaluaciones();

// Crear caché con límite personalizado
const cacheGrande = new CacheEvaluaciones(5000);

// Almacenar evaluación
const evaluacion: Evaluación = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  centipawns: 25,
  mejorJugada: 'e2e4',
  mejorJugadaSAN: 'e4',
  profundidad: 15,
  tiempoEvaluación: 1500
};

cache.almacenar(evaluacion.fen, evaluacion);

// Obtener evaluación del caché
const evaluacionCacheada = cache.obtener(evaluacion.fen);

if (evaluacionCacheada) {
  console.log('Evaluación encontrada en caché');
} else {
  console.log('Evaluación no está en caché');
}

// Verificar si una posición está en caché
if (cache.contiene(fen)) {
  console.log('Posición en caché');
}

// Limpiar caché
cache.limpiar();
```

## Integración con EvaluadorJugadas

El caché está integrado automáticamente en `EvaluadorJugadas`:

```typescript
import { MotorStockfish } from './services/stockfish';
import { EvaluadorJugadas } from './services/analisis';

// Crear evaluador con caché de 1000 posiciones (por defecto)
const motor = new MotorStockfish();
const evaluador = new EvaluadorJugadas(motor);

// Crear evaluador con límite de caché personalizado
const evaluadorGrande = new EvaluadorJugadas(motor, 5000);

// Primera evaluación - llama a Stockfish
const eval1 = await evaluador.evaluarPosición(fen);
console.log(`Primera evaluación: ${eval1.tiempoEvaluación}ms`);

// Segunda evaluación de la misma posición - usa caché (más rápido)
const eval2 = await evaluador.evaluarPosición(fen);
console.log(`Segunda evaluación (caché): ${eval2.tiempoEvaluación}ms`);

// Obtener estadísticas del caché
const stats = evaluador.obtenerEstadisticasCache();
console.log(`Caché: ${stats.tamaño}/${stats.limite} (${stats.utilizacion.toFixed(1)}%)`);

// Limpiar caché (útil entre análisis de partidas)
evaluador.limpiarCache();
```

## Estrategia LRU (Least Recently Used)

El caché implementa una estrategia LRU para gestionar el espacio limitado:

1. **Almacenamiento**: Nuevas entradas se agregan al final (más recientes)
2. **Acceso**: Acceder a una entrada la mueve al final (actualiza recencia)
3. **Evicción**: Cuando el caché está lleno, elimina la primera entrada (más antigua)

### Ejemplo de LRU

```typescript
const cache = new CacheEvaluaciones(3); // Límite de 3

cache.almacenar('pos1', eval1); // [pos1]
cache.almacenar('pos2', eval2); // [pos1, pos2]
cache.almacenar('pos3', eval3); // [pos1, pos2, pos3] - lleno

// Acceder a pos1 lo mueve al final
cache.obtener('pos1');          // [pos2, pos3, pos1]

// Agregar pos4 elimina pos2 (el más antiguo)
cache.almacenar('pos4', eval4); // [pos3, pos1, pos4]

console.log(cache.contiene('pos2')); // false - eliminado
```

## API

### Constructor

```typescript
constructor(limiteMaximo: number = 1000)
```

Crea un nuevo caché con el límite especificado.

- `limiteMaximo`: Número máximo de posiciones a cachear (por defecto: 1000)
- Lanza error si `limiteMaximo < 1`

### obtener(fen: string): Evaluación | undefined

Obtiene una evaluación del caché. Actualiza el orden LRU.

- Retorna la evaluación si existe, `undefined` si no

### almacenar(fen: string, evaluacion: Evaluación): void

Almacena una evaluación en el caché.

- Si la clave ya existe, actualiza su valor y orden LRU
- Si el caché está lleno, elimina la entrada más antigua

### limpiar(): void

Elimina todas las entradas del caché.

### obtenerTamaño(): number

Retorna el número de evaluaciones almacenadas.

### contiene(fen: string): boolean

Verifica si una posición está en el caché (sin actualizar LRU).

### obtenerEstadisticas(): { tamaño: number; limite: number; utilizacion: number }

Retorna estadísticas de uso del caché:

- `tamaño`: Número de entradas actuales
- `limite`: Capacidad máxima
- `utilizacion`: Porcentaje de uso (0-100)

## Rendimiento

### Complejidad

- `obtener()`: O(1) amortizado
- `almacenar()`: O(1) amortizado
- `contiene()`: O(1)
- `limpiar()`: O(n)

### Ahorro de Tiempo

Suponiendo una evaluación de Stockfish de ~1.5 segundos a profundidad 15:

- **Partida de 40 jugadas (80 posiciones)**: Si 20% son repetidas → ahorro de ~24 segundos
- **5 partidas similares**: Apertura común (10 jugadas) → ahorro de ~75 segundos
- **Navegación en UI**: Revisitar posiciones → acceso instantáneo

### Memoria

Cada `Evaluación` ocupa aproximadamente:
- FEN: ~90 bytes
- Datos numéricos: ~50 bytes
- Strings de jugadas: ~20 bytes
- **Total**: ~160 bytes por entrada

**Uso de memoria estimado**:
- 1000 posiciones: ~160 KB
- 5000 posiciones: ~800 KB
- 10000 posiciones: ~1.6 MB

## Casos de Uso

### 1. Análisis de partida individual

```typescript
// El caché reutiliza automáticamente evaluaciones durante el análisis
const fens = extraerFENsDePartida(pgn);
const evaluaciones = await evaluador.evaluarSecuencia(fens);

// Las transposiciones se benefician del caché
```

### 2. Análisis de múltiples partidas

```typescript
// Mantener el caché entre partidas para reutilizar aperturas comunes
for (const partida of partidas) {
  const resultado = await analizarPartida(partida, evaluador);
  // El caché acumula posiciones comunes
}

// Limpiar al finalizar
evaluador.limpiarCache();
```

### 3. Navegación interactiva

```typescript
// La UI puede navegar adelante/atrás sin re-evaluar
await evaluador.evaluarPosición(fenJugada10); // Evalúa con Stockfish
// ... usuario navega a jugada 5 ...
await evaluador.evaluarPosición(fenJugada5);  // Evalúa con Stockfish
// ... usuario vuelve a jugada 10 ...
await evaluador.evaluarPosición(fenJugada10); // Usa caché (instantáneo)
```

## Consideraciones

### ¿Cuándo limpiar el caché?

- **Entre sesiones de análisis diferentes**: Si el usuario analiza varias partidas independientes
- **Cuando cambia la profundidad de análisis**: Las evaluaciones con diferente profundidad pueden variar
- **Para liberar memoria**: Si la aplicación necesita recursos

### ¿Cuándo NO usar caché?

El caché está diseñado para posiciones idénticas. **NO** cachea basándose en similitud posicional, por lo que:

- Posiciones con diferente turno se tratan como distintas (correcto)
- Cambios en derechos de enroque se tratan como distintas (correcto)
- Diferente contador de medio-movimientos se tratan como distintas (correcto)

Esto es el comportamiento esperado ya que incluso pequeñas diferencias en FEN pueden afectar la evaluación.

## Feature

**Feature**: lichess-game-analysis  
**Valida**: Requisito 4.6 (optimización de rendimiento)

## Tests

Los tests completos están en `CacheEvaluaciones.test.ts`:

- Tests unitarios de todas las operaciones
- Validación de estrategia LRU
- Tests de casos límite
- Tests de rendimiento con 1000+ posiciones
- Tests de integración con `EvaluadorJugadas`

```bash
npm test -- --run src/services/cache/CacheEvaluaciones.test.ts
```

## Ejemplos

Ver `CacheEvaluaciones.example.ts` para ejemplos detallados de:

1. Uso básico del caché
2. Optimización con posiciones repetidas
3. Estrategia LRU en acción
4. Gestión del caché en análisis de partidas
5. Integración con EvaluadorJugadas
