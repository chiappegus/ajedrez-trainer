/**
 * Ejemplo de uso del componente IndicadorProgreso
 * 
 * Demuestra:
 * - Integración con AnalizadorPartida
 * - Uso del hook useAnalisis
 * - Manejo de callbacks Pausar/Reanudar
 * 
 * Feature: lichess-game-analysis
 */

import { IndicadorProgreso } from './IndicadorProgreso';
import { useAnalisis } from '../../hooks/useAnalisis';
import type { AnalizadorPartida } from '../../services/analisis/AnalizadorPartida';

interface EjemploIndicadorProgresoProps {
  analizador: AnalizadorPartida;
}

/**
 * Ejemplo de integración del componente IndicadorProgreso
 * con un AnalizadorPartida real usando el hook useAnalisis
 */
export function EjemploIndicadorProgreso({ analizador }: EjemploIndicadorProgresoProps) {
  const {
    iniciarAnalisis,
    pausarAnalisis,
    reanudarAnalisis,
    obtenerProgreso,
    estado,
    error,
    resultado
  } = useAnalisis(analizador);

  const handleIniciarAnalisis = async () => {
    await iniciarAnalisis('mi-usuario-lichess');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Ejemplo de Indicador de Progreso</h1>

      {/* Botón para iniciar análisis */}
      {estado === 'inactivo' && (
        <button
          onClick={handleIniciarAnalisis}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
        >
          Iniciar Análisis
        </button>
      )}

      {/* Componente IndicadorProgreso */}
      <IndicadorProgreso
        obtenerProgreso={obtenerProgreso}
        onPausar={pausarAnalisis}
        onReanudar={reanudarAnalisis}
      />

      {/* Mostrar error si existe */}
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Mostrar resultados cuando se completa */}
      {resultado && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: '#efe',
          border: '1px solid #cfc',
          borderRadius: '4px'
        }}>
          <h2>Análisis Completado</h2>
          <p><strong>Jugadas analizadas:</strong> {resultado.jugadasAnalizadas}</p>
          <p><strong>Errores detectados:</strong> {resultado.erroresDetectados.length}</p>
          <p><strong>Pérdida promedio:</strong> {resultado.pérdidaPromedioCentipawns.toFixed(1)} centipawns</p>
          <p><strong>Rendimiento general:</strong> {resultado.estadísticas?.rendimientoGeneral}</p>
          <p><strong>Tiempo total:</strong> {(resultado.tiempoTotal / 1000).toFixed(1)}s</p>
        </div>
      )}
    </div>
  );
}
