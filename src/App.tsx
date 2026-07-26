/**
 * Componente principal de la aplicación
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1.1, 0.1.8, 0.1.10, 0.2.3, 9.1, 9.2, 12.4
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { ConfiguracionCredenciales } from './components/configuracion/ConfiguracionCredenciales'
import { IndicadorProgreso } from './components/progreso/IndicadorProgreso'
import { ContenedorTablerosDuales } from './components/tablero/ContenedorTablerosDuales'
import { PanelExplicaciones } from './components/explicaciones/PanelExplicaciones'
import { ResumenAnálisis } from './components/resumen/ResumenAnálisis'
import { SelectorAnalisis } from './components/analisis/SelectorAnalisis'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useCredenciales } from './hooks/useCredenciales'
import { useAnalisis } from './hooks/useAnalisis'
import { useStockfish } from './hooks/useStockfish'
import { Logger } from './utils/logger'
import { obtenerMensajeUsuario } from './utils/errores'
import type { ErrorAjedrezTrainer } from './utils/errores'
import type { ResultadoAnálisis } from './types/evaluacion'
import type { ErrorDetectado, ProgresoAnálisis } from './types/error'
import type { OpcionesAnalisis } from './components/analisis/SelectorAnalisis'
import './App.css'

// Lazy imports para optimización
import type { AnalizadorPartida } from './services/analisis/AnalizadorPartida'

type Vista = 'configuracion' | 'principal' | 'analizando' | 'resultados';

function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('configuracion');
  const { credencialesExisten, credenciales, recargarCredenciales } = useCredenciales();
  const { cargando: cargandoStockfish, inicializarMotor, error: errorStockfish } = useStockfish();
  
  // Estado del análisis
  const [analizador, setAnalizador] = useState<AnalizadorPartida | null>(null);
  const [resultado, setResultado] = useState<ResultadoAnálisis | null>(null);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);
  
  // Estado de visualización
  const [_jugadaActual, setJugadaActual] = useState(0);
  const [errorSeleccionado, setErrorSeleccionado] = useState<ErrorDetectado | null>(null);
  const [_mostrandoPanel, setMostrandoPanel] = useState(false);

  // Ref directa al analizador para polling de progreso (evita timing de React state)
  const analizadorRef = useRef<AnalizadorPartida | null>(null);

  // Obtener progreso directamente del ref (no depende de React state propagation)
  const obtenerProgresoDirecto = useCallback((): ProgresoAnálisis => {
    if (!analizadorRef.current) {
      return {
        estado: 'inactivo',
        jugadaActual: 0,
        totalJugadas: 0,
        erroresEncontrados: 0,
        tiempoPromedioPorJugada: 0,
        tiempoRestanteEstimado: 0
      };
    }
    return analizadorRef.current.obtenerProgreso();
  }, []);

  // Hook useAnalisis (acepta null durante inicialización)
  const {
    iniciarAnalisis,
    pausarAnalisis,
    reanudarAnalisis,
    estado: estadoAnalisis,
  } = useAnalisis(analizador);

  // Determinar vista inicial basado en existencia de credenciales
  useEffect(() => {
    if (credencialesExisten !== null) {
      setVistaActual(credencialesExisten ? 'principal' : 'configuracion');
    }
  }, [credencialesExisten]);

  /**
   * Maneja el guardado exitoso de credenciales
   */
  const handleGuardadoExitoso = useCallback(() => {
    Logger.info('Credenciales guardadas correctamente');
    recargarCredenciales();
    setVistaActual('principal');
  }, [recargarCredenciales]);

  /**
   * Navega a configuración
   */
  const handleIrAConfiguracion = useCallback(() => {
    setVistaActual('configuracion');
  }, []);

  /**
   * Inicializa todas las dependencias para el análisis
   */
  const inicializarDependencias = useCallback(async () => {
    try {
      Logger.info('Inicializando dependencias del análisis...');
      
      // Cargar Stockfish de forma lazy
      const motorStockfish = await inicializarMotor();
      Logger.debug('Motor Stockfish inicializado');

      // Importar dinámicamente todas las clases necesarias
      const [
        { ClienteLichess: ClienteLichessClass },
        { ParserPGN: ParserPGNClass },
        { EvaluadorJugadas: EvaluadorJugadasClass },
        { DetectorErrores: DetectorErroresClass },
        { GeneradorExplicaciones: GeneradorExplicacionesClass },
        { ClienteGroq: ClienteGroqClass },
        { AnalizadorPartida: AnalizadorPartidaClass }
      ] = await Promise.all([
        import('./services/lichess/ClienteLichess'),
        import('./services/parseo/ParserPGN'),
        import('./services/analisis/EvaluadorJugadas'),
        import('./services/analisis/DetectorErrores'),
        import('./services/analisis/GeneradorExplicaciones'),
        import('./services/groq/ClienteGroq'),
        import('./services/analisis/AnalizadorPartida')
      ]);

      Logger.debug('Clases importadas correctamente');

      // Instanciar servicios
      const clienteLichess = new ClienteLichessClass(credenciales!.tokenLichess);
      const parserPGN = new ParserPGNClass();
      const evaluador = new EvaluadorJugadasClass(motorStockfish);
      const detector = new DetectorErroresClass();
      const clienteGroq = new ClienteGroqClass(credenciales!.apiKeyGroq);
      const generador = new GeneradorExplicacionesClass(clienteGroq);

      // Crear analizador
      const nuevoAnalizador = new AnalizadorPartidaClass(
        clienteLichess,
        parserPGN,
        evaluador,
        detector,
        generador
      );

      Logger.info('Analizador de partida inicializado correctamente');
      setAnalizador(nuevoAnalizador);
      analizadorRef.current = nuevoAnalizador;
      
      return nuevoAnalizador;
    } catch (err) {
      Logger.error('Error inicializando dependencias', err);
      throw err;
    }
  }, [credenciales, inicializarMotor]);

  /**
   * Inicia el análisis de la última partida
   */
  const handleAnalizarPartida = useCallback(async (opciones?: OpcionesAnalisis) => {
    if (!credenciales) {
      setErrorAnalisis('No hay credenciales configuradas');
      return;
    }

    try {
      setErrorAnalisis(null);
      setVistaActual('analizando');
      Logger.info(`Iniciando análisis para usuario: ${credenciales.username}`);
      // Inicializar dependencias si no están listas
      let analizadorInstance = analizador;
      if (!analizadorInstance) {
        analizadorInstance = await inicializarDependencias();
      }
      // Iniciar análisis directamente en la instancia
      // (no usar iniciarAnalisis del hook porque el state puede no haberse propagado aún)
      const resultadoAnalisis = await analizadorInstance.iniciarAnálisis(credenciales.username, {
        tipoPartida: opciones?.tipoPartida,
        limiteErrores: opciones?.limiteErrores
      });
      
      Logger.info('Análisis completado exitosamente', {
        erroresDetectados: resultadoAnalisis.erroresDetectados.length,
        jugadasAnalizadas: resultadoAnalisis.jugadasAnalizadas
      });

      setResultado(resultadoAnalisis);
      setVistaActual('resultados');
      
      // Si hay errores, navegar al primer error
      if (resultadoAnalisis.erroresDetectados.length > 0) {
        setErrorSeleccionado(resultadoAnalisis.erroresDetectados[0]);
        setJugadaActual(resultadoAnalisis.erroresDetectados[0].numeroJugada);
      }
    } catch (err) {
      Logger.error('Error durante el análisis', err);
      
      let mensajeError: string;
      if (err instanceof Error && 'codigo' in err) {
        mensajeError = obtenerMensajeUsuario(err as ErrorAjedrezTrainer);
      } else if (err instanceof Error) {
        mensajeError = err.message;
      } else {
        mensajeError = 'Error desconocido durante el análisis';
      }
      
      setErrorAnalisis(mensajeError);
      setVistaActual('principal');
    }
  }, [credenciales, analizador, inicializarDependencias, iniciarAnalisis]);

  /**
   * Navega a una jugada específica
   */
  const handleNavigarAJugada = useCallback((numeroJugada: number) => {
    if (!resultado) return;

    setJugadaActual(numeroJugada);
    
    // Buscar si hay un error en esta jugada
    const errorEnJugada = resultado.erroresDetectados.find(
      err => err.numeroJugada === numeroJugada
    );
    
    if (errorEnJugada) {
      setErrorSeleccionado(errorEnJugada);
    } else {
      setErrorSeleccionado(null);
    }
  }, [resultado]);

  /**
   * Genera explicación extendida para un error
   */
  const handleGenerarExplicacionExtendida = useCallback(async (error: ErrorDetectado): Promise<string> => {
    if (!analizador) throw new Error('Analizador no inicializado');
    
    Logger.debug(`Generando explicación extendida para jugada ${error.numeroJugada}`);
    
    // Acceder al generador de explicaciones desde el analizador
    // (esto asume que AnalizadorPartida expone su generador o tiene un método público)
    const { GeneradorExplicaciones: GeneradorClass } = await import('./services/analisis/GeneradorExplicaciones');
    const { ClienteGroq: GroqClass } = await import('./services/groq/ClienteGroq');
    
    const clienteGroq = new GroqClass(credenciales!.apiKeyGroq);
    const generador = new GeneradorClass(clienteGroq);
    
    return await generador.generarExplicaciónExtendida(error);
  }, [analizador, credenciales]);

  /**
   * Vuelve al análisis principal desde el resumen
   */
  const handleVerDetalles = useCallback(() => {
    // Scroll al análisis detallado
    const element = document.getElementById('analisis-detallado');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  /**
   * Vuelve a la pantalla principal para nuevo análisis
   */
  const handleNuevoAnalisis = useCallback(() => {
    setResultado(null);
    setErrorSeleccionado(null);
    setJugadaActual(0);
    setMostrandoPanel(false);
    analizadorRef.current = null;
    setVistaActual('principal');
  }, []);

  // Memoizar datos para los tableros
  const datosTableros = useMemo(() => {
    if (!resultado || !errorSeleccionado) {
      return null;
    }

    // Tablero izquierdo: posición DESPUÉS del error (el resultado de la jugada mala)
    const posicionDespuesError = errorSeleccionado.jugadaRealizada.fen;

    // Tablero derecho: posición que resultaría de la MEJOR jugada
    let posicionMejorAlternativa: string | undefined;
    try {
      const chess = new Chess(errorSeleccionado.fenAntes);
      const from = errorSeleccionado.mejorJugada.substring(0, 2);
      const to = errorSeleccionado.mejorJugada.substring(2, 4);
      const promotion = errorSeleccionado.mejorJugada.length > 4 
        ? errorSeleccionado.mejorJugada.substring(4, 5) 
        : undefined;
      const move = chess.move({ from, to, promotion });
      if (move) {
        posicionMejorAlternativa = chess.fen();
      }
    } catch {
      // Si falla, usar fenAntes como fallback
      posicionMejorAlternativa = errorSeleccionado.fenAntes;
    }

    // Índice de la jugada en el array para la navegación
    const indiceJugada = resultado.partida.jugadas.findIndex(
      j => j.numeroJugada === errorSeleccionado.numeroJugada && 
           j.turno === errorSeleccionado.turno
    );

    return {
      posicionActual: posicionDespuesError || errorSeleccionado.fenAntes,
      posicionAnterior: posicionMejorAlternativa,
      evaluacionActual: errorSeleccionado.evaluaciónDespués,
      evaluacionAnterior: errorSeleccionado.evaluaciónAntes,
      movimientoError: {
        desde: errorSeleccionado.jugadaRealizada.jugadaUCI?.substring(0, 2) || '',
        hacia: errorSeleccionado.jugadaRealizada.jugadaUCI?.substring(2, 4) || ''
      },
      mejorJugada: {
        desde: errorSeleccionado.mejorJugada.substring(0, 2),
        hacia: errorSeleccionado.mejorJugada.substring(2, 4)
      },
      indiceJugada: indiceJugada >= 0 ? indiceJugada : 0
    };
  }, [resultado, errorSeleccionado]);

  return (
    <ErrorBoundary>
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

            <main className="contenido-principal">
              {errorAnalisis && (
                <div className="error-analisis" role="alert">
                  <span className="error-icono">⚠️</span>
                  <p>{errorAnalisis}</p>
                </div>
              )}

              {errorStockfish && (
                <div className="error-analisis" role="alert">
                  <span className="error-icono">⚠️</span>
                  <p>Error cargando motor de análisis: {errorStockfish}</p>
                </div>
              )}

              <SelectorAnalisis
                username={credenciales?.username || ''}
                onIniciarAnalisis={(opciones) => {
                  handleAnalizarPartida(opciones);
                }}
                cargando={cargandoStockfish || estadoAnalisis === 'analizando'}
              />
            </main>

            <footer className="app-footer">
              <p>Ajedrez Trainer - Mejora tu juego analizando tus errores</p>
            </footer>
          </div>
        )}

        {/* Vista de análisis en progreso */}
        {vistaActual === 'analizando' && (
          <div className="vista-analizando">
            <header className="app-header">
              <h1>Análisis en Progreso</h1>
            </header>

            <main className="contenido-analisis">
              <IndicadorProgreso
                obtenerProgreso={obtenerProgresoDirecto}
                onPausar={pausarAnalisis}
                onReanudar={reanudarAnalisis}
              />
            </main>
          </div>
        )}

        {/* Vista de resultados */}
        {vistaActual === 'resultados' && resultado && (
          <div className="vista-resultados">
            <header className="app-header">
              <h1>Resultados del Análisis</h1>
              <div className="header-acciones">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={handleNuevoAnalisis}
                  aria-label="Analizar nueva partida"
                >
                  🔄 Nueva partida
                </button>
                <button 
                  type="button"
                  className="btn-configuracion"
                  onClick={handleIrAConfiguracion}
                  aria-label="Ir a configuración"
                >
                  ⚙️ Configuración
                </button>
              </div>
            </header>

            <main className="contenido-resultados">
              {/* Resumen inicial */}
              <ResumenAnálisis
                resultado={resultado}
                onNavigarAJugada={handleNavigarAJugada}
                onVerDetalles={handleVerDetalles}
              />

              {/* Análisis detallado (si hay errores) */}
              {resultado.erroresDetectados.length > 0 && datosTableros && (
                <div className="analisis-detallado" id="analisis-detallado">
                  <h2>Análisis Jugada por Jugada</h2>
                  
                  <ContenedorTablerosDuales
                    posiciónPartidaFEN={datosTableros.posicionActual || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                    posiciónAlternativaFEN={datosTableros.posicionAnterior}
                    movimientoError={datosTableros.movimientoError}
                    mejorJugada={datosTableros.mejorJugada}
                    orientación={resultado.colorJugador}
                    numeroJugada={datosTableros.indiceJugada}
                    totalJugadas={resultado.partida.jugadas.length}
                    evaluaciónDespués={datosTableros.evaluacionActual}
                    evaluaciónAntes={datosTableros.evaluacionAnterior}
                    onCambiarPosición={handleNavigarAJugada}
                    hayErrorSeleccionado={errorSeleccionado !== null}
                  />

                  {errorSeleccionado && (
                    <PanelExplicaciones
                      error={errorSeleccionado}
                      todosLosErrores={resultado.erroresDetectados}
                      índiceActual={resultado.erroresDetectados.indexOf(errorSeleccionado)}
                      onSeleccionarError={(idx) => {
                        const error = resultado.erroresDetectados[idx];
                        setErrorSeleccionado(error);
                        setJugadaActual(error.numeroJugada);
                      }}
                      onVolver={() => setMostrandoPanel(false)}
                      onGenerarExplicaciónExtendida={handleGenerarExplicacionExtendida}
                    />
                  )}
                </div>
              )}

              {resultado.erroresDetectados.length === 0 && (
                <div className="sin-errores-mensaje">
                  <h2>🎉 ¡Sin errores!</h2>
                  <p>No se encontraron errores significativos en tus jugadas. ¡Excelente partida!</p>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
