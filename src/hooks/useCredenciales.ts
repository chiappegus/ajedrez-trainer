/**
 * Hook personalizado para gestión de credenciales
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1, 0.2
 */

import { useState, useEffect } from 'react';
import { GestorCredenciales } from '../services/credenciales/GestorCredenciales';
import { Logger } from '../utils/logger';
import type { Credenciales } from '../types/credenciales';

/**
 * Hook para verificar y gestionar el estado de las credenciales
 * 
 * Jerarquía de carga de credenciales:
 * 1. Primero intenta cargar desde localStorage
 * 2. Si no hay en localStorage, intenta leer desde .env.local (variables VITE_*)
 * 3. Si carga desde .env.local, las guarda automáticamente en localStorage
 * 4. Si no hay credenciales en ningún lugar, muestra el formulario
 */
export function useCredenciales() {
  const [credencialesExisten, setCredencialesExisten] = useState<boolean | null>(null);
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
  const gestorCredenciales = new GestorCredenciales();

  useEffect(() => {
    // Primero intentar cargar de localStorage
    const existenEnLocalStorage = gestorCredenciales.verificarExistenciaConfiguracion();
    
    if (existenEnLocalStorage) {
      const creds = gestorCredenciales.cargarCredenciales();
      if (creds) {
        setCredenciales(creds);
        setCredencialesExisten(true);
        Logger.info('Credenciales cargadas desde localStorage');
        return;
      }
    }
    
    // Si no hay en localStorage, intentar leer de .env.local
    const username = import.meta.env.VITE_LICHESS_USERNAME;
    const token = import.meta.env.VITE_LICHESS_API_TOKEN;
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (username && token && groqKey) {
      // Crear credenciales desde variables de entorno
      const credsFromEnv: Credenciales = {
        nombreUsuario: username,
        username: username,
        tokenLichess: token,
        apiKeyGroq: groqKey
      };
      
      // Guardar en localStorage para uso futuro
      gestorCredenciales.guardarCredenciales(credsFromEnv);
      setCredenciales(credsFromEnv);
      setCredencialesExisten(true);
      Logger.info('Credenciales cargadas desde .env.local y guardadas en localStorage');
    } else {
      // No hay credenciales en ningún lugar, mostrar formulario
      setCredencialesExisten(false);
      Logger.info('No se encontraron credenciales - se mostrará formulario de configuración');
    }
  }, []);

  return {
    credencialesExisten,
    credenciales,
    gestorCredenciales
  };
}
