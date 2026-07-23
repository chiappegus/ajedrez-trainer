/**
 * Hook personalizado para gestión de credenciales
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1, 0.2
 */

import { useState, useEffect } from 'react';
import { GestorCredenciales } from '../services/credenciales/GestorCredenciales';

/**
 * Hook para verificar y gestionar el estado de las credenciales
 */
export function useCredenciales() {
  const [credencialesExisten, setCredencialesExisten] = useState<boolean | null>(null);
  const gestorCredenciales = new GestorCredenciales();

  useEffect(() => {
    const existenCredenciales = gestorCredenciales.verificarExistenciaConfiguracion();
    setCredencialesExisten(existenCredenciales);
  }, []);

  return {
    credencialesExisten,
    gestorCredenciales
  };
}
