# 🏆 Ajedrez Trainer — Resumen Hackathon Kiro

## Sobre el proyecto

**Ajedrez Trainer** es un analizador de partidas de ajedrez que corre 100% en el navegador. Conecta con tu cuenta de Lichess, evalúa tus jugadas con Stockfish WASM, y te explica los errores con IA (LLaMA 3.3 70B via Groq).

### ¿Qué lo hace especial?

- **Sin backend** — todo corre en el browser (Stockfish WASM en Web Worker)
- **IA que te habla como un entrenador argentino** — castellano informal, segunda persona
- **Solo analiza TUS errores** — detecta tu color automáticamente y filtra
- **Tableros duales** — lo que hiciste vs lo que debías hacer
- **Notación figurine** (♞♝♜♛♚) como en Lichess
- **Modelo 70B gratis** — LLaMA 3.3 70B Versatile via Groq

---

## Cómo usé Kiro en el desarrollo

### 1. Specs (Especificaciones estructuradas)

Kiro generó specs completas **antes** de escribir código:

#### `requirements.md`
- 12+ requisitos formales con criterios de aceptación
- Historias de usuario para cada funcionalidad
- Glosario técnico completo (FEN, PGN, centipawn, etc.)
- Cada requisito con identificador único (0.1, 3.1, 5.2, etc.)

#### `design.md`
- Diseño técnico completo con arquitectura en 3 capas:
  - **Presentación** → Componentes React
  - **Lógica de Negocio** → Servicios (Analizador, Evaluador, Detector, Generador)
  - **Integración** → Clientes API (Lichess, Groq, Stockfish)
- Diagramas de secuencia (mermaid)
- Interfaces TypeScript definidas
- Decisiones de diseño documentadas

#### `tasks.md`
- Plan de implementación con 12+ fases
- Dependencias entre tareas
- Referencia cruzada a requisitos
- Cada tarea marca qué requisito valida

**Ejemplo de flujo spec-driven:**
```
Requisito 3.1: "Cargar Stockfish WASM como Web Worker"
  → Design: MotorStockfish clase con protocolo UCI directo
  → Task 9.3: "Crear clase MotorStockfish (wrapper)"
  → Implementación con tests unitarios
  → Validación contra requisito
```

---

### 2. Steering files (Reglas de proyecto)

Tres archivos que guían TODO el comportamiento de Kiro:

#### `rules.md` — Convenciones de código
- TypeScript estricto (`strict: true`)
- Estructura de carpetas definida
- Patrones de componentes React
- Nomenclatura (PascalCase componentes, camelCase funciones)
- Testing obligatorio
- Accesibilidad (ARIA labels, contraste)

#### `idioma.md` (`inclusion: always`) — Todo en castellano
- Variables, funciones, comentarios, mensajes → castellano
- Excepciones: componentes React, hooks `use*`, tipos TypeScript
- Groq API configurado para responder en castellano argentino
- **Se aplica automáticamente en CADA archivo que Kiro genera**

#### `estilo-visual-tablero.md` (`inclusion: always`) — Estilo Lichess
- Colores exactos: `#f0d9b5` (clara) / `#b58863` (oscura)
- Piezas cburnett SVG
- Animaciones 300ms
- Highlights rojo (error) / verde (mejor jugada)
- Responsive desde 320px
- **Se aplica automáticamente en CADA componente de tablero**

---

### 3. Hooks personalizados de React

| Hook | Responsabilidad |
|------|----------------|
| `useStockfish` | Lazy loading del motor WASM. Solo carga cuando el usuario inicia análisis. Cachea instancia. |
| `useCredenciales` | Gestión de credenciales. Prioridad: localStorage > .env.local. Recarga sin refresh. |
| `useAnalisis` | Estado del análisis (inactivo/analizando/pausado/completado/error). Progreso en tiempo real. |

---

### 4. Workflow real con Kiro

El proceso fue iterativo y colaborativo:

#### Fase 1: Planificación (Spec-first)
```
Usuario: "Quiero un analizador de partidas de Lichess"
Kiro: → Genera requirements.md (12 requisitos)
     → Genera design.md (arquitectura, interfaces, diagramas)
     → Genera tasks.md (plan de implementación por fases)
```

#### Fase 2: Implementación (Task execution)
```
Kiro ejecuta cada tarea del plan:
- Task 1: Estructura de proyecto + tipos
- Task 2: GestorCredenciales + tests
- Task 3: ClienteLichess + validación de token
- ...
- Task 12: Componentes UI + integración final
```

#### Fase 3: Bug fixing en vivo (Debugging asistido)
Errores complejos resueltos con diagnóstico paso a paso:

