# Plan de Implementación: Análisis de Partidas de Lichess

## Resumen

Este documento define las tareas de implementación para la funcionalidad de análisis automático de partidas de ajedrez desde Lichess. El sistema permite a los usuarios analizar su partida más reciente, identificar errores significativos mediante Stockfish ejecutándose en el navegador, y recibir explicaciones educativas generadas por IA.

**Stack Tecnológico:**
- React 19.2.7 + TypeScript 6.0.2 + Vite 8.1.1
- chess.js 1.4.0 (motor de ajedrez y parser PGN)
- react-chessboard 5.10.0 (visualización)
- Stockfish.js (análisis WASM)
- Groq API (explicaciones IA)
- fast-check (property-based testing)

## Tareas

### Fase 1: Infraestructura Base y Configuración

- [x] 1. Configurar estructura de proyecto y modelos de datos
  - [x] 1.1 Crear estructura de directorios del proyecto
    - Crear carpetas: `src/types/`, `src/services/`, `src/components/`, `src/hooks/`, `src/utils/`
    - Crear carpetas de testing: `src/__tests__/properties/`, `src/__tests__/unit/`, `src/__tests__/integration/`
    - _Requisitos: Todos (estructura base)_
  
  - [x] 1.2 Definir interfaces TypeScript de modelos de datos
    - Crear `src/types/credenciales.ts` con interfaces `Credenciales`, `CredencialesAlmacenadas`, `ResultadoValidación`
    - Crear `src/types/partida.ts` con interfaces `Partida`, `MetadatosPartida`, `Jugada`
    - Crear `src/types/evaluacion.ts` con interfaces `Evaluación`, `ResultadoAnálisis`
    - Crear `src/types/error.ts` con interfaces `ErrorDetectado`, `EstadísticasAnálisis`, `ProgresoAnálisis`
    - Usar tipos estrictos y evitar `any`
    - _Requisitos: 0.1, 0.2, 2.1, 4.1, 5.2_

- [x] 2. Implementar gestión de credenciales
  - [x] 2.1 Implementar clase `GestorCredenciales`
    - Crear `src/services/credenciales/GestorCredenciales.ts`
    - Implementar métodos: `cargarCredenciales()`, `guardarCredenciales()`, `limpiarCredenciales()`, `verificarExistenciaConfiguracion()`
    - Implementar encriptación básica con `btoa()` y `atob()`
    - Almacenar en localStorage con clave `ajedrez_trainer_credenciales_v1`
    - _Requisitos: 0.1.1, 0.1.8, 0.1.9, 0.2.1, 0.2.2, 0.2.4, 0.2.5, 0.4.3, 0.4.6_
  
  - [x]* 2.2 Escribir pruebas basadas en propiedades para credenciales
    - **Propiedad 1: Validación de credenciales vacías**
    - **Valida: Requisito 0.1.9**
    - Crear `src/__tests__/properties/credenciales.property.test.ts`
    - Implementar generador `generadorCredenciales()` con fast-check
    - Verificar que credenciales con campos vacíos sean rechazadas
    - _Requisitos: 0.1.9_
  
  - [x]* 2.3 Escribir pruebas basadas en propiedades para round-trip de almacenamiento
    - **Propiedad 2: Round-trip de almacenamiento de credenciales**
    - **Valida: Requisitos 0.2.1, 0.2.5**
    - Verificar que guardar y cargar credenciales preserve valores originales
    - Verificar que encriptación/desencriptación funcione correctamente
    - _Requisitos: 0.2.1, 0.2.5_
  
  - [x] 2.4 Implementar validación de credenciales
    - Crear función `validarCredenciales()` en `GestorCredenciales`
    - Validar campos no vacíos (username, tokenLichess, apiKeyGroq)
    - Validar formato de username (alfanumérico, guiones, guiones bajos)
    - Validar que token Lichess empiece con "lip_"
    - Retornar `ResultadoValidación` con mensaje de error descriptivo
    - _Requisitos: 0.1.9, 0.3.2_

- [x] 3. Implementar componente de configuración de credenciales
  - [x] 3.1 Crear componente `ConfiguraciónCredenciales`
    - Crear `src/components/configuracion/ConfiguracionCredenciales.tsx`
    - Implementar formulario con tres campos: username Lichess, token Lichess, API key Groq
    - Incluir enlaces a páginas de generación de tokens (Lichess, Groq)
    - Mostrar mensajes de validación y errores
    - Deshabilitar botón guardar mientras valida
    - _Requisitos: 0.1.2, 0.1.3, 0.1.4, 0.1.5, 0.1.6, 0.1.7, 0.4.1, 0.4.2_
  
  - [x] 3.2 Implementar lógica de guardado y validación en componente
    - Usar hook `useState` para estado del formulario
    - Validar campos al hacer clic en guardar
    - Llamar a `GestorCredenciales.guardarCredenciales()`
    - Mostrar feedback visual (éxito/error)
    - Navegar a pantalla principal tras configuración exitosa
    - _Requisitos: 0.1.9, 0.3.3_

  
  - [x] 3.3 Agregar botón de acceso a configuración desde menú principal
    - Permitir actualizar credenciales en cualquier momento
    - Implementar botón "Limpiar Credenciales" que llame a `GestorCredenciales.limpiarCredenciales()`
    - Mostrar pantalla de configuración después de limpiar
    - _Requisitos: 0.1.10, 0.2.3, 0.2.4_

- [x] 4. Checkpoint - Verificar infraestructura base
  - Asegurar que todos los tests pasen
  - Verificar que configuración de credenciales funcione end-to-end
  - Confirmar que almacenamiento en localStorage sea correcto
  - Preguntar al usuario si hay dudas o ajustes necesarios

### Fase 2: Integración con Lichess API

