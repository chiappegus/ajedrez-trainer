/**
 * Hook personalizado para gestión de credenciales
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1, 0.2
 */

import { useState, useEffect, useCallback } from 'react';
import { GestorCredenciales } from '../services/credenciales/GestorCredenciales';
import { Logger } from '../utils/logger';
import type { Credenciales } from '../types/credenciales';

/**
 * Hook para verificar y gestionar el estado de las credenciales
 * 
 * Prioridad de carga:
 * 1. localStorage (siempre tiene prioridad - es lo que el usuario configuró)
 * 2. .env.local (solo se usa como semilla inicial si localStorage está vacío)
 * 3. Si no hay en ningún lugar → muestra formulario de configuración
 * 
 * Una vez que el usuario guarda credenciales via el formulario web,
 * .env.local se ignora completamente.
 */
export function useCredenciales() {
  const [credencialesExisten, setCredencialesExisten] = useState<boolean | null>(null);
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
  const [gestorCredenciales] = useState(() => new GestorCredenciales());

  // Función para recargar credenciales (útil después de guardar nuevas)
  const recargarCredenciales = useCallback(() => {
    const creds = gestorCredenciales.cargarCredenciales();
    if (creds) {
      setCredenciales(creds);
      setCredencialesExisten(true);
      return true;
    }
    return false;
  }, [gestorCredenciales]);

  useEffect(() => {
    // 1. Intentar cargar de localStorage (SIEMPRE tiene prioridad)
    const credsLocalStorage = gestorCredenciales.cargarCredenciales();
    
    if (credsLocalStorage) {
      setCredenciales(credsLocalStorage);
      setCredencialesExisten(true);
      Logger.info('Credenciales cargadas desde localStorage');
      return;
    }
    
    // 2. Si NO hay en localStorage, intentar .env.local como semilla inicial
    const username = import.meta.env.VITE_LICHESS_USERNAME;
    const token = import.meta.env.VITE_LICHESS_API_TOKEN;
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (username && token && groqKey) {
      const credsFromEnv: Credenciales = {
        nombreUsuario: username,
        username: username,
        tokenLichess: token,
        apiKeyGroq: groqKey
      };
      
      // Validar formato antes de guardar
      const resultado = gestorCredenciales.validarCredenciales(credsFromEnv);
      if (resultado.válido) {
        gestorCredenciales.guardarCredenciales(credsFromEnv);
        setCredenciales(credsFromEnv);
        setCredencialesExisten(true);
        Logger.info('Credenciales cargadas desde .env.local y guardadas en localStorage');
      } else {
        // .env.local tiene datos mal formateados - no guardar, mostrar formulario
        Logger.info('Credenciales en .env.local inválidas - mostrando formulario');
        setCredencialesExisten(false);
      }
    } else {
      // No hay credenciales en ningún lugar
      setCredencialesExisten(false);
      Logger.info('No se encontraron credenciales - se mostrará formulario de configuración');
    }
  }, [gestorCredenciales]);

  return {
    credencialesExisten,
    credenciales,
    gestorCredenciales,
    recargarCredenciales
  };
}
