# Componentes de Explicaciones

Componentes React para mostrar explicaciones educativas de errores de ajedrez generados por IA.

**Feature:** lichess-game-analysis  
**Fase:** 22 - Panel de Explicaciones  
**Valida:** Requisitos 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.10

## Componentes

### PanelExplicaciones

Panel principal que muestra explicaciones educativas de errores detectados en partidas de ajedrez.

**Características:**
- Muestra explicación concisa con loading y animación fade-in
- Botón "Profundizar explicación" para generar explicación extendida (300 palabras)
- Botón "Mostrar en tablero" que abre modal con tablero interactivo
- Navegación entre errores (lista resumen, botones anterior/siguiente)
- Lista completa de errores con navegación rápida
- Estados de carga para llamadas async a Groq API
- Responsive design

**Props:**
```typescript
interface PanelExplicacionesProps {
  error: ErrorDetectado;                              // Error actual
  todosLosErrores: ErrorDetectado[];                  // Lista completa
  índiceActual: number;                               // Índice actual
  onSeleccionarError: (índice: number) => void;       // Navegar a error
  onVolver: () => void;                               // Volver al análisis
  onGenerarExplicaciónExtendida: (error: ErrorDetectado) => Promise<string>;
}
```

**Ejemplo de uso:**
```tsx
import { PanelExplicaciones } from '@/components/explicaciones';

function AnalisisPartida() {
  const [errores, setErrores] = useState<ErrorDetectado[]>([...]);
  const [índiceActual, setÍndiceActual] = useState(0);
  
  return (
    <PanelExplicaciones
      error={errores[índiceActual]}
      todosLosErrores={errores}
      índiceActual={índiceActual}
      onSeleccionarError={(idx) => setÍndiceActual(idx)}
      onVolver={() => router.push('/analisis')}
      onGenerarExplicaciónExtendida={async (error) => {
        const explicación = await generadorExplicaciones.generarExplicaciónExtendida(error);
        return explicación;
      }}
    />
  );
}
```

### ModalVariante

Modal con tablero interactivo para mostrar la variante de la mejor jugada paso a paso.

**Características:**
- Tablero interactivo con navegación paso a paso
- Controles: anterior, siguiente, ir al inicio, ir al final
- Navegación con teclado (flechas ← →, Esc para cerrar)
- Cerrar al hacer clic fuera del modal
- Muestra información del error y número de jugada
- Responsive design

**Props:**
```typescript
interface ModalVarianteProps {
  error: ErrorDetectado;        // Error con variante
  onCerrar: () => void;          // Callback para cerrar
}
```

**Ejemplo de uso:**
```tsx
import { ModalVariante } from '@/components/explicaciones';

function MostrarVariante() {
  const [mostrarModal, setMostrarModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setMostrarModal(true)}>
        Mostrar en tablero
      </button>
      
      {mostrarModal && (
        <ModalVariante
          error={errorActual}
          onCerrar={() => setMostrarModal(false)}
        />
      )}
    </>
  );
}
```

## Estructura de archivos

```
src/components/explicaciones/
├── PanelExplicaciones.tsx       # Componente principal
├── PanelExplicaciones.css       # Estilos del panel
├── PanelExplicaciones.test.tsx  # Tests del panel
├── PanelExplicaciones.example.tsx # Ejemplos de uso
├── ModalVariante.tsx            # Modal de variante
├── ModalVariante.css            # Estilos del modal
├── ModalVariante.test.tsx       # Tests del modal
├── index.ts                     # Exportaciones
└── README.md                    # Este archivo
```

## Estilos

Los componentes utilizan CSS modules con variables CSS para colores:

```css
--color-primario: #4a90e2;       /* Azul principal */
--color-secundario: #50e3c2;     /* Verde secundario */
--color-error: #e74c3c;          /* Rojo para errores */
--color-éxito: #2ecc71;          /* Verde para éxito */
--color-advertencia: #f39c12;    /* Naranja para advertencias */
--color-texto-principal: #2c3e50;
--color-texto-secundario: #7f8c8d;
--color-fondo-tarjeta: #ffffff;
```

### Animaciones

- **fadeIn**: Animación de entrada para explicaciones (400ms)
- **slideIn**: Animación de entrada para modal (300ms)
- **spin**: Spinner de carga (800ms loop)

### Responsive

**Breakpoints:**
- Móvil: < 768px (columna única, botones full-width)
- Tablet: 768px - 1024px (layout adaptativo)
- Escritorio: > 1024px (layout completo)

## Testing

Los componentes tienen cobertura completa de tests:

**PanelExplicaciones.test.tsx:**
- Renderizado básico
- Navegación entre errores
- Lista de errores
- Profundizar explicación
- Modal de variante
- Accesibilidad

**ModalVariante.test.tsx:**
- Renderizado básico
- Navegación de variante
- Navegación con teclado
- Cerrar modal
- Construcción de variante
- Accesibilidad

**Ejecutar tests:**
```bash
npm test explicaciones
npm test -- --watch  # Modo watch
```

## Accesibilidad

Todos los componentes incluyen:
- Labels ARIA en botones interactivos
- Navegación con teclado
- Focus visible en elementos interactivos
- Roles semánticos apropiados
- Soporte para `prefers-reduced-motion`

## Integración con GeneradorExplicaciones

El componente `PanelExplicaciones` se integra con `GeneradorExplicaciones` para obtener explicaciones IA:

```typescript
import { GeneradorExplicaciones } from '@/services/analisis';
import { ClienteGroq } from '@/services/groq';

const clienteGroq = new ClienteGroq(apiKey);
const generador = new GeneradorExplicaciones(clienteGroq);

// En el componente:
<PanelExplicaciones
  onGenerarExplicaciónExtendida={async (error) => {
    try {
      return await generador.generarExplicaciónExtendida(error);
    } catch (err) {
      // Fallback a explicación básica
      return generador.generarExplicaciónBásica(error);
    }
  }}
/>
```

## Estados de carga

El componente maneja tres estados de carga:

1. **Sin explicación**: Muestra mensaje "No hay explicación disponible"
2. **Cargando explicación extendida**: Muestra spinner y deshabilita botón
3. **Error de generación**: Muestra mensaje de error con opción de reintentar

## Dependencias

- `react` ^19.2.7
- `react-chessboard` ^5.10.0 (para tablero en modal)
- `chess.js` ^1.4.0 (para lógica de ajedrez)
- `@testing-library/react` ^16.3.2 (para tests)
- `@testing-library/user-event` ^14.6.1 (para tests)

## Próximas mejoras

- [ ] Compartir explicaciones en redes sociales
- [ ] Exportar explicaciones a PDF
- [ ] Agregar audio text-to-speech para explicaciones
- [ ] Modo de comparación de múltiples errores
- [ ] Historial de explicaciones generadas
