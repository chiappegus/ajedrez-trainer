# Configuración de Kiro para Ajedrez Trainer

Esta configuración referencia las reglas establecidas en `steering/rules.md`.

## Configuración Básica
- **Proyecto**: Ajedrez Trainer
- **Tecnologías**: React, TypeScript, chess.js
- **Herramientas**: Vite, Oxlint, Testing Library

## Reglas Activadas

### 1. Reglas de Código
- ✅ TypeScript estricto habilitado
- ✅ Validación de props tipadas
- ✅ Uso apropiado de hooks de React

### 2. Estructura de Componentes
- ✅ Organización por dominio (chess/, training/, ui/)
- ✅ Convenciones de nomenclatura aplicadas
- ✅ Componentes pequeños y enfocados

### 3. Guías de Estilo
- ✅ Formato de código consistente
- ✅ CSS Modules para estilos
- ✅ Responsive mobile-first

### 4. Prácticas de Ajedrez
- ✅ chess.js como motor principal
- ✅ FEN como fuente de verdad
- ✅ Validación de movimientos

## Comandos Personalizados

```bash
# Desarrollo
npm run dev

# Linting
npm run lint

# Construcción
npm run build

# Preview
npm run preview
```

## Comandos de Kiro Sugeridos

```bash
# Crear nuevo componente de ajedrez
kiro generate chess-component --name ChessBoard

# Crear hook personalizado
kiro generate hook --name useChessGame

# Crear utilidad
kiro generate util --name chessUtils
```

## Plantillas Disponibles

1. **Componente de Ajedrez**: Plantilla base para componentes relacionados con el tablero
2. **Componente de Entrenamiento**: Plantilla para ejercicios y sesiones
3. **Hook de Juego**: Plantilla para manejo de estado del juego
4. **Utilidad de Ajedrez**: Plantilla para funciones auxiliares

## Pruebas Automatizadas

Las siguientes pruebas se ejecutarán automáticamente:
- ✅ Validación de tipos TypeScript
- ✅ Linting con Oxlint
- ✅ Pruebas de componentes (cuando se configuren)

---

*Para personalizar esta configuración, edita el archivo `.kiro/config.json`*
*Referencia completa de reglas en: `steering/rules.md`*