| Bug | Causa raíz | Fix |
|-----|-----------|-----|
| `TypeError: error loading dynamically imported module` | Encoding corrupto UTF-8→Latin-1 en MotorStockfish.ts | Reescritura completa del archivo |
| Worker no carga | `{ type: 'module' }` + `importScripts()` incompatibles | Apuntar directo a stockfish.wasm.js (ES el worker) |
| WASM "magic number" error | `locateFile` resolvía path incorrecto | Worker vive en `/stockfish/` → resuelve `.wasm` relativo |
| 0 errores detectados | Evaluación sin normalizar (perspectiva del lado que mueve) | Negar cuando turno=negras |
| "La partida no contiene datos PGN" | Header `Accept: application/x-ndjson` → JSON sin PGN | Cambiar a `Accept: application/x-chess-pgn` |
| "Analizador no inicializado" | React state async (setAnalizador no propagó) | Llamar método directo en instancia |
| Progreso 112% | `totalJugadas` usaba Map.size (crece durante análisis) | Campo fijo seteado al parsear |

#### Fase 4: Features adicionales (Iteración rápida)
```
Usuario: "Quiero elegir tipo de partida"
Kiro: → Crea SelectorAnalisis.tsx + CSS + tests (8 tests)
     → Actualiza ClienteLichess (?perfType=)
     → Actualiza AnalizadorPartida (opciones)
     → Todo en una sola iteración
```

Features agregadas sobre la marcha:
- Selector Bullet/Blitz/Rápida/Clásica
- Filtro solo errores de MI color
- Top 3 o 5 errores más graves
- Notación figurine Unicode (♞♝♜♛♚)
- Modelo Groq 70B (upgrade de 8B)
- Explicaciones estilo Kasparov en argentino
- Validación de AMBOS tokens al guardar
- Username visible cuando logueado
- Tableros con posición correcta (UCI→SAN via chess.js)

#### Fase 5: Deploy
```
Kiro: → Crea vercel.json (headers COOP/COEP para WASM)
     → Crea .env.local.example
     → Arregla todos los errores de build (44 errores TS)
     → Push a GitHub → Deploy en Vercel
```

---

### 5. Testing

| Tipo | Framework | Cantidad |
|------|-----------|----------|
| Property-based | fast-check + Vitest | Tests de credenciales |
| Unit | Vitest | 60+ tests |
| Integration | Vitest | Tests de flujo completo |
| Component | @testing-library/react | Tests de UI |

---

## Métricas del proyecto

| Métrica | Valor |
|---------|-------|
| Archivos de código | 84+ |
| Líneas de código | 12,500+ |
| Specs generadas | 2 (lichess-game-analysis, stockfish-fix) |
| Steering files | 3 (rules, idioma, estilo-visual) |
| Tests | 60+ |
| Bugs complejos resueltos | 7+ |
| Features agregadas en vivo | 10+ |
| Deploy | Vercel (serverless, gratis) |

---

## ¿Por qué Kiro fue clave?

1. **Spec-first** — No se escribió código sin tener requisitos y diseño claros primero. Esto evitó retrabajos de arquitectura.

2. **Steering siempre activo** — Las reglas de idioma y estilo visual se aplicaron automáticamente en CADA archivo generado. No hay que recordarlas.

3. **Debugging asistido** — Errores complejos (encoding, WASM, Workers, normalización) se resolvieron con diagnóstico metódico paso a paso.

4. **Iteración rápida** — Features nuevas se agregaron en minutos con contexto completo del proyecto. Kiro sabe qué archivos tocar, qué tests escribir, qué imports agregar.

5. **Deploy-ready** — Desde idea hasta producción en una sesión: spec → código → tests → build fixes → deploy.

6. **Contexto persistente** — A diferencia de un chat normal, Kiro mantiene el contexto del proyecto completo (specs, steering, código existente) y lo aplica en cada interacción.

---

## Stack completo

```
Frontend:     React 18 + TypeScript + Vite
Motor:        Stockfish WASM (Web Worker, protocolo UCI)
Ajedrez:      chess.js (lógica) + react-chessboard (visual)
IA:           Groq API → LLaMA 3.3 70B Versatile
API:          Lichess API (fetch directo, PGN format)
Testing:      Vitest + fast-check + @testing-library
Deploy:       Vercel (static site + COOP/COEP headers)
Dev Tool:     Kiro (specs + steering + task execution)
```

---

## Links

- **Repo**: https://github.com/chiappegus/ajedrez-trainer
- **Lichess tokens**: https://lichess.org/account/oauth/token
- **Groq API keys**: https://console.groq.com/keys
- **Kiro**: https://kiro.dev
