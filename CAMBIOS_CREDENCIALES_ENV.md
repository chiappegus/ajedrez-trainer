# Cambios en el Sistema de Credenciales - Carga Automática desde .env.local

## 📋 Resumen

Se ha modificado el sistema de credenciales para que lea automáticamente las credenciales desde el archivo `.env.local` y solo muestre el formulario de configuración si no están definidas.

## 🔧 Archivos Modificados

### 1. `src/hooks/useCredenciales.ts`

**Cambios realizados:**
- ✅ Agregado import de `Logger` para registrar eventos
- ✅ Implementada lógica de carga jerárquica:
  1. Primero intenta cargar de `localStorage`
  2. Si no hay en localStorage, lee de variables de entorno `VITE_*`
  3. Si carga desde `.env.local`, guarda automáticamente en localStorage
  4. Solo muestra formulario si no hay credenciales en ningún lugar
- ✅ Agregados mensajes de log para debugging

**Jerarquía de carga:**
```
localStorage → .env.local → Formulario
```

### 2. `src/services/credenciales/GestorCredenciales.ts`

**Cambios realizados:**
- ✅ Corregido el método `cargarCredenciales()` para incluir el campo `username` (alias de `nombreUsuario`)
- Esto asegura compatibilidad con la interfaz `Credenciales`

## 📝 Variables de Entorno Requeridas

El archivo `.env.local` debe contener:

```env
VITE_LICHESS_USERNAME=Gustavoch
VITE_LICHESS_API_TOKEN=lip_0fcQKWnNiPEAQ09U7L2P
VITE_GROQ_API_KEY=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
```

**⚠️ IMPORTANTE:** El archivo `.env.local` está en `.gitignore` y NO debe subirse a git por contener credenciales sensibles.

## 🚀 Flujo de Funcionamiento

### Primer Uso (sin localStorage)

1. Usuario inicia la aplicación
2. `useCredenciales` se ejecuta en `useEffect`
3. No encuentra credenciales en localStorage
4. Lee variables de entorno `VITE_*`
5. Crea objeto `Credenciales` con los valores
6. Guarda automáticamente en localStorage
7. Establece `credencialesExisten = true`
8. App.tsx navega directamente a vista 'principal'

### Usos Subsecuentes

1. Usuario inicia la aplicación
2. `useCredenciales` encuentra credenciales en localStorage
3. Las carga y establece `credencialesExisten = true`
4. App.tsx navega directamente a vista 'principal'

### Sin Credenciales

1. No hay credenciales en localStorage
2. No hay variables de entorno definidas
3. `credencialesExisten = false`
4. App.tsx muestra vista 'configuracion' con formulario

## 🧪 Cómo Verificar la Implementación

### Opción 1: Usando el archivo de test HTML

1. Navega a: `http://localhost:5173/test-env-credentials.html`
2. Haz clic en "Verificar .env.local" - debe mostrar ✅ para todas las variables
3. Haz clic en "Limpiar localStorage"
4. Recarga la página
5. Haz clic en "Verificar Credenciales en localStorage" - debe mostrar las credenciales cargadas
6. Haz clic en "Ir a la Aplicación" - debe ir directo a pantalla principal

### Opción 2: Prueba manual en la aplicación

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Ejecuta: `localStorage.clear()`
4. Recarga la página (F5)
5. Deberías ver en Console:
   ```
   [INFO] Credenciales cargadas desde .env.local y guardadas en localStorage
   ```
6. La app debe ir directamente a la pantalla principal
7. El botón "Analizar última partida" debe funcionar correctamente

### Opción 3: Verificación en localStorage

Abre DevTools → Application → Local Storage → localhost:5173

Deberías ver:
```json
{
  "ajedrez_trainer_credenciales_v1": {
    "version": 1,
    "nombreUsuario": "Gustavoch",
    "tokenLichessEncriptado": "...",
    "apiKeyGroqEncriptada": "...",
    "fechaAlmacenamiento": 1234567890
  }
}
```

## ✅ Checklist de Verificación

- [ ] Las credenciales se cargan automáticamente desde `.env.local`
- [ ] Se guardan en localStorage la primera vez
- [ ] No se muestra el formulario de configuración
- [ ] La app va directamente a pantalla principal
- [ ] El botón "Analizar" funciona correctamente
- [ ] Los logs aparecen en la consola indicando la fuente de carga
- [ ] Si se borran las credenciales de localStorage y se recarga, se vuelven a cargar desde `.env.local`
- [ ] Si se elimina `.env.local` y se borra localStorage, se muestra el formulario

## 🔍 Debugging

Si algo no funciona, verifica:

1. **Variables de entorno no se cargan:**
   - Asegúrate de que el archivo se llama exactamente `.env.local` (no `.env`)
   - Las variables deben empezar con `VITE_` para que Vite las exponga
   - Reinicia el servidor de desarrollo después de modificar `.env.local`

2. **Credenciales no se guardan:**
   - Abre DevTools y busca errores en Console
   - Verifica que `GestorCredenciales.guardarCredenciales()` no lance excepciones
   - Revisa que las credenciales pasen la validación (token debe empezar con "lip_")

3. **Formulario se muestra siempre:**
   - Verifica que `credencialesExisten` sea `true` en React DevTools
   - Revisa los logs en Console para ver de dónde se intentó cargar
   - Asegúrate de que `App.tsx` esté usando el estado correctamente

## 📊 Logs Esperados

Al iniciar la aplicación con `.env.local` configurado y localStorage vacío:

```
[INFO] Credenciales cargadas desde .env.local y guardadas en localStorage
```

Al iniciar con credenciales ya en localStorage:

```
[INFO] Credenciales cargadas desde localStorage
```

Sin credenciales en ningún lugar:

```
[INFO] No se encontraron credenciales - se mostrará formulario de configuración
```

## 🎯 Comportamiento Esperado

### ✅ Caso Exitoso

1. Usuario inicia la app
2. NO ve formulario de configuración
3. Ve directamente la pantalla principal con:
   - Título "Ajedrez Trainer"
   - Botón "🔍 Analizar última partida"
   - Mensaje "✅ Credenciales configuradas correctamente"
4. Click en "Analizar" inicia el análisis correctamente

### ❌ Si Falla

- Si aparece el formulario, las credenciales NO se cargaron correctamente
- Sigue los pasos de debugging arriba
- Verifica los logs en Console

## 🔐 Seguridad

- ✅ `.env.local` está en `.gitignore` - no se sube al repositorio
- ✅ Las credenciales se encriptan en localStorage usando Base64
- ✅ Los logs NO muestran tokens completos, solo mensajes informativos
- ⚠️ Base64 NO es encriptación segura - es solo ofuscación básica
- 💡 Para producción, considerar usar Web Crypto API

## 📝 Notas Adicionales

- Una vez cargadas desde `.env.local`, las credenciales persisten en localStorage
- El usuario puede actualizar credenciales usando el botón "⚙️ Configuración"
- Si se modifican variables en `.env.local` después de la primera carga, hay que:
  1. Borrar localStorage: `localStorage.clear()`
  2. Recargar la página
  3. O usar el botón Configuración para actualizarlas manualmente

## 🎓 Para Desarrollo

Si estás desarrollando y quieres probar sin credenciales:

1. Renombra `.env.local` a `.env.local.backup`
2. Limpia localStorage: `localStorage.clear()`
3. Recarga la página
4. Deberías ver el formulario de configuración

Para restaurar:

1. Renombra `.env.local.backup` a `.env.local`
2. Limpia localStorage
3. Recarga la página