- [x] 5. Implementar cliente de Lichess API
  - [x] 5.1 Crear clase `ClienteLichess`
    - Crear `src/services/lichess/ClienteLichess.ts`
    - Implementar constructor que reciba token de autenticación
    - Definir constantes: `LICHESS_BASE_URL`, `ENDPOINTS`
    - Configurar headers con Authorization Bearer
    - _Requisitos: 1.1, 1.7_
  
  - [x] 5.2 Implementar método `validarToken()`
    - Realizar petición GET a `/api/account` de Lichess
    - Usar `AbortSignal.timeout(5000)` para timeout de 5 segundos
    - Retornar booleano indicando validez del token
    - Manejar errores 401 (token inválido), 404, timeout
    - _Requisitos: 0.3.1, 0.3.2, 0.3.3, 0.3.4, 1.8_
  
  - [x] 5.3 Implementar método `obtenerCuentaUsuario()`
    - Realizar petición GET a `/api/account`
    - Parsear respuesta JSON a interfaz `CuentaLichess`
    - Retornar datos de cuenta (id, username, ratings)
    - _Requisitos: 1.1_
  
  - [x] 5.4 Implementar método `obtenerÚltimaPartida()`
    - Realizar petición GET a `/api/games/user/{username}`
    - Usar header `Accept: application/x-ndjson`
    - Timeout de 10 segundos
    - Parsear respuesta NDJSON (primera línea es partida más reciente)
    - Extraer campo `pgn` del JSON
    - _Requisitos: 1.1, 1.2, 1.6_

  
  - [x] 5.5 Implementar manejo de errores específicos de Lichess
    - Error 404 → "Nombre de usuario no encontrado"
    - Error 401 → "Token de API inválido o expirado"
    - Sin partidas → "No se encontraron partidas para este usuario"
    - Timeout → "Ocurrió un error de red"
    - Error 429 → "Rate limit excedido"
    - _Requisitos: 1.3, 1.4, 1.5, 1.8_
  
  - [x]* 5.6 Escribir pruebas de integración para `ClienteLichess`
    - Crear `src/__tests__/integration/ClienteLichess.test.ts`
    - Mockear `fetch` con `jest.fn()`
    - Probar casos: usuario válido, usuario inexistente, token inválido, timeout
    - Verificar manejo correcto de NDJSON
    - _Requisitos: 1.1, 1.3, 1.4, 1.5_

- [x] 6. Integrar validación de token en configuración
  - [x] 6.1 Conectar validación de token con UI de configuración
    - Llamar a `ClienteLichess.validarToken()` después de guardar credenciales
    - Mostrar indicador de carga "Validando token..."
    - Mostrar mensaje de éxito si token es válido
    - Mostrar mensaje de error descriptivo si falla validación
    - Permitir al usuario corregir token sin perder otros campos
    - _Requisitos: 0.3.1, 0.3.2, 0.3.3_

### Fase 3: Parser de PGN y Análisis de Partidas

- [x] 7. Implementar parser de PGN
  - [x] 7.1 Crear clase `ParserPGN`
    - Crear `src/services/parseo/ParserPGN.ts`
    - Implementar método `parsear(pgnString: string): Partida`
    - Utilizar librería `chess.js` para parsing y validación
    - Extraer metadatos de encabezados PGN (Event, Site, White, Black, Date, etc.)
    - Extraer secuencia de jugadas en notación SAN
    - _Requisitos: 2.1, 2.2, 2.3_

  
  - [x] 7.2 Generar posiciones FEN para cada jugada
    - Recorrer secuencia de jugadas usando chess.js
    - Almacenar FEN resultante en cada objeto `Jugada`
    - Almacenar también notación UCI si está disponible
    - Preservar comentarios y anotaciones (!, !!, ?, ??, !?, ?!)
    - _Requisitos: 2.2, 2.3, 2.5_
  
  - [x] 7.3 Implementar método `serializar(partida: Partida): string`
    - Convertir objeto `Partida` de vuelta a formato PGN estándar
    - Incluir encabezados de metadatos
    - Incluir números de jugada y anotaciones
    - Necesario para testing de round-trip
    - _Requisitos: 2.5_
  
  - [x] 7.4 Implementar manejo de errores en parser
    - Crear clase `ErrorParseoPGN extends Error`
    - Validar sintaxis PGN antes de procesar
    - Identificar línea de error cuando sea posible
    - Retornar mensaje descriptivo en castellano
    - _Requisitos: 2.4_
  
  - [x]* 7.5 Escribir pruebas basadas en propiedades para parser PGN
    - **Propiedad 3: Round-trip del parser PGN**
    - **Valida: Requisitos 2.1, 2.2, 2.3, 2.5**
    - Crear `src/__tests__/properties/parser.property.test.ts`
    - Implementar generador `generadorPartida()` con fast-check
    - Verificar que serializar → parsear preserve estructura de partida
    - _Requisitos: 2.1, 2.2, 2.3, 2.5_
  
  - [x]* 7.6 Escribir pruebas de rechazo de PGN inválido
    - **Propiedad 4: Rechazo de PGN inválido**
    - **Valida: Requisito 2.4**
    - Implementar generador `generadorPGNInválido()` con fast-check
    - Verificar que parser rechace PGN malformado con `ErrorParseoPGN`
    - Verificar que mensaje de error sea descriptivo
    - _Requisitos: 2.4_
  
  - [x]* 7.7 Escribir pruebas unitarias de casos específicos de PGN
    - Probar apertura española estándar
    - Probar PGN con comentarios
    - Probar PGN con anotaciones (!, ?, etc.)
    - Probar partidas cortas y largas
    - _Requisitos: 2.2, 2.3, 2.5_


- [~] 8. Checkpoint - Verificar parsing y obtención de partidas
  - Confirmar que `ClienteLichess` obtiene partidas correctamente
  - Confirmar que `ParserPGN` convierte PGN a objetos `Partida` válidos
  - Verificar que round-trip (serializar → parsear) funciona
  - Probar con partidas reales de Lichess
  - Preguntar al usuario si hay problemas o ajustes

### Fase 4: Motor de Análisis con Stockfish

