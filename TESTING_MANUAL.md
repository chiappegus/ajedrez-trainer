# Guía de Pruebas Manuales - Tareas 3.2 y 3.3

## Funcionalidad Implementada

Se ha implementado el flujo de navegación principal de la aplicación que incluye:

1. **Verificación de credenciales al inicio**: La aplicación verifica automáticamente si existen credenciales almacenadas en localStorage al iniciar
2. **Vista de configuración inicial**: Si no hay credenciales, muestra el formulario de ConfiguraciónCredenciales
3. **Vista principal**: Si existen credenciales, muestra la pantalla principal con el botón "Analizar última partida"
4. **Navegación a configuración**: Botón en el header para acceder a la configuración desde la vista principal

## Pruebas Manuales

### Caso 1: Primera Ejecución (Sin Credenciales)

**Pasos:**
1. Limpiar localStorage del navegador (F12 > Application > Local Storage > Clear All)
2. Ejecutar `npm run dev`
3. Abrir http://localhost:5173 en el navegador

**Resultado Esperado:**
- Debe mostrarse el formulario de "Configuración de Credenciales"
- Debe verse el título "Configuración de Credenciales"
- Deben verse tres campos: nombre de usuario, token Lichess, API key Groq
- Deben verse enlaces a las páginas de generación de tokens

### Caso 2: Guardar Credenciales y Navegar a Principal

**Pasos:**
1. Desde la vista de configuración del Caso 1
2. Ingresar credenciales válidas:
   - Nombre de usuario: `testuser`
   - Token Lichess: `lip_test123456789`
   - API Key Groq: `gsk_test123456789`
3. Hacer clic en "Guardar credenciales"

**Resultado Esperado:**
- Debe mostrarse mensaje de éxito
- Después de 1 segundo, debe navegar automáticamente a la vista principal
- Debe mostrarse el título "Bienvenido a Ajedrez Trainer"
- Debe mostrarse el botón "🔍 Analizar última partida"
- Debe mostrarse el mensaje "✅ Credenciales configuradas correctamente"

### Caso 3: Vista Principal (Con Credenciales Almacenadas)

**Pasos:**
1. Con credenciales ya guardadas del Caso 2
2. Recargar la página (F5)

**Resultado Esperado:**
- Debe saltar directamente a la vista principal (sin mostrar configuración)
- Debe mostrarse el header con "Ajedrez Trainer"
- Debe mostrarse el botón "⚙️ Configuración" en el header
- Debe mostrarse el título "Bienvenido a Ajedrez Trainer"
- Debe mostrarse el botón "🔍 Analizar última partida"

### Caso 4: Navegación a Configuración desde Menú

**Pasos:**
1. Desde la vista principal del Caso 3
2. Hacer clic en el botón "⚙️ Configuración" en el header

**Resultado Esperado:**
- Debe navegar a la vista de configuración
- Debe mostrarse el formulario de "Configuración de Credenciales"
- Los campos del formulario estarán vacíos (no se pre-rellenan con las credenciales existentes)

### Caso 5: Botón Analizar Partida

**Pasos:**
1. Desde la vista principal
2. Hacer clic en el botón "🔍 Analizar última partida"

**Resultado Esperado:**
- Por ahora, debe mostrar un mensaje en la consola: "Analizando última partida..."
- La funcionalidad completa se implementará en fases posteriores

### Caso 6: Responsive Design

**Pasos:**
1. Con la aplicación abierta en la vista principal
2. Redimensionar la ventana del navegador a diferentes tamaños:
   - Escritorio (>768px)
   - Tablet (640-768px)
   - Móvil (<640px)

**Resultado Esperado:**
- En móvil (<768px):
  - El header debe mostrar el título y botón de configuración en columna
  - Los tamaños de fuente deben reducirse
  - El botón "Analizar" debe ajustarse al ancho de la pantalla
- En escritorio:
  - El header debe mostrar título y botón lado a lado
  - El contenido debe estar centrado con espaciado adecuado

## Verificación de Integración

### Verificar localStorage

Después de guardar credenciales, verificar en las DevTools del navegador:

1. Abrir DevTools (F12)
2. Ir a Application > Local Storage
3. Buscar la clave `ajedrez_trainer_credenciales_v1`
4. Verificar que contiene un objeto JSON con:
   - `version`: 1
   - `nombreUsuario`: el nombre ingresado
   - `tokenLichessEncriptado`: token encriptado en Base64
   - `apiKeyGroqEncriptada`: API key encriptada en Base64
   - `fechaAlmacenamiento`: timestamp

## Arquitectura Implementada

### Componentes
- **App.tsx**: Componente principal que maneja la navegación entre vistas
- **ConfiguracionCredenciales.tsx**: Formulario de configuración de credenciales

### Hooks Personalizados
- **useCredenciales.ts**: Hook que verifica la existencia de credenciales al inicio

### Servicios
- **GestorCredenciales.ts**: Gestiona almacenamiento y validación de credenciales (ya existía)

### Flujo de Datos
```
App.tsx
  └─> useCredenciales hook
       └─> GestorCredenciales.verificarExistenciaConfiguracion()
            └─> localStorage
  
  └─> Vista actual basada en credencialesExisten
       ├─> 'configuracion' → ConfiguracionCredenciales
       └─> 'principal' → Pantalla principal con botón analizar
```

## Requisitos Validados

- ✅ **0.1.1**: Verificación de variables de entorno/credenciales al inicio
- ✅ **0.1.8**: Si credenciales existen, cargarlas automáticamente
- ✅ **0.1.10**: Permitir acceso a configuración desde menú
- ✅ **0.2.3**: Botón "Limpiar Credenciales" disponible en configuración

## Notas de Implementación

1. **Estado de carga**: El hook `useCredenciales` retorna `null` inicialmente mientras verifica, luego `true` o `false`
2. **Navegación automática**: Después de guardar credenciales exitosamente, hay un delay de 1 segundo antes de navegar
3. **TODO**: El botón "Analizar última partida" es un placeholder - la funcionalidad se implementará en fases posteriores
4. **Estilos**: Se reutilizan las variables CSS del tema base de Vite para mantener consistencia visual
