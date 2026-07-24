# ♟️ Ajedrez Trainer

Analizador de partidas de ajedrez que conecta con tu cuenta de Lichess, evalúa tus jugadas con Stockfish WASM y te explica los errores con IA (Groq/LLaMA 70B).

## 🎯 ¿Qué hace?

Ajedrez Trainer descarga tu última partida de Lichess, la analiza jugada por jugada con el motor Stockfish corriendo en tu navegador, detecta tus errores más graves, y te da explicaciones personalizadas con inteligencia artificial — todo desde el front-end, sin backend.

### Funcionalidades principales

- **Análisis con Stockfish WASM** — Motor de ajedrez profesional corriendo directamente en el navegador via Web Workers
- **Conexión con Lichess** — Descarga automática de tu última partida (Bullet, Blitz, Rápida o Clásica)
- **Detección de errores** — Identifica los errores más graves de TUS jugadas (filtra solo tu color)
- **Explicaciones con IA** — LLaMA 3.3 70B (via Groq) te explica cada error en castellano argentino, con notación figurine (♞♝♜♛♚)
- **Tableros duales** — Visualización lado a lado: tu jugada vs la mejor alternativa
- **Selector de análisis** — Elegí tipo de partida, y cuántos errores ver (top 3 o 5)
- **Notación figurine** — Piezas con símbolos Unicode (♞f3, ♝b5) como en Lichess
- **Progreso en tiempo real** — Barra de progreso, tiempo estimado, posibilidad de pausar

## 📸 Capturas

### Pantalla principal
- Muestra tu usuario de Lichess
- Selector de tipo de partida (Bullet ⚡, Blitz 🔥, Rápida ⏱️, Clásica ♟️)
- Selector de cantidad de errores a mostrar (Top 3 / Top 5)

### Análisis en progreso
- Barra de progreso con porcentaje real
- Jugada actual / total
- Errores encontrados en tiempo real
- Tiempo restante estimado
- Botón de pausa

### Resultados
- Resumen con estadísticas: jugadas analizadas, errores detectados, pérdida promedio, tiempo
- Color con el que jugaste (⬜ Blancas / ⬛ Negras)
- Clasificación de rendimiento (Excelente / Sólido / Aceptable / Mejorable)
- Distribución de errores por color
- Mayor pérdida identificada

### Análisis detallado
- Tableros duales: Partida Real vs Mejor Alternativa
- Resaltado de movimientos (rojo = error, verde = mejor jugada)
- Explicación de cada error por IA en castellano
- Navegación entre errores
- Modal interactivo para explorar variantes

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- Cuenta en [Lichess](https://lichess.org) con un token de API
- Cuenta en [Groq](https://console.groq.com) con una API key (gratis)

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/ajedrez-trainer.git
cd ajedrez-trainer

# Instalar dependencias
npm install

# Configurar credenciales (opcional - también se pueden poner desde la web)
cp .env.local.example .env.local
# Editar .env.local con tus datos

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de entorno (`.env.local`)

```env
VITE_LICHESS_USERNAME=tu_usuario_lichess
VITE_LICHESS_API_TOKEN=lip_tu_token_aqui
VITE_GROQ_API_KEY=gsk_tu_key_aqui
```

> **Nota:** Las credenciales también se pueden configurar directamente desde la interfaz web (Configuración). Una vez guardadas ahí, el `.env.local` se ignora.

### Stockfish WASM

El motor Stockfish debe estar en `public/stockfish/`. Los archivos necesarios son:

- `stockfish.wasm.js` — Motor compilado a WebAssembly
- `stockfish.wasm` — Binario WASM

Ver `public/stockfish/INSTALLATION.md` para instrucciones de descarga.

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|-----------|-----|
| **React 18** + TypeScript | Frontend UI |
| **Vite** | Build tool y dev server |
| **Stockfish WASM** | Motor de ajedrez (Web Worker) |
| **chess.js** | Lógica de ajedrez, validación de movimientos |
| **react-chessboard** | Visualización de tableros |
| **Groq API** (LLaMA 3.3 70B) | Explicaciones con IA |
| **Lichess API** | Descarga de partidas |
| **Vitest** | Testing |

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── analisis/        # Selector de opciones de análisis
│   ├── configuracion/   # Formulario de credenciales
│   ├── explicaciones/   # Panel de explicaciones + modal variante
│   ├── progreso/        # Indicador de progreso
│   ├── resumen/         # Resumen de resultados
│   └── tablero/         # Tableros duales
├── hooks/               # Hooks personalizados
│   ├── useAnalisis.ts   # Estado del análisis
│   ├── useCredenciales.ts # Gestión de credenciales
│   └── useStockfish.ts  # Lazy loading de Stockfish
├── services/            # Lógica de negocio
│   ├── analisis/        # AnalizadorPartida, EvaluadorJugadas, DetectorErrores, GeneradorExplicaciones
│   ├── cache/           # Cache de evaluaciones
│   ├── credenciales/    # GestorCredenciales
│   ├── groq/            # Cliente Groq API
│   ├── lichess/         # Cliente Lichess API
│   ├── parseo/          # Parser PGN
│   └── stockfish/       # MotorStockfish (comunicación UCI con WASM worker)
├── types/               # Tipos TypeScript
└── utils/               # Utilidades (logger, errores, notación figurine)
```

## 🎮 Cómo usar

1. **Configurar credenciales** — Al abrir la app por primera vez, ingresá tu usuario de Lichess, token de API, y key de Groq. Se validan ambos tokens en tiempo real.

2. **Seleccionar tipo de partida** — Elegí Bullet, Blitz, Rápida o Clásica.

3. **Elegir cantidad de errores** — Top 3 (más rápido) o Top 5 (más completo).

4. **Analizar** — El motor Stockfish evalúa cada posición a profundidad 15. Se muestra progreso en tiempo real.

5. **Revisar resultados** — Ves un resumen con estadísticas y luego podés navegar error por error con tableros duales y explicaciones de IA.

## 🔧 Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción
npm run preview   # Preview del build
npm run test      # Ejecutar tests
npm run lint      # Lint con ESLint
```

## 📝 Notas técnicas

- **Stockfish corre en el browser** — No hay backend. El motor WASM se ejecuta en un Web Worker para no bloquear la UI.
- **Evaluación normalizada** — Stockfish evalúa desde la perspectiva del lado que mueve. El sistema normaliza a "positivo = ventaja blancas" para todas las comparaciones.
- **Rate limiting de Groq** — El plan gratuito tiene límites. Si ves errores 429, esperá ~1 minuto. Las explicaciones que fallan usan un fallback básico sin IA.
- **Credenciales seguras** — Los tokens se almacenan en localStorage con encoding Base64. No se envían a ningún servidor externo más que Lichess y Groq directamente.

## 📄 Licencia

MIT
