/**
 * Declaraciones de tipos para el Web Worker de Stockfish
 * Estas declaraciones permiten que TypeScript compile el worker correctamente
 */

// Declarar self como DedicatedWorkerGlobalScope
declare const self: DedicatedWorkerGlobalScope;

// Función importScripts disponible en workers
declare function importScripts(...urls: string[]): void;

export {};