- [x] 9. Configurar e inicializar Stockfish.js
  - [x] 9.1 Agregar Stockfish.js al proyecto
    - Descargar Stockfish.js WASM desde CDN o instalarlo vía npm
    - Colocar archivos WASM en carpeta `public/` para acceso directo
    - Configurar Vite para servir archivos WASM correctamente
    - _Requisitos: 3.1, 3.5_
  
  - [x] 9.2 Crear Web Worker para Stockfish
    - Crear `src/services/stockfish/stockfish-worker.ts`
    - Implementar inicialización de Stockfish WASM
    - Configurar comunicación bidireccional con hilo principal (postMessage)
    - Implementar manejo de comandos UCI (uci, isready, position, go, stop)
    - _Requisitos: 3.1, 3.3, 10.5_
  
  - [x] 9.3 Crear clase `MotorStockfish` (wrapper)
    - Crear `src/services/stockfish/MotorStockfish.ts`
    - Implementar método `inicializar(): Promise<void>`
    - Crear instancia de Worker apuntando a `stockfish-worker.ts`
    - Esperar respuesta 'uciok' y 'readyok' (timeout 5 segundos)
    - Manejar errores de inicialización
    - _Requisitos: 3.1, 3.2, 3.4_
  
  - [x] 9.4 Implementar método `analizarPosición()`
    - Recibir parámetros: `fen: string`, `profundidad: number`
    - Enviar comandos UCI: `position fen {fen}`, `go depth {profundidad}`
    - Parsear respuesta UCI (líneas `info` y `bestmove`)
    - Extraer evaluación en centipawns o mate
    - Extraer mejor jugada en formato UCI
    - Timeout de 2 segundos por posición
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  
  - [x] 9.5 Implementar conversión de evaluaciones UCI a centipawns normalizados
    - Parsear líneas `info score cp X` → retornar X
    - Parsear líneas `info score mate X` → retornar 10000 si X > 0, -10000 si X < 0
    - Manejar evaluaciones desde perspectiva de blancas (positivo = ventaja blanca)
    - _Requisitos: 4.2, 4.3_
  
  - [x] 9.6 Implementar conversión de mejor jugada UCI a SAN
    - Usar chess.js para convertir jugada UCI (e.g., "e2e4") a SAN (e.g., "e4")
    - Validar que la jugada sea legal en la posición
    - Almacenar ambos formatos (UCI y SAN)
    - _Requisitos: 4.4_
  
  - [ ]* 9.7 Escribir pruebas de integración para Stockfish
    - Crear `src/__tests__/integration/MotorStockfish.test.ts`
    - Probar inicialización (con timeout largo ~10s)
    - Probar análisis de posición inicial del ajedrez
    - Verificar que evaluación esté en rango razonable (-100 a +100 cp)
    - Verificar que mejor jugada sea una jugada legal
    - _Requisitos: 3.1, 3.2, 4.1, 4.2, 4.4_

- [x] 10. Implementar evaluador de jugadas
  - [x] 10.1 Crear clase `EvaluadorJugadas`
    - Crear `src/services/analisis/EvaluadorJugadas.ts`
    - Implementar constructor que reciba instancia de `MotorStockfish`
    - Definir profundidad por defecto: 15 plies
    - Implementar método `establecerProfundidad(profundidad: number)`
    - _Requisitos: 4.1, 4.2_
  
  - [x] 10.2 Implementar método `evaluarPosición()`
    - Recibir FEN y profundidad
    - Llamar a `MotorStockfish.analizarPosición()`
    - Retornar objeto `Evaluación` completo con todos los campos requeridos
    - Medir tiempo de evaluación (tiempoEvaluación en ms)
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 10.3 Implementar método `evaluarSecuencia()`
    - Recibir array de FENs
    - Evaluar cada posición secuencialmente (una a la vez)
    - Implementar yields al hilo principal cada 2 segundos usando `setTimeout(resolve, 0)`
    - Retornar array de evaluaciones
    - _Requisitos: 4.6, 10.1, 10.2_

  
  - [x] 10.4 Implementar caché de evaluaciones para optimización
    - Crear `src/services/cache/CacheEvaluaciones.ts`
    - Implementar Map con FEN como clave y `Evaluación` como valor
    - Limitar tamaño del caché a 1000 posiciones (eliminar más antiguas)
    - Integrar en `EvaluadorJugadas` para reutilizar evaluaciones
    - _Requisitos: 4.6_

- [x] 11. Checkpoint - Verificar motor de análisis
  - Confirmar que Stockfish se inicializa correctamente en Web Worker
  - Confirmar que evaluaciones funcionan para posiciones de prueba
  - Verificar que no hay bloqueo de UI durante análisis
  - Verificar que timeouts funcionan correctamente
  - Preguntar al usuario si hay problemas de rendimiento

### Fase 5: Detección de Errores

- [x] 12. Implementar detector de errores
  - [x] 12.1 Crear clase `DetectorErrores`
    - Crear `src/services/analisis/DetectorErrores.ts`
    - Definir umbral de error significativo: 100 centipawns
    - Implementar método `detectarError(evalAntes, evalDespués, jugada, numeroJugada)`
    - _Requisitos: 5.1, 5.2_
  
  - [x] 12.2 Implementar cálculo de cambio de evaluación según turno
    - Si turno es 'white': cambio = evalDespués.centipawns - evalAntes.centipawns
    - Si turno es 'black': cambio = evalAntes.centipawns - evalDespués.centipawns (invertir)
    - Pérdida = cambio negativo con magnitud >= 100cp
    - _Requisitos: 5.1, 5.4_
  
  - [x] 12.3 Implementar construcción de objeto `ErrorDetectado`
    - Crear objeto con todos los campos requeridos: numeroJugada, turno, fenAntes, jugadaRealizada, mejorJugada, mejorJugadaSAN, evaluaciónAntes, evaluaciónDespués, pérdidaCentipawns
    - Asegurar que no haya valores null o undefined
    - Calcular pérdida en valor absoluto
    - _Requisitos: 5.2, 5.3_
  
  - [x] 12.4 Implementar filtrado de primeras 3 jugadas
    - Si numeroJugada <= 3, retornar null (no error)
    - Aplicar detección solo desde jugada 4 en adelante
    - _Requisitos: 5.5_

  
  - [x] 12.5 Implementar distinción de errores por color
    - Almacenar turno ('white' o 'black') en cada `ErrorDetectado`
    - Asegurar que la lógica de pérdida respete la perspectiva del jugador
    - _Requisitos: 5.4_
  
  - [ ]* 12.6 Escribir pruebas basadas en propiedades para detector de errores
    - **Propiedad 5: Detección y clasificación de errores por umbral**
    - **Valida: Requisitos 5.1, 5.2**
    - Crear `src/__tests__/properties/detector.property.test.ts`
    - Implementar generadores `generadorEvaluación()` y `generadorJugada()`
    - Verificar clasificación correcta según umbral de 100cp
    - Verificar cálculo correcto de cambio según turno (blancas vs negras)
    - _Requisitos: 5.1, 5.2, 5.4_
  
  - [ ]* 12.7 Escribir prueba de propiedad para estructura completa de error
    - **Propiedad 6: Estructura completa de objeto Error**
    - **Valida: Requisito 5.3**
    - Verificar que todos los campos requeridos estén presentes y no sean null
    - _Requisitos: 5.3_
  
  - [ ]* 12.8 Escribir prueba de propiedad para distinción por turno
    - **Propiedad 7: Distinción de errores por turno**
    - **Valida: Requisito 5.4**
    - Verificar interpretación correcta de evaluaciones según turno
    - Para blancas: pérdida = evalDespués < evalAntes
    - Para negras: pérdida = evalDespués > evalAntes (desde perspectiva de Stockfish)
    - _Requisitos: 5.4_
  
  - [ ]* 12.9 Escribir prueba de propiedad para filtrado de apertura
    - **Propiedad 8: Filtrado de primeras 3 jugadas**
    - **Valida: Requisito 5.5**
    - Generar errores potenciales en jugadas 1, 2, 3
    - Verificar que nunca aparezcan en lista de errores detectados
    - _Requisitos: 5.5, 5.6_
  
  - [ ]* 12.10 Escribir pruebas unitarias de casos específicos
    - Probar detección con pérdida exacta de 100cp (borde)
    - Probar pérdida de 99cp (no debe ser error)
    - Probar pérdida de 101cp (debe ser error)
    - Probar evaluaciones de mate
    - _Requisitos: 5.1, 5.2_


