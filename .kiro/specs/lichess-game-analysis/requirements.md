# Documento de Requisitos

## Introducción

La funcionalidad de Análisis de Partidas de Lichess permite a los usuarios analizar automáticamente su partida de ajedrez más reciente de Lichess para identificar errores y aprender de ellos. El sistema utiliza autenticación mediante API Token de Lichess para acceder a las partidas del usuario (incluyendo partidas privadas), descarga la última partida, analiza cada jugada usando Stockfish.js ejecutándose en el navegador, detecta errores significativos (jugadas que causaron pérdida sustancial de evaluación), y proporciona retroalimentación educativa a través de visualización dual de tableros de ajedrez y explicaciones textuales detalladas.

El sistema utiliza la API Fetch nativa del navegador para comunicarse con la API pública de Lichess, sin requerir servidores MCP intermediarios.

Las explicaciones de errores son generadas usando inteligencia artificial a través de Groq API con el modelo llama-3.1-8b-instant, proporcionando retroalimentación en lenguaje natural adaptada al nivel del jugador.

Esta funcionalidad capacita a los jugadores de ajedrez para mejorar comprendiendo dónde se equivocaron, qué deberían haber jugado, y qué amenazas o tácticas pasaron por alto.

## Glosario

- **API_Token**: Token de Acceso Personal generado por Lichess para autenticar solicitudes en nombre del usuario
- **Fetch_API**: API nativa del navegador utilizada para realizar peticiones HTTP a la API de Lichess. No se utiliza servidor MCP para las peticiones.
- **Groq_API_Client**: Cliente que se comunica con la API de Groq para generar explicaciones en lenguaje natural usando el modelo llama-3.1-8b-instant
- **Groq_API_Key**: Clave de API personal generada por Groq para autenticar solicitudes de generación de texto
- **Credentials_Manager**: Componente que gestiona el almacenamiento, recuperación y validación de credenciales de Lichess
- **Game_Analyzer**: El componente del sistema responsable de orquestar el flujo de trabajo completo de análisis
- **Lichess_API_Client**: El componente que obtiene datos de partidas desde la API de Lichess usando solicitudes autenticadas
- **PGN_Parser**: El componente que analiza el formato Portable Game Notation (PGN) en datos estructurados de partida
- **Stockfish_Engine**: El motor de ajedrez Stockfish.js/WASM ejecutándose en el navegador
- **Move_Evaluator**: El componente que usa Stockfish para evaluar cada posición de ajedrez
- **Error_Detector**: El componente que identifica jugadas donde ocurrió pérdida significativa de evaluación
- **Board_Visualizer**: El componente que renderiza tableros de ajedrez interactivos
- **Explanation_Generator**: El componente que genera explicaciones textuales educativas para los errores
- **PGN**: Portable Game Notation, un formato estándar para registrar partidas de ajedrez
- **FEN**: Forsyth-Edwards Notation, una notación estándar para describir una posición particular del tablero
- **Evaluation**: Una puntuación numérica que representa la ventaja de un bando (positivo = ventaja de blancas, negativo = ventaja de negras)
- **Centipawn**: La unidad de evaluación (1 centipawn = 0.01 peones)
- **Significant_Error**: Una jugada que causa una pérdida de evaluación de 100 centipawns o más
- **Best_Move**: La jugada mejor valorada recomendada por Stockfish para una posición dada
- **Analysis_Depth**: El número de plies (medio-movimientos) que Stockfish busca hacia adelante al evaluar
- **Lichess_Visual_Theme**: El conjunto de estilos visuales, colores de tablero y diseño de piezas característicos de Lichess.org, utilizado para proporcionar una experiencia visual consistente

## Requisitos

### Requisito 0.1: Configurar Credenciales de Lichess

**Historia de Usuario:** Como usuario, quiero ingresar mi nombre de usuario de Lichess y API Token, para que la aplicación pueda acceder a mis partidas (incluyendo las privadas).

#### Criterios de Aceptación

