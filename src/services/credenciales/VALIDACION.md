# Validación de Credenciales - Documentación

## Tarea 2.4: Implementar validación de credenciales

### Estado: ✅ COMPLETADO

### Implementación

La función `validarCredenciales()` está implementada en `GestorCredenciales.ts` y cumple con todos los requisitos especificados:

#### Validaciones Implementadas

1. **Campos no vacíos** (Requisito 0.1.9, 0.3.2)
   - ✅ Valida que `nombreUsuario` no esté vacío ni sea solo espacios en blanco
   - ✅ Valida que `tokenLichess` no esté vacío ni sea solo espacios en blanco
   - ✅ Valida que `apiKeyGroq` no esté vacío ni sea solo espacios en blanco

2. **Formato de username** (Requisito 0.3.2)
   - ✅ Valida que contenga solo caracteres alfanuméricos, guiones y guiones bajos
   - ✅ Regex utilizado: `/^[a-zA-Z0-9_-]+$/`
   - ✅ Rechaza caracteres especiales como @, #, %, etc.

3. **Formato de token Lichess** (Requisito 0.3.2)
   - ✅ Valida que el token empiece con "lip_"
   - ✅ Mensaje descriptivo si falla: "El token de Lichess debe empezar con 'lip_'. Verifica que lo hayas copiado correctamente."

4. **Resultado con mensaje descriptivo**
   - ✅ Retorna `ResultadoValidación` con campo `válido` booleano
   - ✅ Retorna mensaje de error descriptivo en el campo `error` cuando la validación falla
   - ✅ Cada tipo de error tiene su propio mensaje claro y específico

### Mensajes de Error Implementados

```typescript
'Las credenciales no pueden estar vacías'
'El nombre de usuario es requerido'
'El token de Lichess es requerido'
'La API Key de Groq es requerida'
'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'
'El token de Lichess debe empezar con "lip_". Verifica que lo hayas copiado correctamente.'
```

### Cobertura de Tests

**16 tests unitarios** que verifican:

#### Validación de Credenciales (9 tests)
- ✅ Aceptar credenciales válidas con token que empiece con lip_
- ✅ Rechazar credenciales con nombre de usuario vacío
- ✅ Rechazar credenciales con nombre de usuario solo espacios
- ✅ Rechazar credenciales con token Lichess vacío
- ✅ Rechazar credenciales con API Key Groq vacía
- ✅ Rechazar username con caracteres especiales inválidos
- ✅ Aceptar username con guiones y guiones bajos
- ✅ Rechazar token Lichess que no empiece con lip_
- ✅ Rechazar credenciales null

#### Round-trip y Encriptación (4 tests)
- ✅ Guardar y cargar credenciales correctamente (round-trip)
- ✅ Encriptar los tokens al guardar
- ✅ Rechazar guardar credenciales inválidas
- ✅ Retornar null cuando no hay credenciales almacenadas

#### Gestión de Credenciales (3 tests)
- ✅ Eliminar credenciales de localStorage
- ✅ Verificar existencia de configuración (false cuando no hay)
- ✅ Verificar existencia de configuración (true cuando existen)

### Integración con el Sistema

La función `validarCredenciales()` se utiliza automáticamente en:

1. **`guardarCredenciales()`**: Valida antes de guardar, lanzando error si las credenciales son inválidas
2. **Componente ConfiguraciónCredenciales**: Usa la validación para proporcionar feedback al usuario

### Requisitos Validados

- ✅ **Requisito 0.1.9**: Validar que todos los campos no estén vacíos antes de guardar
- ✅ **Requisito 0.3.2**: Validar formato de username (alfanumérico, guiones, guiones bajos) y token Lichess (lip_)

### Ejemplo de Uso

```typescript
const gestor = new GestorCredenciales();

const credenciales: Credenciales = {
  nombreUsuario: 'usuario_123',
  tokenLichess: 'lip_abc123def456',
  apiKeyGroq: 'gsk_xyz789'
};

const resultado = gestor.validarCredenciales(credenciales);

if (resultado.válido) {
  // Proceder a guardar
  gestor.guardarCredenciales(credenciales);
} else {
  // Mostrar error al usuario
  console.error(resultado.error);
}
```

### Ejecución de Tests

```bash
npm test -- GestorCredenciales.test.ts --run
```

**Resultado**: ✅ 16/16 tests pasando

### Conclusión

La implementación de validación de credenciales está completa y cumple con todos los requisitos especificados en la tarea 2.4. La función proporciona validación robusta con mensajes de error descriptivos en español, y está completamente cubierta por tests unitarios.