- [x] 13. Checkpoint - Verificar detección de errores
  - Confirmar que detector identifica errores correctamente
  - Confirmar que todas las pruebas de propiedades pasan
  - Probar con partidas reales que contengan errores conocidos
  - Preguntar al usuario si la lógica de detección es correcta

### Fase 6: Explicaciones con IA (Groq API)

- [x] 14. Implementar cliente de Groq API
  - [x] 14.1 Crear clase `ClienteGroq`
    - Crear `src/services/groq/ClienteGroq.ts`
    - Implementar constructor que reciba API Key
    - Definir constante: endpoint `https://api.groq.com/openai/v1/chat/completions`
    - Definir interfaces: `ParámetrosChatCompletion`, `Mensaje`, `RespuestaGroq`
    - _Requisitos: 8.1, 8.2_
  
  - [x] 14.2 Implementar método `chatCompletion()`
    - Realizar petición POST a Groq API
    - Incluir header `Authorization: Bearer {apiKey}`
    - Enviar body JSON con modelo, mensajes, max_tokens, temperature
    - Usar modelo `llama-3.1-8b-instant`
    - Parsear respuesta y retornar contenido generado
    - _Requisitos: 8.1, 8.2_
  
  - [x] 14.3 Implementar manejo de errores de Groq API
    - Error 401 → API Key inválida
    - Error 429 → Rate limit excedido
    - Error 500 → Error de servidor
    - Timeout → Sin respuesta
    - Registrar errores en logger
    - _Requisitos: 8.9_
  
  - [ ]* 14.4 Escribir pruebas de integración para `ClienteGroq`
    - Crear `src/__tests__/integration/ClienteGroq.test.ts`
    - Mockear fetch con respuestas exitosas y errores
    - Verificar que respuestas se parsean correctamente
    - Verificar manejo de errores (401, 429, 500)
    - _Requisitos: 8.1, 8.9_

- [ ] 15. Implementar generador de explicaciones
  - [x] 15.1 Crear clase `GeneradorExplicaciones`
    - Crear `src/services/analisis/GeneradorExplicaciones.ts`
    - Implementar constructor que reciba instancia de `ClienteGroq`
    - Definir constante `PROMPT_SISTEMA_EXPLICACIONES` en castellano
    - _Requisitos: 8.1, 8.3_

  
  - [x] 15.2 Implementar método `generarExplicaciónConcisa()`
    - Construir prompt con contexto del error: FEN, turno, jugada realizada, mejor jugada, pérdida en cp
    - Solicitar explicación en máximo 150 palabras en castellano
    - Incluir: qué se jugó, por qué fue error, qué se debió jugar, amenazas/tácticas pasadas por alto
    - Temperatura: 0.7, max_tokens: 500
    - Manejar errores con fallback a explicación básica
    - _Requisitos: 8.2, 8.3, 8.4, 8.9_
  
  - [x] 15.3 Implementar método `generarExplicaciónExtendida()`
    - Similar a concisa pero solicitar hasta 300 palabras
    - Max_tokens: 1000
    - Incluir más detalles tácticos y análisis de variantes
    - _Requisitos: 8.6_
  
  - [x] 15.4 Implementar método `generarExplicaciónBásica()` (fallback)
    - Generar explicación simple sin IA cuando Groq falla
    - Formato: "Jugada X: {turno} jugó {jugadaRealizada}, perdiendo {pérdidaCentipawns}cp. La mejor jugada era {mejorJugada}."
    - En castellano
    - _Requisitos: 8.9_
  
  - [x] 15.5 Definir prompt del sistema en castellano
    - Prompt que indique: "Eres un entrenador de ajedrez educativo y amigable. Explica errores en castellano de forma clara y concisa."
    - Especificar estructura: qué se jugó, por qué fue error, qué se debió jugar, qué se pasó por alto
    - Tono educativo y motivador
    - _Requisitos: 8.3_

- [x] 16. Checkpoint - Verificar explicaciones IA
  - Confirmar que Groq API responde correctamente
  - Verificar que explicaciones están en castellano
  - Verificar que fallback funciona cuando Groq falla
  - Probar con varios tipos de errores (tácticos, posicionales)
  - Preguntar al usuario si las explicaciones son útiles

### Fase 7: Orquestador de Análisis

