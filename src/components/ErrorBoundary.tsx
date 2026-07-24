/**
 * ErrorBoundary - Componente para capturar errores de React en tiempo de ejecución
 * 
 * Captura errores que ocurren en:
 * - Renderizado de componentes
 * - Métodos del ciclo de vida
 * - Constructores
 * 
 * NO captura errores en:
 * - Event handlers (usar try-catch manualmente)
 * - Código asíncrono (Promises, setTimeout)
 * - Server-side rendering
 * - Errores del propio ErrorBoundary
 * 
 * Feature: lichess-game-analysis
 * Valida: Todos los requisitos (robustez de la aplicación)
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Logger } from '../utils/logger';
import type { ErrorAjedrezTrainer } from '../utils/errores';
import { obtenerMensajeUsuario } from '../utils/errores';

interface ErrorBoundaryProps {
  /** Componentes hijos a renderizar */
  children: ReactNode;
  /** Mensaje personalizado para mostrar en caso de error (opcional) */
  mensajeFallback?: string;
  /** Callback cuando ocurre un error (opcional) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /** Indica si hubo un error */
  hayError: boolean;
  /** Error capturado */
  error: Error | null;
  /** Información adicional del error */
  errorInfo: ErrorInfo | null;
}

/**
 * Componente ErrorBoundary para capturar errores de React
 * 
 * Uso:
 * ```tsx
 * <ErrorBoundary>
 *   <MiComponente />
 * </ErrorBoundary>
 * ```
 * 
 * Con mensaje personalizado:
 * ```tsx
 * <ErrorBoundary mensajeFallback="Error al cargar el análisis">
 *   <PanelAnalisis />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hayError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Método del ciclo de vida de React para capturar errores
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Actualizar estado para renderizar UI de fallback
    return {
      hayError: true,
      error
    };
  }

  /**
   * Método del ciclo de vida de React llamado después de capturar un error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Registrar error en el logger
    Logger.error('Error capturado por ErrorBoundary', error, {
      componentStack: errorInfo.componentStack
    });

    // Actualizar estado con información completa del error
    this.setState({
      errorInfo
    });

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Intenta recuperarse del error recargando el componente
   */
  handleRecargar = (): void => {
    this.setState({
      hayError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Recarga completamente la página
   */
  handleRecargarPagina = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hayError && this.state.error) {
      const { error, errorInfo } = this.state;
      const { mensajeFallback } = this.props;

      // Determinar mensaje a mostrar
      let mensajeUsuario: string;
      if (mensajeFallback) {
        mensajeUsuario = mensajeFallback;
      } else if ('codigo' in error) {
        // Es un ErrorAjedrezTrainer
        mensajeUsuario = obtenerMensajeUsuario(error as ErrorAjedrezTrainer);
      } else {
        mensajeUsuario = 'Ocurrió un error inesperado. Por favor, recarga la página e intenta nuevamente.';
      }

      return (
        <div
          style={{
            padding: '2rem',
            maxWidth: '800px',
            margin: '2rem auto',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            fontFamily: 'system-ui, sans-serif'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <h2 style={{ margin: 0, color: '#856404' }}>
              Algo salió mal
            </h2>
          </div>

          <p style={{ color: '#856404', fontSize: '1rem', marginBottom: '1.5rem' }}>
            {mensajeUsuario}
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={this.handleRecargar}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              aria-label="Intentar nuevamente"
            >
              Intentar nuevamente
            </button>
            <button
              type="button"
              onClick={this.handleRecargarPagina}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fff',
                color: '#856404',
                border: '2px solid #ffc107',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              aria-label="Recargar página"
            >
              Recargar página
            </button>
          </div>

          {import.meta.env.DEV && (
            <details style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#856404',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}
              >
                Detalles técnicos (solo en desarrollo)
              </summary>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  overflowX: 'auto'
                }}
              >
                <p style={{ margin: '0 0 1rem 0' }}>
                  <strong>Error:</strong> {error.toString()}
                </p>
                {error.stack && (
                  <pre
                    style={{
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: '0 0 1rem 0'
                    }}
                  >
                    {error.stack}
                  </pre>
                )}
                {errorInfo && (
                  <>
                    <p style={{ margin: '1rem 0 0.5rem 0' }}>
                      <strong>Component Stack:</strong>
                    </p>
                    <pre
                      style={{
                        fontSize: '0.85rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0
                      }}
                    >
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
