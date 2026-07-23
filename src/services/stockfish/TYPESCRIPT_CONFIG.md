# Configuración de TypeScript para Web Workers

## Problema

El archivo `stockfish-worker.ts` es un Web Worker y requiere acceso a APIs específicas de workers como `importScripts` y el global scope `DedicatedWorkerGlobalScope`.

Por defecto, el `tsconfig.app.json` solo incluye `["ES2023", "DOM"]` en la propiedad `lib`, lo que no incluye las definiciones de Web Workers.

## Solución Implementada

Se han creado declaraciones de tipos personalizadas en `worker-types.d.ts` para proporcionar las definiciones necesarias:

```typescript
declare const self: DedicatedWorkerGlobalScope;
declare function importScripts(...urls: string[]): void;
```

Y el worker las referencia con:

```typescript
/// <reference path="./worker-types.d.ts" />
```

## Solución Alternativa (Recomendada para Producción)

Para una configuración más robusta, se recomienda:

### Opción 1: Modificar tsconfig.app.json

Añadir "WebWorker" a las libs:

```json
{
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "WebWorker"],
    // ... resto de configuración
  }
}
```

**Nota**: Esto puede causar conflictos de tipos si hay código que asume el contexto de window.

### Opción 2: Crear tsconfig específico para workers

Crear `tsconfig.worker.json`:

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "lib": ["ES2023", "WebWorker"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*.worker.ts", "src/**/worker-types.d.ts"]
}
```

Y actualizar `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.worker.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### Opción 3: Usar nomenclatura .worker.ts

Vite automáticamente reconoce archivos con sufijo `.worker.ts` y los trata de manera especial.

Renombrar `stockfish-worker.ts` a `stockfish.worker.ts` y Vite aplicará las configuraciones correctas automáticamente.

## Configuración Actual del Proyecto

El proyecto actualmente usa:
- `erasableSyntaxOnly: true` en tsconfig
- `moduleDetection: "force"`
- `verbatimModuleSyntax: true`

Estas opciones estrictas pueden requerir ajustes adicionales en la configuración de workers.

## Verificación

Para verificar que los tipos se resuelven correctamente:

```bash
npx tsc --noEmit --project tsconfig.json
```

O específicamente para el worker (con una configuración separada):

```bash
npx tsc --noEmit --project tsconfig.worker.json
```

## Referencias

- [TypeScript Handbook - Web Workers](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#-type-only-imports-and-export)
- [Vite - Web Workers](https://vitejs.dev/guide/features.html#web-workers)
- [MDN - Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