- [x] 17. Implementar analizador de partidas (orquestador)
  - [x] 17.1 Crear clase `AnalizadorPartida`
    - Crear `src/services/analisis/AnalizadorPartida.ts`
    - Implementar constructor que reciba: ClienteLichess, ParserPGN, EvaluadorJugadas, DetectorErrores, GeneradorExplicaciones
    - Definir estado interno: `EstadoAnalizador`
    - _Requisitos: 9.1, 9.2_

  
  - [x] 17.2 Implementar método `iniciarAnálisis(nombreUsuario: string)`
    - Obtener PGN desde Lichess usando `ClienteLichess.obtenerÚltimaPartida()`
    - Parsear PGN usando `ParserPGN.parsear()`
    - Inicializar Stockfish si no está cargado
    - Cambiar estado a 'analizando'
    - Retornar `Promise<ResultadoAnálisis>`
    - _Requisitos: 9.1, 9.2_
  
  - [x] 17.3 Implementar bucle de análisis jugada por jugada
    - Iterar sobre jugadas desde índice 3 (jugada 4 en adelante)
    - Para cada jugada: evaluar posición, detectar error, generar explicación si aplica
    - Almacenar evaluaciones en Map indexado por número de jugada
    - Almacenar errores detectados en array
    - Actualizar progreso después de cada jugada
    - _Requisitos: 9.1, 9.2, 5.5_
  
  - [x] 17.4 Implementar generación de explicaciones en bucle
    - Cuando se detecta un error, llamar a `GeneradorExplicaciones.generarExplicaciónConcisa()`
    - Almacenar explicación en el objeto `ErrorDetectado`
    - Si Groq falla, usar explicación básica automáticamente
    - _Requisitos: 8.1, 8.9_
  
  - [x] 17.5 Implementar cálculo de estadísticas finales
    - Calcular pérdida promedio de centipawns por jugada
    - Contar errores de blancas y errores de negras
    - Identificar mayor pérdida y jugada donde ocurrió
    - Clasificar rendimiento: excelente (<10cp), sólido (<20cp), aceptable (<40cp), mejorable (>=40cp)
    - _Requisitos: 9.2, 12.1, 12.2_
  
  - [x] 17.6 Implementar métodos `pausarAnálisis()` y `reanudarAnálisis()`
    - Pausar: cambiar estado a 'pausado', detener bucle de evaluación
    - Reanudar: cambiar estado a 'analizando', continuar desde última jugada
    - _Requisitos: 10.3, 10.4, 9.5_
  
  - [x] 17.7 Implementar método `obtenerProgreso()`
    - Retornar objeto `ProgresoAnálisis` con: estado, jugadaActual, totalJugadas, erroresEncontrados
    - Calcular tiempo promedio por jugada basado en evaluaciones completadas
    - Estimar tiempo restante: (totalJugadas - jugadaActual) * tiempoPromedio
    - _Requisitos: 9.1, 9.2, 9.3_


- [x] 18. Implementar indicador de progreso
  - [x] 18.1 Crear componente `IndicadorProgreso`
    - Crear `src/components/analisis/IndicadorProgreso.tsx`
    - Mostrar barra de progreso visual (porcentaje completado)
    - Mostrar número de jugada actual y total
    - Mostrar tiempo restante estimado
    - Mostrar número de errores encontrados hasta ahora
    - _Requisitos: 9.1, 9.2, 9.3_
  
  - [x] 18.2 Conectar indicador con `AnalizadorPartida`
    - Usar hook personalizado `useAnalisis` para suscribirse a progreso
    - Actualizar UI cada vez que cambie el estado del analizador
    - Mostrar mensaje "Analizando jugada X de Y..."
    - _Requisitos: 9.1, 9.2_
  
  - [x] 18.3 Implementar botones de pausa y reanudar
    - Botón "Pausar" que llame a `AnalizadorPartida.pausarAnálisis()`
    - Botón "Reanudar" que llame a `AnalizadorPartida.reanudarAnálisis()`
    - Deshabilitar botones según estado (pausado, analizando, completado)
    - _Requisitos: 10.3, 10.4_

- [x] 19. Checkpoint - Verificar flujo completo de análisis
  - Confirmar que análisis end-to-end funciona correctamente
  - Verificar que progreso se actualiza en tiempo real
  - Verificar que pausa/reanudar funciona
  - Probar con partidas de diferentes longitudes
  - Preguntar al usuario si el flujo es correcto

### Fase 8: Visualización de Tableros

- [x] 20. Implementar visualizador de tableros de ajedrez
  - [x] 20.1 Crear componente `VisualizadorTablero`
    - Crear `src/components/tablero/VisualizadorTablero.tsx`
    - Importar y configurar `Chessboard` de `react-chessboard`
    - Configurar colores Lichess: light square #f0d9b5, dark square #b58863
    - Configurar tamaño responsivo según ancho de ventana
    - _Requisitos: 6.1, 13.1, 13.2, 13.3_
  
  - [x] 20.2 Implementar highlights de casillas
    - Implementar función `generarEstilosHighlight()` que reciba tipo: 'error', 'mejorJugada', 'últimoMovimiento'
    - Error: rojo rgba(255, 0, 0, 0.4)
    - Mejor jugada: verde rgba(0, 255, 0, 0.4)
    - Último movimiento: amarillo rgba(255, 255, 0, 0.3)
    - Aplicar estilos con `customSquareStyles` de Chessboard
    - _Requisitos: 6.2, 6.3, 13.5_

  
  - [x] 20.3 Configurar propiedades de Chessboard según estilo Lichess
    - `customDarkSquareStyle`: { backgroundColor: '#b58863' }
    - `customLightSquareStyle`: { backgroundColor: '#f0d9b5' }
    - `arePiecesDraggable`: false (solo visualización)
    - `animationDuration`: 300 (animaciones suaves)
    - `showBoardNotation`: true (mostrar coordenadas)
    - `customBoardStyle`: border-radius 4px, box-shadow
    - _Requisitos: 13.2, 13.3, 13.4_
  
  - [x] 20.4 Implementar función de tamaño adaptativo
    - Crear `calcularAnchoAdaptativo()` que calcule ancho según ventana
    - Móvil (<640px): 90% del ancho de ventana
    - Tablet (640-1024px): máximo 500px
    - Escritorio (>1024px): máximo 600px
    - Recalcular al cambiar tamaño de ventana (useEffect con resize listener)
    - _Requisitos: 11.1, 11.2, 11.5_
  
  - [x] 20.5 Implementar navegación jugada por jugada
    - Agregar controles: botón "Anterior", botón "Siguiente", botón "Ir al inicio", botón "Ir al final"
    - Actualizar posición FEN al cambiar jugada
    - Actualizar highlights según contexto (error, mejor jugada, último movimiento)
    - Mostrar número de jugada actual
    - _Requisitos: 6.4, 6.5, 6.6_
  
  - [ ]* 20.6 Escribir pruebas de componente para `VisualizadorTablero`
    - Crear `src/__tests__/components/VisualizadorTablero.test.tsx`
    - Verificar que tablero se renderiza con FEN inicial
    - Verificar que highlights se aplican correctamente
    - Verificar que navegación actualiza posición
    - Usar @testing-library/react
    - _Requisitos: 6.1, 6.2, 6.4_