1. CUANDO la aplicación se inicia, EL System DEBERÁ verificar si existen las variables de entorno en .env.local
2. SI el archivo .env.local no existe O las variables VITE_LICHESS_USERNAME, VITE_LICHESS_API_TOKEN, VITE_GROQ_API_KEY están vacías, ENTONCES EL System DEBERÁ mostrar una pantalla de configuración inicial
3. LA pantalla de configuración DEBERÁ solicitar el nombre de usuario de Lichess del usuario
4. LA pantalla de configuración DEBERÁ solicitar el Token de API Personal de Lichess del usuario
5. LA pantalla de configuración DEBERÁ solicitar la API Key de Groq del usuario
6. EL System DEBERÁ proporcionar un enlace a la página de generación de tokens de Lichess (https://lichess.org/account/oauth/token)
7. EL System DEBERÁ proporcionar un enlace a la página de generación de API Keys de Groq (https://console.groq.com/keys)
8. SI todas las credenciales están configuradas en .env.local Y no están vacías, ENTONCES EL System DEBERÁ cargarlas automáticamente sin mostrar la pantalla de configuración
9. EL System DEBERÁ validar que todos los campos (username, token Lichess, API key Groq) no estén vacíos antes de guardar
10. EL System DEBERÁ permitir al usuario acceder a la pantalla de configuración desde el menú en cualquier momento para actualizar credenciales

### Requisito 0.2: Almacenar Credenciales de Forma Segura

**Historia de Usuario:** Como usuario, quiero que mis credenciales se almacenen de forma segura en mi navegador, para que no tenga que ingresarlas cada vez que uso la aplicación.

#### Criterios de Aceptación

1. CUANDO el usuario guarda sus credenciales, EL Credentials_Manager DEBERÁ almacenarlas en el localStorage del navegador
2. EL Credentials_Manager NO DEBERÁ enviar credenciales a ningún servidor externo (excepto la API de Lichess)
3. EL Credentials_Manager DEBERÁ proporcionar un botón "Limpiar Credenciales" en la configuración
4. CUANDO el usuario limpia las credenciales, EL Credentials_Manager DEBERÁ eliminarlas del localStorage y mostrar la pantalla de configuración nuevamente
5. EL Credentials_Manager DEBERÁ encriptar el API_Token antes de almacenarlo en localStorage (usando btoa() como mínimo)

### Requisito 0.3: Validar Token de API

**Historia de Usuario:** Como usuario, quiero saber si mi Token de API es válido, para que pueda detectar errores de configuración tempranamente.

#### Criterios de Aceptación

1. CUANDO el usuario guarda sus credenciales, EL Lichess_API_Client DEBERÁ realizar una petición de prueba a Lichess para validar el token
2. SI el token es inválido o está expirado, ENTONCES EL System DEBERÁ mostrar un mensaje de error descriptivo
3. SI el token es válido, ENTONCES EL System DEBERÁ mostrar un mensaje de éxito y proceder a la pantalla principal
4. LA validación DEBERÁ completarse dentro de 5 segundos

### Requisito 0.4: Configurar Credenciales de Groq API

**Historia de Usuario:** Como usuario, quiero ingresar mi API Key de Groq, para que la aplicación pueda generar explicaciones con IA de mis errores de ajedrez.

#### Criterios de Aceptación

1. LA pantalla de configuración inicial DEBERÁ solicitar la API Key de Groq además de las credenciales de Lichess
2. EL System DEBERÁ proporcionar un enlace a la página de generación de API Keys de Groq (https://console.groq.com/keys)
3. DONDE el usuario esté en modo desarrollo, EL System DEBERÁ cargar la API Key de Groq desde variables de entorno (.env.local)
4. DONDE el usuario esté en modo producción, EL System DEBERÁ solicitar la API Key mediante el formulario en la interfaz
5. EL System DEBERÁ validar que la API Key no esté vacía antes de guardar
6. EL Credentials_Manager DEBERÁ encriptar la API Key de Groq antes de almacenarla en localStorage
7. CUANDO el usuario inicia un análisis sin API Key de Groq configurada, EL System DEBERÁ mostrar una advertencia indicando que las explicaciones serán básicas

### Requisito 1: Obtener Última Partida de Lichess

**Historia de Usuario:** Como jugador de ajedrez, quiero que el sistema descargue automáticamente mi última partida de Lichess, para que pueda analizarla sin descargas manuales de archivos.

#### Criterios de Aceptación

1. CUANDO el usuario ha configurado las credenciales, EL Lichess_API_Client DEBERÁ obtener la partida más reciente usando el endpoint de API autenticado con el token Bearer
2. EL Lichess_API_Client DEBERÁ recuperar la partida en formato PGN
3. SI el nombre de usuario no existe, ENTONCES EL Lichess_API_Client DEBERÁ devolver un mensaje de error descriptivo que indique "Nombre de usuario no encontrado"
4. SI no existen partidas para el nombre de usuario, ENTONCES EL Lichess_API_Client DEBERÁ devolver un mensaje de error descriptivo que indique "No se encontraron partidas para este usuario"
5. SI la petición a la API falla por problemas de red, ENTONCES EL Lichess_API_Client DEBERÁ devolver un mensaje de error descriptivo que indique "Ocurrió un error de red"
6. EL Lichess_API_Client DEBERÁ completar la operación de obtención dentro de 10 segundos
7. EL Lichess_API_Client DEBERÁ incluir el encabezado "Authorization: Bearer {token}" en todas las peticiones
8. SI el API_Token es inválido o está expirado, ENTONCES EL System DEBERÁ mostrar un mensaje solicitando al usuario que actualice sus credenciales

### Requisito 2: Analizar Datos PGN

**Historia de Usuario:** Como desarrollador, quiero analizar archivos PGN en datos de partida estructurados, para que pueda procesar jugadas individuales para análisis.

#### Criterios de Aceptación

1. CUANDO se proporciona una cadena PGN válida, EL PGN_Parser DEBERÁ analizarla en un objeto Game estructurado que contenga jugadas, encabezados y metadatos
2. EL PGN_Parser DEBERÁ extraer la secuencia de jugadas en Notación Algebraica Estándar (SAN)
3. EL PGN_Parser DEBERÁ extraer metadatos de la partida incluyendo nombres de jugadores, resultado, fecha, control de tiempo y apertura
4. SI el formato PGN es inválido, ENTONCES EL PGN_Parser DEBERÁ devolver un mensaje de error descriptivo identificando el problema de sintaxis
5. EL PGN_Parser DEBERÁ soportar notación PGN estándar incluyendo números de jugada, anotaciones y comentarios

### Requisito 3: Inicializar Motor Stockfish

**Historia de Usuario:** Como sistema, quiero inicializar el motor Stockfish en el navegador, para que pueda analizar posiciones de ajedrez localmente sin peticiones al servidor.

#### Criterios de Aceptación

1. CUANDO el Game_Analyzer se inicia, EL Stockfish_Engine DEBERÁ cargar el módulo WASM de Stockfish.js
2. EL Stockfish_Engine DEBERÁ completar la inicialización dentro de 5 segundos
3. EL Stockfish_Engine DEBERÁ soportar comandos del protocolo UCI (Universal Chess Interface)
4. SI el motor falla al inicializar, ENTONCES EL Game_Analyzer DEBERÁ mostrar un mensaje de error indicando "Falló la carga del motor de ajedrez"
5. EL Stockfish_Engine DEBERÁ ejecutarse completamente en el navegador sin comunicación con servidores externos

### Requisito 4: Evaluar Posiciones de Ajedrez

**Historia de Usuario:** Como sistema de análisis, quiero evaluar cada posición en la partida, para que pueda medir la calidad de cada jugada.

#### Criterios de Aceptación

1. CUANDO se proporciona una posición de ajedrez en formato FEN, EL Move_Evaluator DEBERÁ calcular la evaluación usando Stockfish
2. EL Move_Evaluator DEBERÁ buscar a una profundidad de al menos 15 plies para cada posición
3. EL Move_Evaluator DEBERÁ devolver la evaluación en centipawns
4. EL Move_Evaluator DEBERÁ identificar la mejor jugada para la posición
5. EL Move_Evaluator DEBERÁ completar la evaluación de una posición individual dentro de 2 segundos
6. EL Move_Evaluator DEBERÁ evaluar posiciones secuencialmente para evitar problemas de rendimiento del navegador

### Requisito 5: Detectar Errores Significativos

**Historia de Usuario:** Como jugador de ajedrez, quiero que el sistema identifique dónde cometí errores significativos, para que pueda enfocar mi aprendizaje en momentos críticos.

#### Criterios de Aceptación

1. CUANDO se evalúa una jugada, EL Error_Detector DEBERÁ calcular el cambio de evaluación respecto a la posición anterior
2. SI la pérdida de evaluación es de 100 centipawns o más, ENTONCES EL Error_Detector DEBERÁ clasificar la jugada como un Significant_Error
3. EL Error_Detector DEBERÁ registrar la posición antes del error, la jugada realizada y la alternativa Best_Move
4. EL Error_Detector DEBERÁ distinguir entre errores de las blancas y errores de las negras
5. EL Error_Detector DEBERÁ ignorar las primeras 3 jugadas de la partida (teoría de apertura)
6. EL Error_Detector DEBERÁ almacenar todos los errores detectados en una lista estructurada

### Requisito 6: Visualizar Partida con Marcadores de Error

**Historia de Usuario:** Como jugador de ajedrez, quiero ver mi partida en un tablero de ajedrez con marcadores visuales mostrando dónde cometí errores, para que pueda identificar rápidamente posiciones problemáticas.

#### Criterios de Aceptación

1. EL Board_Visualizer DEBERÁ mostrar un tablero de ajedrez mostrando la posición actual de la partida
2. CUANDO ocurrió un error en una jugada específica, EL Board_Visualizer DEBERÁ resaltar la casilla desde donde se movió la pieza del error con un marcador rojo
3. EL Board_Visualizer DEBERÁ resaltar la casilla hacia donde se movió la pieza del error con un marcador rojo
4. EL Board_Visualizer DEBERÁ soportar navegación a través de la partida jugada por jugada usando controles de anterior y siguiente
5. CUANDO el usuario hace clic en una jugada en la lista de jugadas, EL Board_Visualizer DEBERÁ saltar a esa posición
6. EL Board_Visualizer DEBERÁ mostrar números de jugada junto a cada posición

### Requisito 7: Visualizar Alternativas de Mejor Jugada

**Historia de Usuario:** Como jugador de ajedrez, quiero ver qué debería haber jugado en lugar de mis errores, para que pueda aprender mejores jugadas.

#### Criterios de Aceptación

1. EL Board_Visualizer DEBERÁ mostrar un segundo tablero de ajedrez mostrando la posición antes de cada error
2. CUANDO se selecciona una posición de error, EL segundo Board_Visualizer DEBERÁ resaltar el Best_Move con un marcador verde
3. EL Board_Visualizer DEBERÁ mostrar la casilla de origen y la casilla de destino del Best_Move
4. EL Board_Visualizer DEBERÁ sincronizarse con la posición de error mostrada en el primer tablero
5. DONDE no hay error seleccionado, EL segundo Board_Visualizer DEBERÁ permanecer oculto o mostrar un mensaje de marcador de posición

### Requisito 8: Generar Explicaciones Educativas

**Historia de Usuario:** Como jugador de ajedrez, quiero recibir explicaciones generadas por IA de mis errores, para que pueda entender en lenguaje natural por qué fueron errores, qué amenazas no vi, y cómo mejorar.

#### Criterios de Aceptación

1. CUANDO se detecta un error, EL Explanation_Generator DEBERÁ enviar el contexto del error a Groq API usando el modelo llama-3.1-8b-instant
2. EL contexto enviado a Groq DEBERÁ incluir: la posición FEN antes del error, la jugada realizada, la mejor jugada alternativa, el cambio de evaluación en centipawns, y el turno del jugador
3. EL Explanation_Generator DEBERÁ solicitar a Groq una explicación concisa en castellano que contenga: qué se jugó, por qué fue un error, qué se debió jugar, qué amenazas/tácticas se pasaron por alto, y las consecuencias
4. LA explicación generada por Groq DEBERÁ ser concisa (máximo 150 palabras)
5. EL Explanation_Generator DEBERÁ proporcionar un botón "Profundizar explicación" para cada error
6. CUANDO el usuario hace clic en "Profundizar explicación", EL Explanation_Generator DEBERÁ solicitar a Groq una explicación extendida (máximo 300 palabras) con más detalles tácticos
7. EL Explanation_Generator DEBERÁ proporcionar un botón "Mostrar en tablero" que abra un tablero interactivo aparte mostrando la secuencia de la mejor jugada
8. EL tablero de explicación DEBERÁ permitir avanzar paso a paso la variante recomendada
9. SI la API de Groq falla o el token es inválido, ENTONCES EL Explanation_Generator DEBERÁ mostrar una explicación básica generada localmente
10. EL Explanation_Generator DEBERÁ permitir al usuario volver a la lista de errores sin perder el progreso del análisis

### Requisito 9: Mostrar Progreso del Análisis

**Historia de Usuario:** Como usuario, quiero ver el progreso del análisis, para que sepa que el sistema está funcionando y cuánto tiempo tomará.

#### Criterios de Aceptación

1. MIENTRAS el Game_Analyzer está procesando jugadas, EL Game_Analyzer DEBERÁ mostrar un indicador de progreso mostrando el porcentaje de completitud
2. EL Game_Analyzer DEBERÁ mostrar el número de jugada actual siendo analizada
3. EL Game_Analyzer DEBERÁ estimar el tiempo restante basado en el tiempo promedio de evaluación por jugada
4. CUANDO el análisis se completa, EL Game_Analyzer DEBERÁ mostrar un resumen mostrando el total de jugadas analizadas y el total de errores encontrados
5. SI el análisis se interrumpe, ENTONCES EL Game_Analyzer DEBERÁ permitir al usuario reanudar desde la última posición evaluada

### Requisito 10: Manejar Restricciones de Rendimiento del Navegador

**Historia de Usuario:** Como sistema ejecutándose en el navegador, quiero gestionar los recursos computacionales eficientemente, para que la interfaz de usuario permanezca responsiva durante el análisis.

#### Criterios de Aceptación

1. EL Move_Evaluator DEBERÁ procesar una posición a la vez para prevenir el bloqueo de la interfaz
2. EL Move_Evaluator DEBERÁ ceder el control al hilo principal del navegador cada 2 segundos para mantener la capacidad de respuesta de la interfaz
3. EL Game_Analyzer DEBERÁ proporcionar un botón de pausa para interrumpir análisis de larga duración
4. EL Game_Analyzer DEBERÁ proporcionar un botón de reanudar para continuar análisis interrumpidos
5. EL Stockfish_Engine DEBERÁ usar Web Workers para prevenir el bloqueo del hilo principal de JavaScript

### Requisito 11: Interfaz de Usuario Responsiva

**Historia de Usuario:** Como usuario móvil, quiero que la interfaz de análisis funcione en mi teléfono, para que pueda analizar partidas en cualquier dispositivo.

#### Criterios de Aceptación

1. EL Board_Visualizer DEBERÁ renderizar tableros de ajedrez que se adapten a tamaños de pantalla desde 320px hasta 1920px de ancho
2. CUANDO el ancho de la pantalla sea menor a 768px, EL Board_Visualizer DEBERÁ apilar los dos tableros verticalmente
3. CUANDO el ancho de la pantalla sea de 768px o mayor, EL Board_Visualizer DEBERÁ mostrar los dos tableros lado a lado
4. EL Game_Analyzer DEBERÁ usar controles amigables al tacto con un tamaño mínimo de objetivo táctil de 44x44 píxeles
5. EL Board_Visualizer DEBERÁ renderizar legiblemente en pantallas de alto DPI (retina)

### Requisito 12: Línea Base Sin Errores para Partidas Correctas

**Historia de Usuario:** Como jugador de ajedrez que jugó una partida sólida, quiero ver confirmación de que no se encontraron errores significativos, para que sepa que mi juego fue bueno.

#### Criterios de Aceptación

1. CUANDO el Error_Detector encuentra cero Significant_Errors, EL Game_Analyzer DEBERÁ mostrar un mensaje de felicitación
2. EL Game_Analyzer DEBERÁ mostrar la pérdida promedio de centipawns por jugada como métrica de rendimiento
3. DONDE la pérdida promedio de centipawns sea menor a 20, EL Game_Analyzer DEBERÁ mostrar una insignia de "Rendimiento Sólido"
4. EL Game_Analyzer DEBERÁ aún permitir navegación jugada por jugada incluso cuando no se detectan errores

### Requisito 13: Estilo Visual del Tablero de Lichess

**Historia de Usuario:** Como jugador de ajedrez familiarizado con Lichess, quiero que el tablero se vea y se comporte como el de Lichess, para que la experiencia sea consistente y reconocible.

#### Criterios de Aceptación

1. EL Board_Visualizer DEBERÁ seguir las especificaciones de estilo visual definidas en el documento de steering `estilo-visual-tablero.md`
2. EL Board_Visualizer DEBERÁ usar la librería `react-chessboard` configurada según las guías del steering
3. EL Board_Visualizer DEBERÁ renderizar las piezas usando SVG para escalado sin pérdida de calidad
4. EL Board_Visualizer DEBERÁ animar los movimientos de piezas con transiciones suaves
5. EL Board_Visualizer DEBERÁ mostrar highlights para el último movimiento, errores y mejores jugadas según el contexto

**REFERENCIA**: Ver `.kiro/steering/estilo-visual-tablero.md` para especificaciones detalladas de colores, piezas, coordenadas y animaciones.
