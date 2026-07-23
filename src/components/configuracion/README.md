# Componente ConfiguracionCredenciales

**Feature:** lichess-game-analysis  
**Valida:** Requisitos 0.1.2, 0.1.3, 0.1.4, 0.1.5, 0.1.6, 0.1.7, 0.4.1, 0.4.2

## Descripción

Componente React que proporciona un formulario completo para configurar las credenciales necesarias para acceder a la API de Lichess y Groq:

- **Nombre de usuario de Lichess**: Identificador del usuario en Lichess.org
- **Token de API Personal de Lichess**: Token de autenticación que debe empezar con `lip_`
- **API Key de Groq**: Clave de API para generar explicaciones con IA

## Características

✅ Validación de campos en tiempo real  
✅ Mensajes de error descriptivos  
✅ Enlaces directos a páginas de generación de tokens  
✅ Almacenamiento seguro con encriptación Base64  
✅ Botón para limpiar credenciales almacenadas  
✅ Feedback visual de éxito/error  
✅ Deshabilita botones mientras procesa  
✅ Todo en castellano  

## Uso

### Importación

```typescript
import { ConfiguracionCredenciales } from './components/configuracion';
```

### Ejemplo básico

```tsx
<ConfiguracionCredenciales />
```

### Con callback de éxito

```tsx
<ConfiguracionCredenciales 
  onGuardadoExitoso={() => {
    console.log('Credenciales guardadas exitosamente');
    // Redirigir a la pantalla principal
  }}
/>
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `onGuardadoExitoso` | `() => void` | No | Callback llamado cuando las credenciales se guardan exitosamente |

## Archivos del módulo

- `ConfiguracionCredenciales.tsx` - Componente principal
- `ConfiguracionCredenciales.css` - Estilos del componente
- `ConfiguracionCredenciales.test.tsx` - Tests unitarios (7 tests)
- `ConfiguracionCredenciales.example.tsx` - Ejemplos de uso
- `index.ts` - Exportaciones del módulo
- `README.md` - Esta documentación

## Tests

El componente incluye 7 tests unitarios que cubren:

1. ✅ Renderizado del formulario con todos los campos
2. ✅ Enlaces a páginas de generación de tokens
3. ✅ Estado de guardando mientras procesa
4. ✅ Mensajes de error cuando la validación falla
5. ✅ Mensajes de éxito cuando se guardan las credenciales
6. ✅ Limpieza de credenciales almacenadas
7. ✅ Callback onGuardadoExitoso

### Ejecutar tests

```bash
npm test -- ConfiguracionCredenciales.test.tsx
```

## Integración con GestorCredenciales

El componente utiliza el servicio `GestorCredenciales` para:

- Validar las credenciales antes de guardarlas
- Almacenarlas en localStorage con encriptación
- Limpiar credenciales cuando el usuario lo solicita

## Requisitos validados

### Requisito 0.1.2
✅ La pantalla de configuración solicita el nombre de usuario de Lichess

### Requisito 0.1.3
✅ La pantalla de configuración solicita el Token de API Personal de Lichess

### Requisito 0.1.4
✅ La pantalla de configuración solicita la API Key de Groq

### Requisito 0.1.5
✅ Proporciona un enlace a la página de generación de tokens de Lichess

### Requisito 0.1.6
✅ Proporciona un enlace a la página de generación de API Keys de Groq

### Requisito 0.1.7
✅ Valida que todos los campos no estén vacíos antes de guardar

### Requisito 0.4.1
✅ Solicita la API Key de Groq además de las credenciales de Lichess

### Requisito 0.4.2
✅ Proporciona un enlace a la página de generación de API Keys de Groq

## Notas técnicas

- **Encriptación**: Las credenciales se encriptan usando Base64 (btoa/atob) antes de almacenarlas en localStorage
- **Accesibilidad**: Incluye labels, roles ARIA y mensajes de estado
- **Responsive**: Se adapta a pantallas móviles
- **Tema oscuro**: Soporta modo oscuro automáticamente