- [x] 21. Implementar layout dual de tableros
  - [x] 21.1 Crear contenedor para tableros duales
    - Crear componente `ContenedorTablerosDuales` o integrar en componente principal
    - Usar flexbox para layout responsive
    - Móvil (<768px): apilar verticalmente (flex-direction: column)
    - Escritorio (>=768px): lado a lado (flex-direction: row)
    - Gap de 2rem entre tableros
    - _Requisitos: 11.2, 11.3_

  
  - [x] 21.2 Implementar tablero de partida real (izquierda/superior)
    - Mostrar posición después del error detectado
    - Resaltar casillas de la jugada de error en rojo
    - Mostrar título: "Partida Real - Jugada {número}"
    - Mostrar evaluación actual
    - _Requisitos: 6.1, 6.2, 6.3_
  
  - [x] 21.3 Implementar tablero de alternativa (derecha/inferior)
    - Mostrar posición antes del error (estado previo)
    - Resaltar casillas de la mejor jugada en verde
    - Mostrar título: "Mejor Alternativa"
    - Mostrar evaluación de la posición previa
    - Ocultar si no hay error seleccionado
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 21.4 Sincronizar ambos tableros con navegación
    - Cuando usuario navega a una jugada con error, actualizar ambos tableros
    - Cuando usuario navega a una jugada sin error, ocultar segundo tablero o mostrar mensaje
    - Mantener highlights consistentes según contexto
    - _Requisitos: 6.4, 6.5, 7.4_

- [x] 22. Implementar panel de explicaciones
  - [x] 22.1 Crear componente `PanelExplicaciones`
    - Crear `src/components/analisis/PanelExplicaciones.tsx`
    - Mostrar texto de explicación concisa generada por IA
    - Mostrar indicador de carga mientras se genera explicación
    - Aplicar animación de fade-in al mostrar explicación
    - _Requisitos: 8.3, 8.4_
  
  - [x] 22.2 Implementar botón "Profundizar explicación"
    - Al hacer clic, llamar a `GeneradorExplicaciones.generarExplicaciónExtendida()`
    - Reemplazar explicación concisa con extendida
    - Mostrar indicador de carga durante generación
    - Deshabilitar botón mientras carga
    - _Requisitos: 8.5, 8.6_
  
  - [x] 22.3 Implementar botón "Mostrar en tablero"
    - Al hacer clic, abrir modal con tablero interactivo
    - Mostrar variante de la mejor jugada paso a paso
    - Implementar controles para avanzar/retroceder la variante
    - _Requisitos: 8.7, 8.8_

  
  - [x] 22.4 Implementar navegación entre errores
    - Botón "Volver a lista de errores" que cierre panel y muestre lista
    - Implementar lista de errores con navegación rápida
    - Mostrar resumen de cada error: "Jugada X: {turno} - Pérdida {cp}cp"
    - Al hacer clic en un error, navegar a esa jugada y mostrar explicación
    - _Requisitos: 8.10_

- [x] 23. Checkpoint - Verificar visualización completa
  - Confirmar que tableros duales se muestran correctamente
  - Confirmar que highlights funcionan en ambos tableros
  - Confirmar que navegación sincroniza ambos tableros
  - Confirmar que explicaciones se muestran correctamente
  - Probar responsive en diferentes tamaños de pantalla
  - Preguntar al usuario si la interfaz es clara

### Fase 9: Pantalla de Resultados y Casos Especiales

- [x] 24. Implementar pantalla de resultados finales
  - [x] 24.1 Crear componente `ResumenAnálisis`
    - Mostrar estadísticas finales: total de jugadas analizadas, total de errores encontrados
    - Mostrar pérdida promedio de centipawns
    - Mostrar distribución de errores: errores de blancas vs errores de negras
    - Mostrar mayor pérdida y en qué jugada ocurrió
    - _Requisitos: 9.4, 12.2_
  
  - [x] 24.2 Implementar mensaje para partidas sin errores
    - Cuando no se detectan errores (array vacío), mostrar mensaje de felicitación
    - "¡Excelente! No se encontraron errores significativos en tu partida."
    - Mostrar pérdida promedio como métrica de rendimiento
    - Si pérdida promedio < 20cp, mostrar insignia "Rendimiento Sólido"
    - _Requisitos: 12.1, 12.2, 12.3_
  
  - [x] 24.3 Permitir navegación jugada por jugada incluso sin errores
    - Mostrar tablero único con partida completa
    - Permitir revisar todas las jugadas
    - Mostrar evaluaciones de cada posición
    - _Requisitos: 12.4_


- [x] 25. Implementar manejo global de errores
  - [x] 25.1 Crear jerarquía de errores personalizados
    - Crear `src/utils/errores.ts`
    - Definir clase base `ErrorAjedrezTrainer`
    - Definir clases específicas: `ErrorConfiguracion`, `ErrorRed`, `ErrorParseo`, `ErrorAnálisis`
    - Definir códigos de error (CONFIG_001, RED_001, etc.)
    - _Requisitos: Todos (manejo de errores)_
  
  - [x] 25.2 Implementar función de mensajes de error para usuario
    - Crear `obtenerMensajeUsuario(error: ErrorAjedrezTrainer): string`
    - Mapear cada código de error a mensaje en castellano
    - Mensajes claros y accionables (qué hacer para resolver)
    - _Requisitos: 1.3, 1.4, 1.5, 1.8, 2.4, 3.4_
  
  - [x] 25.3 Implementar logger para debugging
    - Crear `src/utils/logger.ts`
    - Implementar clase `Logger` con niveles: debug, info, warn, error
    - Almacenar eventos en array (máximo 100 eventos)
    - En desarrollo, hacer console.log automático
    - Implementar método `exportarLogs()` para debugging
    - _Requisitos: Todos (debugging)_
  
  - [x] 25.4 Integrar manejo de errores en todos los servicios
    - Envolver operaciones con try-catch
    - Lanzar errores específicos con códigos
    - Capturar errores en componentes con ErrorBoundary
    - Mostrar mensajes de error en UI
    - _Requisitos: Todos (robustez)_

- [~] 26. Checkpoint - Verificar manejo de errores
  - Probar cada tipo de error intencionalmente
  - Confirmar que mensajes son claros y útiles
  - Confirmar que logging funciona correctamente
  - Verificar que aplicación no crashea ante errores inesperados
  - Preguntar al usuario si el manejo de errores es adecuado

### Fase 10: Integración Final y Testing E2E

