# Módulo de Análisis de Partidas

Este módulo contiene todas las clases necesarias para analizar partidas de ajedrez desde Lichess, detectar errores significativos, y generar explicaciones educativas con IA.

## Componentes Principales

### AnalizadorPartida (Orquestador Principal)

**Responsabilidad:** Coordina todo el flujo de análisis de partidas de Lichess.

**Flujo completo:**
1. Obtiene el PGN desde Lichess API
2. Parsea el PGN a objeto estructurado
3. Analiza jugada por jugada usando Stockfish (desde jugada 4)
4. Detecta errores significativos (pérdida >= 100 centipawns)
5. Genera explicaciones con IA para cada error
6. Calcula estadísticas finales y clasifica rendimiento

**Características:**
- Gestión de estado (inactivo, analizando, pausado, completado, error)
- Pausa y reanudación de análisis en curso
- Progreso en tiempo real con estimación de tiempo restante
- Yields cada 2s para mantener UI responsiva

**Uso:**
```typescript
import { AnalizadorPartida } from './analisis/AnalizadorPartida';

// Configurar dependencias
const analizador = new AnalizadorPartida(
  clienteLichess,
  parser,
  evaluador,
  detector,
  generador
);

// Iniciar análisis
const resultado = await analizador.iniciarAnálisis('nombreUsuario');

// Monitorear progreso
const progreso = analizador.obtenerProgreso();
console.log(`Progreso: ${progreso.jugadaActual}/${progreso.totalJugadas}`);

// Pausar/reanudar
analizador.pausarAnálisis();
analizador.reanudarAnálisis();
```

**Validación de Requisitos:**
- ✅ 9.1: Mostrar progreso del análisis
- ✅ 9.2: Mostrar número de jugada actual
- ✅ 9.3: Estimar tiempo restante
- ✅ 9.5: Permitir reanudar análisis interrumpido
- ✅ 5.5: Ignorar primeras 3 jugadas (teoría de apertura)
- ✅ 8.1: Generar explicaciones con Groq API
- ✅ 8.9: Fallback a explicación básica si Groq falla
- ✅ 10.3: Pausar análisis de larga duración
- ✅ 10.4: Reanudar análisis pausado
- ✅ 12.1: Mostrar pérdida promedio de centipawns
- ✅ 12.2: Clasificar rendimiento general

### EvaluadorJugadas

**Responsabilidad:** Evaluar posiciones de ajedrez usando Stockfish.

**Características:**
- Profundidad configurable (por defecto: 15 plies)
- Cache de evaluaciones para evitar re-análisis
- Evaluación secuencial con yields para responsividad
- Timeout de 2 segundos por posición

**Uso:**
```typescript
const evaluador = new EvaluadorJugadas(motorStockfish);

// Evaluar una posición
const evaluación = await evaluador.evaluarPosición(fen);
console.log(`Evaluación: ${evaluación.centipawns}cp`);
console.log(`Mejor jugada: ${evaluación.mejorJugadaSAN}`);

// Evaluar secuencia completa
const evaluaciones = await evaluador.evaluarSecuencia([fen1, fen2, fen3]);
```

### DetectorErrores

**Responsabilidad:** Identificar jugadas con pérdida significativa de evaluación.

**Criterios:**
- Pérdida >= 100 centipawns = error significativo
- Ignora primeras 3 jugadas (teoría de apertura)
- Considera perspectiva del jugador (blancas/negras)

**Uso:**
```typescript
const detector = new DetectorErrores();

const error = detector.detectarError(
  evaluaciónAnterior,
  evaluaciónActual,
  jugada,
  numeroJugada
);

if (error) {
  console.log(`Error detectado: -${error.pérdidaCentipawns}cp`);
}
```

### GeneradorExplicaciones

**Responsabilidad:** Generar explicaciones educativas usando Groq API.

**Características:**
- Explicaciones concisas (máx 150 palabras)
- Explicaciones extendidas (máx 300 palabras)
- Fallback a explicación básica si Groq falla
- Prompt optimizado para entrenador de ajedrez

**Uso:**
```typescript
const generador = new GeneradorExplicaciones(clienteGroq);

// Explicación concisa
const explicación = await generador.generarExplicaciónConcisa(error);

// Explicación extendida
const explicaciónDetallada = await generador.generarExplicaciónExtendida(error);

// Fallback sin IA
const explicaciónBásica = generador.generarExplicaciónBásica(error);
```

## Clasificación de Rendimiento

El sistema clasifica el rendimiento general del jugador según la pérdida promedio de centipawns:

- **Excelente** (< 20 cp): Juego casi perfecto
- **Sólido** (20-50 cp): Buen nivel de juego
- **Aceptable** (50-100 cp): Nivel intermedio con margen de mejora
- **Mejorable** (>= 100 cp): Necesita trabajo en fundamentos

## Estadísticas Calculadas

El análisis proporciona las siguientes estadísticas:

```typescript
interface EstadísticasAnálisis {
  totalJugadas: number;
  erroresBlancas: number;
  erroresNegras: number;
  mayorPérdida: number;
  jugadaMayorPérdida: number;
  rendimientoGeneral: 'excelente' | 'sólido' | 'aceptable' | 'mejorable';
}
```

## Información de Progreso

Durante el análisis, se puede consultar el progreso en tiempo real:

```typescript
interface ProgresoAnálisis {
  estado: 'inactivo' | 'analizando' | 'pausado' | 'completado' | 'error';
  jugadaActual: number;
  totalJugadas: number;
  erroresEncontrados: number;
  tiempoPromedioPorJugada: number;
  tiempoRestanteEstimado: number;
}
```

## Tests

Todos los componentes tienen cobertura de tests completa:

- `EvaluadorJugadas.test.ts`: Tests unitarios del evaluador
- `DetectorErrores.test.ts`: Tests unitarios del detector
- `GeneradorExplicaciones.test.ts`: Tests unitarios del generador
- `AnalizadorPartida.test.ts`: Tests de integración del orquestador

**Ejecutar tests:**
```bash
npm test -- AnalizadorPartida.test.ts --run
```

## Ejemplos

Ver `AnalizadorPartida.example.ts` para ejemplos completos de uso incluyendo:
- Análisis completo de una partida
- Monitoreo de progreso en tiempo real
- Pausa y reanudación de análisis
- Manejo de errores

## Feature

**Feature:** `lichess-game-analysis`

Implementa la funcionalidad completa de análisis automático de partidas de Lichess con detección de errores y explicaciones educativas generadas por IA.
