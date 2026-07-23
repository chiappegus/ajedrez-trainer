/**
 * Componente principal de la aplicación
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1.1, 0.1.8, 0.1.10, 0.2.3
 */

import { useState, useEffect } from 'react'
import { ConfiguracionCredenciales } from './components/configuracion/ConfiguracionCredenciales'
import { useCredenciales } from './hooks/useCredenciales'
import './App.css'

type Vista = 'configuracion' | 'principal';

function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('configuracion');
  const { credencialesExisten } = useCredenciales();

  // Determinar vista inicial basado en existencia de credenciales
  useEffect(() => {
    if (credencialesExisten !== null) {
      setVistaActual(credencialesExisten ? 'principal' : 'configuracion');
    }
  }, [credencialesExisten]);

  /**
   * Maneja el guardado exitoso de credenciales
   * Cambia a la vista principal
   */
  const handleGuardadoExitoso = () => {
    setVistaActual('principal');
  };

  /**
   * Maneja la navegación a configuración desde el menú
   */
  const handleIrAConfiguracion = () => {
    setVistaActual('configuracion');
  };

  /**
   * Maneja la acción de analizar partida
   * TODO: Implementar en fase posterior
   */
  const handleAnalizarPartida = () => {
    console.log('Analizando última partida...');
    // Esta funcionalidad se implementará en fases posteriores
  };

  return (
    <div className="app-container">
      {/* Vista de configuración */}
      {vistaActual === 'configuracion' && (
        <div className="vista-configuracion">
          <ConfiguracionCredenciales onGuardadoExitoso={handleGuardadoExitoso} />
        </div>
      )}

      {/* Vista principal */}
      {vistaActual === 'principal' && (
        <div className="vista-principal">
          {/* Header con botón de configuración */}
          <header className="app-header">
            <h1>Ajedrez Trainer</h1>
            <button 
              type="button"
              className="btn-configuracion"
              onClick={handleIrAConfiguracion}
              aria-label="Ir a configuración"
            >
              ⚙️ Configuración
            </button>
          </header>

          {/* Contenido principal */}
          <main className="contenido-principal">
            <div className="bienvenida">
              <h2>Bienvenido a Ajedrez Trainer</h2>
              <p>Analiza tu última partida de Lichess y descubre tus errores</p>
            </div>

            <div className="acciones-principales">
              <button
                type="button"
                className="btn-analizar"
                onClick={handleAnalizarPartida}
              >
                🔍 Analizar última partida
              </button>
              <p className="descripcion-accion">
                Obtendremos tu última partida de Lichess y la analizaremos con Stockfish
              </p>
            </div>

            <div className="info-estado">
              <p className="estado-credenciales">
                ✅ Credenciales configuradas correctamente
              </p>
            </div>
          </main>

          {/* Footer */}
          <footer className="app-footer">
            <p>Ajedrez Trainer - Mejora tu juego analizando tus errores</p>
          </footer>
        </div>
      )}
    </div>
  )
}

export default App