- [x] 27. Integrar todos los componentes en App principal
  - [x] 27.1 Crear flujo de navegación principal
    - Verificar credenciales al inicio
    - Si faltan, mostrar `ConfiguraciónCredenciales`
    - Si existen, mostrar pantalla principal con botón "Analizar última partida"
    - _Requisitos: 0.1.1, 0.1.8_

  
  - [x] 27.2 Conectar flujo completo de análisis
    - Al hacer clic en "Analizar", inicializar `AnalizadorPartida`
    - Mostrar `IndicadorProgreso` durante análisis
    - Al completar, mostrar resultados con tableros duales y explicaciones
    - Permitir volver a pantalla principal para nuevo análisis
    - _Requisitos: Todos (flujo completo)_
  
  - [x] 27.3 Implementar hooks personalizados para gestión de estado
    - Crear `src/hooks/useCredenciales.ts` para gestión de credenciales
    - Crear `src/hooks/useAnalisis.ts` para orquestar análisis
    - Crear `src/hooks/useStockfish.ts` para lazy loading de Stockfish
    - Usar Context API si es necesario para estado global
    - _Requisitos: Todos (arquitectura limpia)_

- [x] 28. Optimizar rendimiento
  - [x] 28.1 Implementar lazy loading de Stockfish WASM
    - Cargar Stockfish solo cuando usuario inicia análisis (no al inicio)
    - Mostrar mensaje "Cargando motor de análisis..."
    - Cachear instancia para análisis futuros
    - _Requisitos: 3.1, 10.5_
  
  - [x] 28.2 Optimizar re-renders de componentes
    - Usar `React.memo` en componentes pesados (VisualizadorTablero, PanelExplicaciones)
    - Usar `useMemo` para cálculos costosos (estilos de highlight, tamaños)
    - Usar `useCallback` para callbacks estables
    - _Requisitos: 11.1_
  
  - [x] 28.3 Implementar debounce para resize de ventana
    - Evitar recalcular tamaño de tableros en cada pixel de resize
    - Usar debounce de 200ms
    - _Requisitos: 11.1_

- [x] 29. Implementar accesibilidad
  - [x] 29.1 Agregar ARIA labels a elementos interactivos
    - Tableros: aria-label="Tablero de ajedrez"
    - Botones: aria-label descriptivos
    - Estados de carga: aria-live="polite"
    - _Requisitos: Accesibilidad general_
  
  - [x] 29.2 Asegurar navegación por teclado
    - Permitir navegar jugadas con flechas del teclado
    - Focus visible en todos los botones
    - Tab order lógico
    - _Requisitos: Accesibilidad general_


- [x] 30. Realizar pruebas end-to-end
  - [x]* 30.1 Escribir test E2E del flujo completo feliz
    - Configurar credenciales → Analizar partida → Ver resultados → Navegar errores
    - Usar herramienta de testing E2E (Playwright o Cypress si está disponible)
    - Alternativamente, prueba manual exhaustiva documentada
    - _Requisitos: Todos (flujo completo)_
  
  - [x]* 30.2 Escribir tests E2E de casos de error
    - Usuario no encontrado en Lichess
    - Token inválido
    - Sin partidas disponibles
    - Error de red
    - Groq API no disponible
    - _Requisitos: 1.3, 1.4, 1.5, 1.8, 8.9_
  
  - [x]* 30.3 Realizar pruebas de rendimiento
    - Analizar partida larga (60+ jugadas)
    - Verificar que UI permanece responsiva
    - Verificar que pausa/reanudar funciona
    - Medir tiempo total de análisis
    - _Requisitos: 10.1, 10.2, 10.5_

- [~] 31. Checkpoint final - Revisión completa
  - Ejecutar todos los tests (unit, properties, integration, E2E)
  - Verificar cobertura de tests (objetivo: >=80%)
  - Revisar documentación y comentarios en castellano
  - Probar en diferentes navegadores (Chrome, Firefox, Safari)
  - Probar en diferentes tamaños de pantalla (móvil, tablet, escritorio)
  - Verificar que no hay errores en consola
  - Preguntar al usuario si todo funciona correctamente

### Fase 11: Documentación y Pulido Final

- [ ] 32. Documentar código y uso
  - [~] 32.1 Agregar comentarios JSDoc a funciones principales
    - Documentar parámetros, retornos y ejemplos de uso
    - En castellano según reglas de steering
    - _Requisitos: Mantenibilidad_
  
  - [~] 32.2 Crear README de usuario (opcional si solicitado)
    - Instrucciones de configuración de credenciales
    - Cómo generar tokens de Lichess y Groq
    - Cómo usar la funcionalidad de análisis
    - Capturas de pantalla de interfaz
    - _Requisitos: Documentación usuario_

  
  - [~] 32.3 Actualizar README técnico del proyecto (opcional)
    - Arquitectura de componentes
    - Flujo de datos
    - Decisiones de diseño técnico
    - _Requisitos: Documentación técnica_

- [ ] 33. Pulir interfaz de usuario
  - [~] 33.1 Revisar y mejorar mensajes de usuario
    - Asegurar que todos los textos están en castellano
    - Verificar tono consistente (educativo, amigable)
    - Corregir errores ortográficos o gramaticales
    - _Requisitos: 0.1, 8.3, idioma.md_
  
  - [~] 33.2 Agregar animaciones y transiciones suaves
    - Fade-in para explicaciones
    - Transiciones de highlights en tableros
    - Animación de barra de progreso
    - _Requisitos: 13.4, UX general_
  
  - [~] 33.3 Asegurar estilos consistentes
    - Verificar que colores sigan paleta Lichess
    - Verificar espaciado y alineación
    - Verificar tipografía y tamaños de fuente
    - _Requisitos: 13, estilo-visual-tablero.md_

- [ ] 34. Verificar cumplimiento de requisitos
  - [~] 34.1 Revisar checklist de requisitos funcionales
    - Verificar que todos los 14 requisitos funcionales (0.1 a 13) estén implementados
    - Marcar requisitos como completados
    - Documentar cualquier desviación o limitación
    - _Requisitos: Todos_
  
  - [~] 34.2 Revisar cumplimiento de propiedades de corrección
    - Confirmar que las 8 propiedades están implementadas con fast-check
    - Confirmar que todas las pruebas de propiedades pasan
    - Documentar cobertura de testing
    - _Requisitos: Propiedades 1-8_
  
  - [~] 34.3 Verificar integración con APIs externas
    - Lichess API: autenticación, obtención de partidas
    - Groq API: generación de explicaciones
    - Stockfish.js: análisis de posiciones
    - _Requisitos: 1, 8, 4_


- [ ] 35. Preparación para entrega
  - [~] 35.1 Limpiar código
    - Eliminar console.log innecesarios (excepto en logger)
    - Eliminar código comentado obsoleto
    - Eliminar imports no utilizados
    - _Requisitos: Calidad de código_
  
  - [~] 35.2 Verificar configuración de build
    - Ejecutar `npm run build` y verificar que no hay errores
    - Verificar que archivos WASM se copian correctamente al build
    - Probar build en modo producción
    - _Requisitos: Deployment_
  
  - [~] 35.3 Checkpoint final de entrega
    - Confirmar que toda la funcionalidad está implementada
    - Confirmar que todos los tests pasan
    - Confirmar que no hay errores críticos
    - Preguntar al usuario si está listo para usar la funcionalidad

