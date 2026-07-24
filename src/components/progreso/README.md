# IndicadorProgreso

Componente React para mostrar el progreso en tiempo real del análisis de partidas de ajedrez.

## Características

- **Barra de progreso visual** con porcentaje de completitud
- **Información en tiempo real**: jugada actual/total, errores encontrados, tiempo restante
- **Polling automático** cada 500ms (configurable)
- **Botones Pausar/Reanudar** para control del análisis
- **Diseño responsive** (320px - 1920px)
- **Accesibilidad completa** con atributos ARIA

## Uso Básico

```tsx
import { IndicadorProgreso } from './components/progreso';
import { useAnalisis } from './hooks/useAnalisis';

function MiComponente({ analizador }) {
  const { obtenerProgreso, pausarAnalisis, reanudarAnalisis } = useAnalisis(analizador);

  return (
    <IndicadorProgreso
      obtenerProgreso={obtenerProgreso}
      onPausar={pausarAnalisis}
      onReanudar={reanudarAnalisis}
    />
  );
}
```

## Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `obtenerProgreso` | `() => ProgresoAnálisis` | Sí | - | Función que retorna el progreso actual |
| `onPausar` | `() => void` | No | - | Callback para pausar el análisis |
| `onReanudar` | `() => void` | No | - | Callback para reanudar el análisis |
| `intervaloActualizacion` | `number` | No | `500` | Intervalo de polling en milisegundos |

## Hook useAnalisis

El hook `useAnalisis` facilita la integración con `AnalizadorPartida`:

```tsx
import { useAnalisis } from './hooks/useAnalisis';

const {
  iniciarAnalisis,
  pausarAnalisis,
  reanudarAnalisis,
  obtenerProgreso,
  resultado,
  estado,
  error,
  analizando
} = useAnalisis(analizador);
```

## Estados del Análisis

El componente muestra diferentes títulos según el estado:

- `inactivo`: ⏳ Esperando...
- `analizando`: ⚙️ Analizando partida...
- `pausado`: ⏸️ Análisis pausado
- `completado`: ✅ Análisis completado
- `error`: ❌ Error en análisis

## Información Mostrada

### Siempre visible:
- Porcentaje de progreso (0-100%)
- Jugada actual / Total de jugadas
- Errores encontrados hasta el momento

### Condicional (solo cuando está analizando):
- Tiempo restante estimado (formato: "Xm Ys")

## Botones de Control

- **Pausar**: Visible cuando `estado === 'analizando'` y `onPausar` está definido
- **Reanudar**: Visible cuando `estado === 'pausado'` y `onReanudar` está definido

## Responsividad

### Desktop (>768px):
- Layout horizontal
- Botones lado a lado

### Mobile (≤768px):
- Layout vertical
- Botones apilados
- Texto adaptado

## Formato de Tiempo

El componente formatea automáticamente el tiempo restante:

- Menos de 1 minuto: "Xs" (ej: "45s")
- 1 minuto o más: "Xm Ys" (ej: "2m 30s")

## Accesibilidad

- Barra de progreso con `role="progressbar"` y atributos ARIA
- Botones con `aria-label` descriptivos
- Tamaño mínimo de objetivo táctil: 44x44px
- Contraste de colores según WCAG 2.1

## Validación de Requisitos

Este componente valida los siguientes requisitos de la especificación:

- **Requisito 9.1**: Mostrar indicador de progreso con porcentaje
- **Requisito 9.2**: Mostrar número de jugada actual
- **Requisito 9.3**: Estimar tiempo restante
- **Requisito 9.4**: Mostrar resumen al completar (delegado a componente padre)
- **Requisito 10.3**: Botón de pausa
- **Requisito 10.4**: Botón de reanudar
- **Requisito 11.1-11.5**: Interfaz responsiva

## Testing

Ejecutar tests:

```bash
npm run test -- IndicadorProgreso.test.tsx
```

Los tests cubren:
- Visualización de progreso
- Cálculo de porcentajes
- Estados del análisis
- Formato de tiempo
- Botones Pausar/Reanudar
- Polling automático
- Accesibilidad

## Estilos

Los estilos se encuentran en `IndicadorProgreso.css` y siguen las variables CSS globales:

- `--bg`: Color de fondo
- `--border`: Color de bordes
- `--text-h`: Color de texto principal
- `--text`: Color de texto secundario
- `--accent`: Color de acento (barra de progreso)
- `--code-bg`: Color de fondo alternativo

## Ejemplo Completo

Ver `IndicadorProgreso.example.tsx` para un ejemplo completo de integración.
