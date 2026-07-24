/**
 * ResumenAnálisis - Componente para mostrar estadísticas finales del análisis
 * 
 * Muestra:
 * - Total de jugadas analizadas y errores encontrados
 * - Pérdida promedio de centipawns
 * - Distribución de errores (blancas vs negras)
 * - Mayor pérdida y jugada donde ocurrió
 * - Clasificación de rendimiento con insignia
 * - Mensaje especial si no hay errores detectados
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 9.4, 12.1, 12.2, 12.3, 12.4
 */

import type { ResultadoAnálisis } from '../../types/evaluacion';
import './ResumenAnálisis.css';

interface ResumenAnálisisProps {
  /** Resultado completo del análisis */
  resultado: ResultadoAnálisis;
  /** Callback para navegar a la jugada con mayor pérdida */
  onNavigarAJugada?: (numeroJugada: number) => void;
  /** Callback para mostrar análisis jugada por jugada */
  onVerDetalles?: () => void;
}

/**
 * Formatea la clasificación de rendimiento a emoji
 */
function obtenerEmojiRendimiento(
  rendimiento: 'excelente' | 'sólido' | 'aceptable' | 'mejorable'
): string {
  switch (rendimiento) {
    case 'excelente':
      return '🏆';
    case 'sólido':
      return '⭐';
    case 'aceptable':
      return '👍';
    case 'mejorable':
      return '📚';
  }
}

/**
 * Formatea la clasificación de rendimiento a texto en español
 */
function obtenerTextoRendimiento(
  rendimiento: 'excelente' | 'sólido' | 'aceptable' | 'mejorable'
): string {
  switch (rendimiento) {
    case 'excelente':
      return 'Excelente';
    case 'sólido':
      return 'Sólido';
    case 'aceptable':
      return 'Aceptable';
    case 'mejorable':
      return 'Mejorable';
  }
}

/**
 * Formatea tiempo en milisegundos a formato legible
 */
function formatearTiempo(ms: number): string {
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const segsRestantes = segundos % 60;

  if (minutos > 0) {
    return `${minutos}m ${segsRestantes}s`;
  }
  return `${segundos}s`;
}

/**
 * Componente que muestra el resumen completo del análisis
 * 
 * Presenta estadísticas finales de forma clara y visual, incluyendo:
 * - Contadores de jugadas y errores
 * - Gráfico de distribución de errores por color
 * - Pérdida promedio con contexto interpretativo
 * - Clasificación de rendimiento con insignia
 * - Mensaje motivacional si no hay errores
 * - Enlace rápido a jugada con mayor pérdida
 * 
 * @example
 * ```tsx
 * <ResumenAnálisis
 *   resultado={resultadoAnálisis}
 *   onNavigarAJugada={(num) => setJugadaActual(num)}
 *   onVerDetalles={() => setVistaActual('detalles')}
 * />
 * ```
 */
