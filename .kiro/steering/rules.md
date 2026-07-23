# Reglas y Normas del Proyecto Ajedrez Trainer

## 1. Reglas de Código para TypeScript/React

### 1.1 Configuración de TypeScript
- Usar TypeScript estricto (`strict: true` en tsconfig.json)
- Tipar explícitamente props, estados y funciones
- Evitar el uso de `any` - usar tipos específicos o `unknown` cuando sea necesario
- Usar interfaces para props de componentes y tipos para estados complejos

### 1.2 Manejo de Props
```typescript
// Correcto
interface ChessBoardProps {
  fen: string;
  onMove?: (move: string) => void;
  orientation?: 'white' | 'black';
}

// Incorrecto
type ChessBoardProps = any;
```

### 1.3 Hooks de React
- Usar `useState` para estado local simple
- Usar `useReducer` para lógica de estado compleja (juegos de ajedrez)
- Usar `useMemo` y `useCallback` para optimizar rendimiento con dependencias claras
- Evitar efectos secundarios innecesarios en `useEffect`

## 2. Estructura de Componentes

### 2.1 Organización de Archivos
```
src/
├── components/
│   ├── chess/
│   │   ├── ChessBoard.tsx
│   │   ├── ChessBoard.css
│   │   └── ChessBoard.test.tsx
│   ├── training/
│   │   ├── TrainingSession.tsx
│   │   └── TrainingExercise.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Modal.tsx
├── hooks/
│   ├── useChessGame.ts
│   └── useTrainingSession.ts
├── utils/
│   ├── chessUtils.ts
│   └── trainingUtils.ts
└── types/
    └── chessTypes.ts
```

### 2.2 Convenciones de Nomenclatura
- **Componentes**: PascalCase (ej: `ChessBoard`, `TrainingSession`)
- **Hooks personalizados**: prefijo `use` + camelCase (ej: `useChessGame`)
- **Utilidades**: camelCase (ej: `calculateBestMove`, `validateFEN`)
- **Tipos/Interfaces**: PascalCase (ej: `ChessMove`, `TrainingExercise`)

### 2.3 Patrones de Componentes
- Componentes pequeños y enfocados en una responsabilidad
- Separar componentes de presentación de componentes con lógica
- Usar componentes compuestos para funcionalidades complejas
- Prop drilling máximo de 3 niveles, usar Context si es necesario

## 3. Guías de Estilo y Convenciones

### 3.1 Estilo de Código
- Usar punto y coma al final de cada declaración
- Comillas simples para strings (`'texto'`)
- 2 espacios para indentación (no tabs)
- Línea máxima de 100 caracteres
- Espacios alrededor de operadores y después de comas

### 3.2 CSS/Estilos
- Usar CSS Modules o styled-components
- Nombrar clases con convención BEM para componentes específicos
- Variables CSS para colores, espaciado y tipografía
- Estilos responsivos con mobile-first

### 3.3 Nomenclatura de Clases CSS
```css
/* BEM para componentes de ajedrez */
.chess-board {}
.chess-board__square {}
.chess-board__square--highlighted {}
.chess-board__piece--white {}
```

## 4. Prácticas Específicas para Ajedrez

### 4.1 Manejo del Estado del Juego
- Usar `chess.js` como motor de ajedrez principal
- Mantener el FEN (Forsyth-Edwards Notation) como fuente de verdad
- Separar lógica de negocio de la interfaz de usuario
- Validar movimientos con `chess.js` antes de aplicarlos

### 4.2 Estructura de Datos
```typescript
interface ChessGameState {
  fen: string;
  history: ChessMove[];
  status: 'playing' | 'checkmate' | 'stalemate' | 'draw';
  currentPlayer: 'white' | 'black';
}

interface ChessMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san: string;
}
```

### 4.3 Manejo de Movimientos
- Validar movimientos legales antes de procesarlos
- Mantener historial completo de la partida
- Soporte para deshacer/rehacer movimientos
- Manejo de promociones de peón

## 5. Prácticas Recomendadas

### 5.1 Testing
- Tests unitarios para utilidades de ajedrez
- Tests de integración para flujos de entrenamiento
- Mockear `chess.js` cuando sea necesario
- Cubrir casos de borde: jaque, jaque mate, tablas

### 5.2 Rendimiento
- Memoizar cálculos costosos de ajedrez
- Virtualizar listas largas de ejercicios
- Lazy loading de componentes pesados
- Optimizar re-renders con React.memo

### 5.3 Accesibilidad
- Soporte completo de teclado para el tablero
- ARIA labels para piezas y casillas
- Contraste adecuado para daltonismo
- Soporte para lectores de pantalla

### 5.4 Internacionalización
- Preparar código para futura traducción
- Usar formato estándar para notación de ajedrez
- Separar textos de la lógica del componente

## 6. Convenciones de Commits

- Usar Conventional Commits en español
- Prefijos: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Mensajes descriptivos en tiempo presente
- Referenciar issues cuando corresponda

## 7. Flujo de Trabajo

1. **Desarrollo**: Crear rama feature/ desde main
2. **Testing**: Ejecutar tests y linting antes de commit
3. **Revisión**: Code review para cambios significativos
4. **Merge**: Squash merge a main con mensaje descriptivo

---

*Última actualización: [Fecha]*
*Este documento debe ser actualizado conforme el proyecto evolucione.*