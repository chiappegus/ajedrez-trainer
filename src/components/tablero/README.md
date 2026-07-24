# Componentes de Visualización de Tableros

Esta carpeta contiene los componentes React para visualizar tableros de ajedrez con estilo Lichess, incluyendo highlights de casillas, navegación jugada por jugada, y layout dual para mostrar errores y alternativas.

## Componentes

### VisualizadorTablero

Componente principal para renderizar un tablero de ajedrez individual con todas las características de visualización.

**Características:**
- ✅ Colores exactos de Lichess (#f0d9b5 para casillas claras, #b58863 para casillas oscuras)
- ✅ Highlights de casillas según contexto (rojo para errores, verde para mejores jugadas, amarillo para último movimiento)
- ✅ Navegación jugada por jugada con controles (Anterior/Siguiente/Inicio/Final)
- ✅ Tamaño adaptativo responsivo (móvil 90%, tablet max 500px, desktop max 600px)
- ✅ Animaciones suaves (300ms)
- ✅ Coordenadas siempre visibles
- ✅ Piezas no arrastrables (solo visualización)
- ✅ Muestra evaluación de la posición en centipawns o mate

**Props principales:**
```typescript
interface VisualizadorTableroProps {
  posiciónFEN: string;              // Posición del tablero en notación FEN
  orientación?: 'white' | 'black';  // Orientación del tablero
  movimientoResaltado?: Movimiento; // Movimiento a resaltar
  tipoResaltado?: TipoResaltado;    // Tipo de highlight (error, mejorJugada, últimoMovimiento)
  numeroJugada?: number;            // Número de jugada actual
  totalJugadas?: number;            // Total de jugadas disponibles
  onCambiarPosición?: (n: number) => void; // Callback de navegación
  título?: string;                  // Título del tablero
  evaluación?: number;              // Evaluación en centipawns
  modo?: 'partida' | 'explicación'; // Modo de visualización
}
```

**Ejemplo de uso:**
```tsx
<VisualizadorTablero
  posiciónFEN="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
  título="Partida Real - Jugada 1"
  numeroJugada={0}
  totalJugadas={40}
  evaluación={50}
  onCambiarPosición={(n) => console.log('Ir a jugada', n)}
  movimientoResaltado={{ desde: 'e2', hacia: 'e4' }}
  tipoResaltado="error"
/>
```

### ContenedorTablerosDuales

Componente para mostrar dos tableros lado a lado (o apilados en móvil): el tablero de la partida real con errores resaltados y el tablero de la mejor alternativa.

**Características:**
- ✅ Layout responsivo (vertical en móvil <768px, horizontal en desktop >=768px)
- ✅ Sincronización automática de navegación entre ambos tableros
- ✅ Highlights diferenciados (rojo para errores en partida, verde para mejor jugada en alternativa)
- ✅ Segundo tablero oculto cuando no hay error seleccionado
- ✅ Placeholder informativo cuando no hay error
- ✅ Muestra evaluaciones de ambas posiciones

**Props principales:**
```typescript
interface ContenedorTablerosDualesProps {
  posiciónPartidaFEN: string;          // FEN del tablero de partida (después del error)
  posiciónAlternativaFEN?: string;     // FEN del tablero de alternativa (antes del error)
  movimientoError?: Movimiento;        // Movimiento que causó el error
  mejorJugada?: Movimiento;            // Mejor jugada alternativa
  orientación?: 'white' | 'black';     // Orientación de ambos tableros
  numeroJugada?: number;               // Número de jugada actual
  totalJugadas?: number;               // Total de jugadas
  evaluaciónDespués?: number;          // Evaluación después del error
  evaluaciónAntes?: number;            // Evaluación antes del error
  onCambiarPosición?: (n: number) => void;
  hayErrorSeleccionado?: boolean;      // Si mostrar segundo tablero
}
```

**Ejemplo de uso:**
```tsx
<ContenedorTablerosDuales
  posiciónPartidaFEN="rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 5 3"
  posiciónAlternativaFEN="rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 3"
  movimientoError={{ desde: 'f1', hacia: 'c4' }}
  mejorJugada={{ desde: 'd2', hacia: 'd3' }}
  evaluaciónDespués={-120}
  evaluaciónAntes={25}
  numeroJugada={2}
  totalJugadas={40}
  onCambiarPosición={(n) => console.log('Navegar a', n)}
  hayErrorSeleccionado={true}
/>
```

## Tipos

### Movimiento
```typescript
interface Movimiento {
  desde: string; // Casilla origen (ej: 'e2')
  hacia: string; // Casilla destino (ej: 'e4')
}
```

### TipoResaltado
```typescript
type TipoResaltado = 'error' | 'mejorJugada' | 'últimoMovimiento';
```

## Estilo Visual

Los componentes siguen estrictamente las especificaciones del documento `.kiro/steering/estilo-visual-tablero.md`:

- **Colores de casillas:**
  - Claras: `#f0d9b5` (beige claro)
  - Oscuras: `#b58863` (marrón)

- **Highlights:**
  - Error: `rgba(255, 0, 0, 0.4)` (rojo semi-transparente)
  - Mejor jugada: `rgba(0, 255, 0, 0.4)` (verde semi-transparente)
  - Último movimiento: `rgba(255, 255, 0, 0.3)` (amarillo semi-transparente)

- **Animaciones:**
  - Movimiento de piezas: 300ms
  - Transiciones suaves en botones y highlights

- **Responsive:**
  - Móvil (<640px): 90% del ancho de ventana
  - Tablet (640-1024px): máximo 500px
  - Desktop (>1024px): máximo 600px

## Tests

Cada componente tiene su suite completa de tests:

- `VisualizadorTablero.test.tsx`: Tests unitarios del tablero individual
- `ContenedorTablerosDuales.test.tsx`: Tests unitarios del layout dual

**Ejecutar tests:**
```bash
npm test tablero
```

**Cobertura de tests:**
- ✅ Renderizado básico
- ✅ Navegación y controles
- ✅ Highlights y movimientos
- ✅ Evaluaciones (centipawns y mate)
- ✅ Orientación del tablero
- ✅ Layout responsivo
- ✅ Accesibilidad (ARIA labels)
- ✅ Casos edge y valores undefined

## Ejemplos

Los archivos `*.example.tsx` contienen ejemplos completos de uso:

- `VisualizadorTablero.example.tsx`: 7 ejemplos del tablero individual
- `ContenedorTablerosDuales.example.tsx`: 6 ejemplos del layout dual

**Para ver los ejemplos:**
```tsx
import { TodosLosEjemplos } from './components/tablero/VisualizadorTablero.example';
import { TodosLosEjemplosDuales } from './components/tablero/ContenedorTablerosDuales.example';
```

## Requisitos Validados

Estos componentes validan los siguientes requisitos del documento de requisitos:

- **Requisito 6.1:** Mostrar tablero con posición actual
- **Requisito 6.2:** Resaltar casillas de error con marcador rojo
- **Requisito 6.3:** Resaltar casillas hacia donde se movió con marcador rojo
- **Requisito 6.4:** Navegación jugada por jugada con controles
- **Requisito 6.5:** Saltar a posición al hacer clic
- **Requisito 6.6:** Mostrar números de jugada
- **Requisito 7.1:** Mostrar segundo tablero con posición antes del error
- **Requisito 7.2:** Resaltar mejor jugada con marcador verde
- **Requisito 7.3:** Mostrar casillas de origen y destino de mejor jugada
- **Requisito 7.4:** Sincronizar con posición de error del primer tablero
- **Requisito 7.5:** Ocultar segundo tablero cuando no hay error seleccionado
- **Requisito 11.1:** Renderizar tableros adaptativos (320px - 1920px)
- **Requisito 11.2:** Apilar tableros verticalmente en móvil (<768px)
- **Requisito 11.3:** Mostrar tableros lado a lado en desktop (>=768px)
- **Requisito 11.5:** Renderizar legiblemente en pantallas de alto DPI
- **Requisito 13.1:** Seguir especificaciones de estilo visual Lichess
- **Requisito 13.2:** Usar react-chessboard según guías de steering
- **Requisito 13.3:** Renderizar piezas SVG para escalado sin pérdida
- **Requisito 13.4:** Animar movimientos con transiciones suaves
- **Requisito 13.5:** Mostrar highlights según contexto

## Integración con el Sistema

Los componentes de tablero se integran con:

- **AnalizadorPartida:** Recibe posiciones FEN y evaluaciones del analizador
- **DetectorErrores:** Recibe información de errores para resaltar casillas
- **IndicadorProgreso:** Se muestra junto con el análisis en curso
- **PanelExplicaciones:** Se coordina con explicaciones de IA para mostrar tableros contextuales

## Notas de Implementación

1. **react-chessboard:** Configurado con propiedades específicas para Lichess
2. **Debounce en resize:** 200ms para evitar recálculos excesivos del tamaño
3. **Web accessibility:** Botones con `aria-label`, `title`, y estados disabled
4. **CSS Variables:** Usa variables CSS del tema global para colores consistentes
5. **Touch-friendly:** Botones con mínimo 44x44px en móvil

## Mejoras Futuras (Fuera del Alcance Actual)

- Arrastrar piezas para analizar variantes
- Flechas para mostrar líneas tácticas
- Análisis multi-línea (mostrar segundas y terceras mejores jugadas)
- Modo de entrenamiento interactivo
- Exportar posición como imagen
