# Configuración de Stockfish.js

## ✅ Instalación Completada

Stockfish.js ha sido instalado y configurado correctamente en el proyecto.

## Archivos Instalados

### Dependencia NPM
```json
"stockfish.js": "^10.0.2"
```

### Archivos en `public/`
- `stockfish.js` - Script principal del motor
- `stockfish.wasm` - Motor compilado a WebAssembly  
- `stockfish.wasm.js` - Loader del WASM

Estos archivos se sirven directamente desde la carpeta `public/` y son accesibles en `/stockfish.js`, `/stockfish.wasm`, etc.

## Configuración de Vite

El archivo `vite.config.ts` incluye:

```typescript
{
  // Servir archivos WASM correctamente
  assetsInclude: ['**/*.wasm'],
  
  // Excluir stockfish.js de la optimización
  optimizeDeps: {
    exclude: ['stockfish.js']
  },
  
  // Headers necesarios para SharedArrayBuffer
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
}
```

## Verificación

### Opción 1: Página de Test
Abre en el navegador (después de ejecutar `npm run dev`):
```
http://localhost:5173/test-stockfish.html
```

Esta página incluye:
- Inicialización del Web Worker
- Análisis de posición inicial
- Visualización de comandos UCI
- Salida en tiempo real

### Opción 2: Consola del Navegador
```javascript
// Crear worker
const worker = new Worker('/stockfish.js');

// Escuchar mensajes
worker.onmessage = (e) => console.log(e.data);

// Inicializar
worker.postMessage('uci');

// Analizar
worker.postMessage('position startpos');
worker.postMessage('go depth 10');
```

## Uso en el Código

Ver `src/services/stockfish/README.md` para ejemplos completos de uso.

La clase `MotorStockfish` en `src/services/stockfish/MotorStockfish.ts` proporciona una interfaz TypeScript de alto nivel.

## Requisitos Validados

Esta configuración valida los **Requisitos 3.1 y 3.5** del documento de requisitos:

- ✅ **3.1**: Motor Stockfish ejecutándose en el navegador mediante WASM
- ✅ **3.5**: Ejecución local sin comunicación con servidores externos

## Próximos Pasos

Las siguientes tareas implementarán:

1. **Tarea 9.2**: Implementar `MotorStockfish` con Web Worker
2. **Tarea 9.3**: Protocolo UCI completo
3. **Tarea 9.4**: Integración con `EvaluadorJugadas`

## Referencias

- **Documentación oficial**: https://github.com/nmrugg/stockfish.js
- **Protocolo UCI**: https://www.shredderchess.com/download/div/uci.zip
- **Diseño técnico**: `.kiro/specs/lichess-game-analysis/design.md` sección 2.3.3

## Troubleshooting

### Error: "SharedArrayBuffer is not defined"
**Solución**: Los headers CORS están configurados en `vite.config.ts`. Asegúrate de usar `npm run dev` para desarrollo local.

### Error: "Failed to load stockfish.wasm"
**Solución**: Verifica que los archivos estén en `public/`:
```bash
ls public/stockfish.*
```

Deberías ver:
```
public/stockfish.js
public/stockfish.wasm
public/stockfish.wasm.js
```

### Web Worker no responde
**Solución**: Verifica la consola del navegador. El worker puede tardar 1-2 segundos en inicializar la primera vez.

## Mantenimiento

Cuando se actualice `stockfish.js` en el futuro:

```bash
# Actualizar dependencia
npm update stockfish.js

# Re-copiar archivos WASM
npm run copy-stockfish
```

Considera agregar un script en `package.json`:
```json
{
  "scripts": {
    "copy-stockfish": "cp node_modules/stockfish.js/stockfish.* public/"
  }
}
```
