# Instalación de Stockfish.js

Este directorio debe contener los archivos de Stockfish.js para que el Web Worker funcione correctamente.

## Archivos Requeridos

Necesitas descargar los siguientes archivos:

1. `stockfish.js` - Script principal de Stockfish
2. `stockfish.wasm.js` - Motor WASM de Stockfish

## Opción 1: Descargar desde CDN

Descarga los archivos desde jsDelivr:

```bash
# Desde este directorio (public/stockfish/)
curl -O https://cdn.jsdelivr.net/npm/stockfish.js@11/stockfish.js
curl -O https://cdn.jsdelivr.net/npm/stockfish.js@11/stockfish.wasm.js
```

O manualmente desde:
- https://cdn.jsdelivr.net/npm/stockfish.js@11/stockfish.js
- https://cdn.jsdelivr.net/npm/stockfish.js@11/stockfish.wasm.js

## Opción 2: Clonar desde GitHub

```bash
# Clonar el repositorio
git clone https://github.com/nmrugg/stockfish.js.git temp-stockfish

# Copiar archivos necesarios
cp temp-stockfish/stockfish.js ./stockfish.js
cp temp-stockfish/stockfish.wasm.js ./stockfish.wasm.js

# Limpiar
rm -rf temp-stockfish
```

## Opción 3: Instalar vía npm (alternativa)

Si prefieres gestionar Stockfish como dependencia npm:

```bash
# En la raíz del proyecto
npm install stockfish.js

# Luego crear enlaces simbólicos o copiar:
cp node_modules/stockfish.js/stockfish.js public/stockfish/
cp node_modules/stockfish.js/stockfish.wasm.js public/stockfish/
```

## Verificación

Después de la instalación, la estructura debe ser:

```
public/
└── stockfish/
    ├── INSTALLATION.md  (este archivo)
    ├── stockfish.js
    └── stockfish.wasm.js
```

Verifica que los archivos existen:
```bash
ls -lh public/stockfish/
```

## Notas Importantes

1. **Tamaño**: Los archivos son grandes (~2-5 MB), esto es normal para un motor de ajedrez WASM
2. **Git**: Considera añadir `stockfish.js` y `stockfish.wasm.js` a `.gitignore` si no quieres versionarlos
3. **Licencia**: Stockfish está bajo licencia GPL v3
4. **Versión**: Se recomienda usar la versión 11 o superior

## Alternativa: CDN en Runtime

Si no quieres descargar los archivos, puedes modificar `stockfish-worker.ts` para cargar desde CDN:

```typescript
// En stockfish-worker.ts, cambiar:
importScripts('https://cdn.jsdelivr.net/npm/stockfish.js@11/stockfish.js');
```

**Nota**: Esto requiere conexión a internet y puede ser más lento en la carga inicial.

## Solución de Problemas

### Error: "Failed to load stockfish.js"

- Verifica que los archivos estén en `public/stockfish/`
- Confirma que el servidor de desarrollo está sirviendo la carpeta `public`
- Revisa la consola del navegador para ver la ruta exacta que está intentando cargar

### Error: "Stockfish no está inicializado"

- Asegúrate de llamar a `await motor.inicializar()` antes de usar el motor
- Verifica que la inicialización se completó exitosamente (sin errores en consola)

### Error: "Timeout inicializando Stockfish"

- Los archivos pueden estar corruptos, descárgalos nuevamente
- Verifica que tu navegador soporte WASM (todos los navegadores modernos lo soportan)
- Revisa la consola del navegador para ver errores de WASM

## Referencias

- Repositorio oficial: https://github.com/nmrugg/stockfish.js
- NPM package: https://www.npmjs.com/package/stockfish.js
- Stockfish engine: https://stockfishchess.org/
