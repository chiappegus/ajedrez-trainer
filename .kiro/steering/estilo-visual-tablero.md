---
inclusion: always
---

# Regla de Estilo Visual: Tablero de Ajedrez Estilo Lichess

## Regla Principal

**TODOS los tableros de ajedrez en este proyecto DEBEN seguir el estilo visual de Lichess.org para proporcionar una experiencia consistente y reconocible.**

## Especificaciones de Estilo

### Colores del Tablero
- **Casillas claras**: `#f0d9b5` (beige claro)
- **Casillas oscuras**: `#b58863` (marrón)
- **Tema por defecto**: Brown theme de Lichess

### Piezas
- **Conjunto de piezas**: "cburnett" o "merida" (estilos oficiales de Lichess)
- **Formato**: SVG para escalado sin pérdida de calidad
- **Tamaño**: Adaptable al tamaño del tablero (responsive)

### Coordenadas
- **Mostrar**: Siempre visibles en los bordes del tablero
- **Formato**: Letras a-h (horizontal), Números 1-8 (vertical)
- **Posición**: Letras abajo, números a la derecha (para blancas abajo)

### Animaciones y Transiciones
- **Movimiento de piezas**: Transición suave de 300ms
- **Última jugada**: Highlight o flecha temporal mostrando origen y destino
- **Casillas seleccionables**: Overlay semi-transparente cuando aplique
- **Highlights de error**: Marcador rojo para errores
- **Highlights de mejor jugada**: Marcador verde para alternativas

### Interactividad
- **Drag and drop**: Suave y responsivo
- **Click to move**: Soportado como alternativa
- **Touch friendly**: Objetivos táctiles de mínimo 44x44px en móvil

## Implementación Técnica

### Librería Recomendada
- **react-chessboard** (v5.10.0 o superior)
- Props personalizables: `customBoardStyle`, `customDarkSquareStyle`, `customLightSquareStyle`

### Ejemplo de Configuración
```typescript
<Chessboard
  boardWidth={400}
  customBoardStyle={{
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
  }}
  customDarkSquareStyle={{ backgroundColor: '#b58863' }}
  customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
  position={fenPosition}
  // Configuración de piezas estilo Lichess
/>
```

## Excepciones

- Tableros en documentación o diagramas estáticos pueden usar representaciones simplificadas
- Miniaturas de tableros (< 200px) pueden omitir coordenadas por legibilidad