export function ResumenAnálisis({
  resultado,
  onNavigarAJugada,
  onVerDetalles
}: ResumenAnálisisProps) {
  const { erroresDetectados, estadísticas, pérdidaPromedioCentipawns, tiempoTotal } = resultado;

  const hayErrores = erroresDetectados.length > 0;
  const emojiRendimiento = obtenerEmojiRendimiento(estadísticas.rendimientoGeneral);
  const textoRendimiento = obtenerTextoRendimiento(estadísticas.rendimientoGeneral);

  // Calcular porcentajes para el gráfico de distribución
  const totalErrores = estadísticas.erroresBlancas + estadísticas.erroresNegras;
  const porcentajeBlancas = totalErrores > 0
    ? Math.round((estadísticas.erroresBlancas / totalErrores) * 100)
    : 0;
  const porcentajeNegras = totalErrores > 0
    ? Math.round((estadísticas.erroresNegras / totalErrores) * 100)
    : 0;

  return (
    <div className="resumen-analisis">
      <div className="resumen-header">
        <h2 className="resumen-titulo">Resumen del Análisis</h2>
        <div className="resumen-insignia" data-rendimiento={estadísticas.rendimientoGeneral}>
          <span className="insignia-emoji">{emojiRendimiento}</span>
          <span className="insignia-texto">{textoRendimiento}</span>
        </div>
      </div>

      {/* Color del jugador */}
      <p className="color-jugador">
        Jugaste con <strong>{resultado.colorJugador === 'white' ? '⬜ Blancas' : '⬛ Negras'}</strong>
      </p>

      {/* Caso sin errores - mensaje de felicitación */}
      {!hayErrores && (
        <div className="resumen-sin-errores fade-in">
          <div className="sin-errores-icono">🎉</div>
          <h3 className="sin-errores-titulo">¡Excelente!</h3>
          <p className="sin-errores-mensaje">
            No se encontraron errores significativos en tu partida.
          </p>
          <p className="sin-errores-submensaje">
            Tu precisión fue notable. Mantuviste una pérdida promedio de solo{' '}
            <strong>{pérdidaPromedioCentipawns.toFixed(1)} centipawns</strong> por jugada.
          </p>
          {pérdidaPromedioCentipawns < 20 && (
            <div className="sin-errores-badge">
              <span className="badge-emoji">⭐</span>
              <span className="badge-texto">Rendimiento Sólido</span>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="resumen-estadisticas">
        <div className="estadistica-card">
          <div className="estadistica-icono">🎯</div>
          <div className="estadistica-contenido">
            <div className="estadistica-valor">{estadísticas.totalJugadas}</div>
            <div className="estadistica-label">Jugadas analizadas</div>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icono">⚠️</div>
          <div className="estadistica-contenido">
            <div className="estadistica-valor">{erroresDetectados.length}</div>
            <div className="estadistica-label">Errores detectados</div>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icono">📊</div>
          <div className="estadistica-contenido">
            <div className="estadistica-valor">
              {pérdidaPromedioCentipawns.toFixed(1)} cp
            </div>
            <div className="estadistica-label">Pérdida promedio</div>
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-icono">⏱️</div>
          <div className="estadistica-contenido">
            <div className="estadistica-valor">{formatearTiempo(tiempoTotal)}</div>
            <div className="estadistica-label">Tiempo de análisis</div>
          </div>
        </div>
      </div>

      {/* Distribución de errores (solo si hay errores) */}
      {hayErrores && (
        <div className="resumen-seccion">
          <h3 className="seccion-titulo">Distribución de Errores</h3>
          <div className="distribucion-errores">
            <div className="distribucion-item">
              <div className="distribucion-label">
                <span className="color-blancas">⚪</span>
                Blancas
              </div>
              <div className="distribucion-barra">
                <div
                  className="distribucion-relleno blancas"
                  style={{ width: `${porcentajeBlancas}%` }}
                />
              </div>
              <div className="distribucion-valor">
                {estadísticas.erroresBlancas} ({porcentajeBlancas}%)
              </div>
            </div>

            <div className="distribucion-item">
              <div className="distribucion-label">
                <span className="color-negras">⚫</span>
                Negras
              </div>
              <div className="distribucion-barra">
                <div
                  className="distribucion-relleno negras"
                  style={{ width: `${porcentajeNegras}%` }}
                />
              </div>
              <div className="distribucion-valor">
                {estadísticas.erroresNegras} ({porcentajeNegras}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mayor pérdida (solo si hay errores) */}
      {hayErrores && (
        <div className="resumen-seccion">
          <h3 className="seccion-titulo">Mayor Pérdida</h3>
          <div className="mayor-perdida-card">
            <div className="mayor-perdida-info">
              <div className="mayor-perdida-valor">
                {Math.round(estadísticas.mayorPérdida)} centipawns
              </div>
              <div className="mayor-perdida-label">
                en la jugada {estadísticas.jugadaMayorPérdida}
              </div>
            </div>
            {onNavigarAJugada && (
              <button
                type="button"
                className="btn btn-secondary btn-navegar"
                onClick={() => onNavigarAJugada(estadísticas.jugadaMayorPérdida)}
                aria-label={`Navegar a jugada ${estadísticas.jugadaMayorPérdida}`}
              >
                🔍 Ver jugada
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interpretación del rendimiento */}
      <div className="resumen-seccion">
        <h3 className="seccion-titulo">Interpretación</h3>
        <div className="interpretacion-card">
          {estadísticas.rendimientoGeneral === 'excelente' && (
            <p className="interpretacion-texto">
              Tu precisión fue excepcional. Mantienes un nivel de juego muy alto con
              una pérdida promedio menor a 10 centipawns por jugada.
            </p>
          )}
          {estadísticas.rendimientoGeneral === 'sólido' && (
            <p className="interpretacion-texto">
              Tu juego fue sólido y consistente. Mantuviste una pérdida promedio entre
              10 y 20 centipawns por jugada, lo cual indica un buen nivel de precisión.
            </p>
          )}
          {estadísticas.rendimientoGeneral === 'aceptable' && (
            <p className="interpretacion-texto">
              Tu rendimiento fue aceptable, con una pérdida promedio entre 20 y 40
              centipawns por jugada. Hay margen para mejorar enfocándote en calcular
              más profundamente las consecuencias de tus jugadas.
            </p>
          )}
          {estadísticas.rendimientoGeneral === 'mejorable' && (
            <p className="interpretacion-texto">
              Tu partida tuvo varios errores significativos, con una pérdida promedio
              superior a 40 centipawns por jugada. Revisa los errores detectados y
              estudia las alternativas sugeridas para mejorar tu nivel de juego.
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="resumen-acciones">
        {onVerDetalles && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onVerDetalles}
            aria-label="Ver análisis jugada por jugada"
          >
            📋 Ver análisis detallado
          </button>
        )}
        {hayErrores && (
          <p className="resumen-sugerencia">
            Navega jugada por jugada para revisar los errores y aprender de las
            mejores alternativas.
          </p>
        )}
      </div>
    </div>
  );
}
