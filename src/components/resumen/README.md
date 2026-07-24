# ResumenAnálisis Component

Componente para mostrar las estadísticas finales del análisis de partida de ajedrez.

## Características

- ✅ Estadísticas completas (jugadas analizadas, errores encontrados, pérdida promedio)
- 📊 Distribución visual de errores por color (blancas vs negras)
- 🏆 Clasificación de rendimiento con insignia (excelente, sólido, aceptable, mejorable)
- 🎉 Mensaje especial para partidas sin errores
- 🔍 Navegación rápida a jugada con mayor pérdida
- 📱 Diseño totalmente responsivo
- ♿ Accesibilidad completa (ARIA labels, navegación por teclado)

## Uso

```tsx
import { ResumenAnálisis } from './components/resumen';

function MiComponente() {
  const [resultado, setResultado] = useState<ResultadoAnálisis | null>(null);

  return (
    <ResumenAnálisis
      resultado={resultado!}
      onNavigarAJugada={(num) => console.log(`Navegando a jugada ${num}`)}
      onVerDetalles={() => console.log('Ver detalles')}
    />
  );
}
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `resultado` | `ResultadoAnálisis` | Sí | Resultado completo del análisis |
| `onNavigarAJugada` | `(numeroJugada: number) => void` | No | Callback para navegar a jugada específica |
| `onVerDetalles` | `() => void` | No | Callback para ver análisis detallado |

## Clasificación de Rendimiento

El componente clasifica automáticamente el rendimiento según la pérdida promedio de centipawns:

- **Excelente** (🏆): < 10 cp promedio
- **Sólido** (⭐): 10-20 cp promedio
- **Aceptable** (👍): 20-40 cp promedio
- **Mejorable** (📚): ≥ 40 cp promedio

## Caso Sin Errores

Cuando el análisis no detecta errores significativos (pérdida < 100 cp), el componente muestra:

- Mensaje de felicitación
- Pérdida promedio destacada
- Insignia "Rendimiento Sólido" si pérdida < 20 cp
- NO muestra distribución de errores ni sección de mayor pérdida

## Visualización de Distribución

La distribución de errores se muestra mediante:

- Barras de progreso proporcionales
- Porcentajes calculados automáticamente
- Colores diferenciados (blanco vs negro)
- Contadores absolutos

## Tests

El componente incluye 20+ tests comprehensivos que validan:

- Renderizado correcto de todas las estadísticas
- Mensaje de felicitación para partidas sin errores
- Clasificación correcta de rendimiento
- Distribución de errores
- Navegación a jugada con mayor pérdida
- Callbacks funcionando correctamente
- Responsive design

```bash
npm run test -- ResumenAnálisis.test.tsx
```

## Validaciones

Este componente valida los siguientes requisitos del spec:

- **9.4**: Mostrar estadísticas finales del análisis
- **12.1**: Mensaje para partidas sin errores detectados
- **12.2**: Pérdida promedio y distribución de errores
- **12.3**: Insignia de rendimiento sólido
- **12.4**: Navegación jugada por jugada incluso sin errores

## Personalización

Para personalizar estilos, modifica `ResumenAnálisis.css`:

```css
/* Cambiar color de insignia "Excelente" */
.resumen-insignia[data-rendimiento='excelente'] {
  background-color: #ffd700; /* Oro */
}

/* Personalizar tamaño de fuente del título */
.resumen-titulo {
  font-size: 2rem;
}
```

## Accesibilidad

- Todos los botones tienen `aria-label` descriptivos
- Las barras de progreso usan `role="progressbar"`
- Los colores tienen suficiente contraste (WCAG AA)
- Navegación por teclado totalmente funcional
- Responsive desde 320px de ancho

## Dependencias

- React 19.2.7+
- TypeScript 6.0.2+
- Estilos CSS personalizados (sin librerías externas)

## Autor

Implementado como parte del proyecto **Ajedrez Trainer** - Feature: lichess-game-analysis