## Notas

### Tareas Opcionales Marcadas con *

Las tareas marcadas con `*` son sub-tareas opcionales de testing. Estas tareas se pueden omitir para un MVP más rápido, pero son altamente recomendadas para asegurar calidad y robustez del código.

**Tareas de testing opcionales:**
- Pruebas basadas en propiedades (PBT) con fast-check
- Pruebas de integración con mocks
- Pruebas de componentes UI
- Pruebas unitarias de casos específicos
- Pruebas E2E

### Referencias de Requisitos

Cada sub-tarea incluye referencias a los requisitos que valida, siguiendo el formato `_Requisitos: X.Y, Z.W_`. Esto permite trazabilidad completa desde requisitos hasta implementación.

### Propiedades de Corrección

El proyecto implementa 8 propiedades de corrección verificables mediante property-based testing (PBT):
1. Validación de credenciales vacías
2. Round-trip de almacenamiento de credenciales
3. Round-trip del parser PGN
4. Rechazo de PGN inválido
5. Detección y clasificación de errores por umbral
6. Estructura completa de objeto Error
7. Distinción de errores por turno
8. Filtrado de primeras 3 jugadas

Cada propiedad tiene sub-tareas específicas en las fases correspondientes.


### Checkpoints

Los checkpoints están distribuidos estratégicamente después de completar cada fase principal. Su propósito es:
- Validar que la fase actual funciona correctamente antes de avanzar
- Permitir al usuario dar feedback o solicitar ajustes
- Asegurar calidad incremental
- Prevenir acumulación de errores

### Lenguaje de Implementación

Este proyecto utiliza **TypeScript** como lenguaje de implementación, según lo definido en el diseño técnico. Todo el código debe seguir las convenciones de TypeScript estricto (strict: true).

### Integración con Librerías

**Librerías principales:**
- `chess.js`: Motor de ajedrez y parser PGN
- `react-chessboard`: Visualización de tableros
- `stockfish.js`: Motor de análisis WASM
- `fast-check`: Property-based testing

**APIs externas:**
- Lichess API (https://lichess.org/api)
- Groq API (https://api.groq.com)

### Estimación de Tiempo

**Tiempo estimado total:** 5 semanas

- Fase 1: Infraestructura Base (Semana 1)
- Fase 2: Integración Lichess (Semana 1-2)
- Fase 3: Parser PGN (Semana 2)
- Fase 4: Motor Stockfish (Semana 2-3)
- Fase 5: Detección de Errores (Semana 3)
- Fase 6: Explicaciones IA (Semana 3-4)
- Fase 7: Orquestador (Semana 4)
- Fase 8: Visualización (Semana 4)
- Fase 9: Resultados (Semana 4-5)
- Fase 10: Integración y Testing (Semana 5)
- Fase 11: Documentación (Semana 5)


## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.4"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.3", "3.1"]
    },
    {
      "id": 3,
      "tasks": ["3.2", "3.3", "5.1"]
    },
    {
      "id": 4,
      "tasks": ["5.2", "5.3", "5.4", "5.5", "6.1"]
    },
    {
      "id": 5,
      "tasks": ["5.6", "7.1"]
    },
    {
      "id": 6,
      "tasks": ["7.2", "7.3", "7.4"]
    },
    {
      "id": 7,
      "tasks": ["7.5", "7.6", "7.7"]
    },
    {
      "id": 8,
      "tasks": ["9.1", "9.2"]
    },
    {
      "id": 9,
      "tasks": ["9.3"]
    },
    {
      "id": 10,
      "tasks": ["9.4", "9.5", "9.6"]
    },
    {
      "id": 11,
      "tasks": ["9.7", "10.1"]
    },
    {
      "id": 12,
      "tasks": ["10.2", "10.3"]
    },
    {
      "id": 13,
      "tasks": ["10.4", "12.1"]
    },
    {
      "id": 14,
      "tasks": ["12.2", "12.3", "12.4", "12.5"]
    },
    {
      "id": 15,
      "tasks": ["12.6", "12.7", "12.8", "12.9", "12.10"]
    },
    {
      "id": 16,
      "tasks": ["14.1", "14.2", "14.3"]
    },
    {
      "id": 17,
      "tasks": ["14.4", "15.1"]
    },
    {
      "id": 18,
      "tasks": ["15.2", "15.3", "15.4", "15.5"]
    },
    {
      "id": 19,
      "tasks": ["17.1"]
    },
    {
      "id": 20,
      "tasks": ["17.2", "17.3", "17.4"]
    },
    {
      "id": 21,
      "tasks": ["17.5", "17.6", "17.7", "18.1"]
    },
    {
      "id": 22,
      "tasks": ["18.2", "18.3"]
    },
    {
      "id": 23,
      "tasks": ["20.1", "20.2", "20.3", "20.4"]
    },
    {
      "id": 24,
      "tasks": ["20.5", "20.6"]
    },
    {
      "id": 25,
      "tasks": ["21.1", "21.2", "21.3"]
    },
    {
      "id": 26,
      "tasks": ["21.4", "22.1"]
    },
    {
      "id": 27,
      "tasks": ["22.2", "22.3", "22.4"]
    },
    {
      "id": 28,
      "tasks": ["24.1", "24.2", "24.3"]
    },
    {
      "id": 29,
      "tasks": ["25.1", "25.2", "25.3"]
    },
    {
      "id": 30,
      "tasks": ["25.4"]
    },
    {
      "id": 31,
      "tasks": ["27.1", "27.2", "27.3"]
    },
    {
      "id": 32,
      "tasks": ["28.1", "28.2", "28.3"]
    },
    {
      "id": 33,
      "tasks": ["29.1", "29.2"]
    },
    {
      "id": 34,
      "tasks": ["30.1", "30.2", "30.3"]
    },
    {
      "id": 35,
      "tasks": ["32.1", "32.2", "32.3"]
    },
    {
      "id": 36,
      "tasks": ["33.1", "33.2", "33.3"]
    },
    {
      "id": 37,
      "tasks": ["34.1", "34.2", "34.3"]
    },
    {
      "id": 38,
      "tasks": ["35.1", "35.2", "35.3"]
    }
  ]
}
```
