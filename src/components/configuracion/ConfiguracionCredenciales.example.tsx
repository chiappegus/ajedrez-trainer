/**
 * Ejemplo de uso del componente ConfiguracionCredenciales
 * Feature: lichess-game-analysis
 */

import { useState } from 'react';
import { ConfiguracionCredenciales } from './ConfiguracionCredenciales';
import { GestorCredenciales } from '../../services/credenciales/GestorCredenciales';

/**
 * Ejemplo básico: Componente de configuración standalone
 */
export function EjemploBasico() {
  return (
    <div style={{ padding: '20px' }}>
      <ConfiguracionCredenciales />
    </div>
  );
}

/**
 * Ejemplo avanzado: Pantalla de configuración inicial con navegación
 * 
 * Este ejemplo muestra cómo usar el componente en una aplicación real,
 * verificando si existen credenciales al inicio y mostrando la configuración
 * solo cuando es necesario.
 */
export function EjemploConNavegacion() {
  const gestorCredenciales = new GestorCredenciales();
  const [mostrarConfig, setMostrarConfig] = useState(!gestorCredenciales.verificarExistenciaConfiguracion());

  const handleGuardadoExitoso = () => {
    setMostrarConfig(false);
    console.log('Credenciales guardadas, redirigiendo a la aplicación principal...');
    // Aquí puedes redirigir al usuario a la pantalla principal
  };

  if (mostrarConfig) {
    return (
      <div>
        <header style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h1>Ajedrez Trainer</h1>
          <p>Bienvenido, configura tus credenciales para comenzar</p>
        </header>
        <ConfiguracionCredenciales onGuardadoExitoso={handleGuardadoExitoso} />
      </div>
    );
  }

  return (
    <div>
      <h1>Aplicación Principal</h1>
      <p>Las credenciales están configuradas.</p>
      <button onClick={() => setMostrarConfig(true)}>
        Actualizar credenciales
      </button>
    </div>
  );
}

/**
 * Ejemplo: Integración en App.tsx
 * 
 * Este es un ejemplo de cómo integrar el componente en el archivo principal App.tsx:
 * Ver el código de ejemplo en la función EjemploConNavegacion arriba.
 */
