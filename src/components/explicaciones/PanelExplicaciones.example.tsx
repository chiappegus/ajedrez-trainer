/**
 * Ejemplo de uso del componente PanelExplicaciones
 * Feature: lichess-game-analysis
 */

import { useState } from 'react';
import { PanelExplicaciones } from './PanelExplicaciones';
import type { ErrorDetectado } from '../../types/error';

/**
 * Ejemplo básico de uso del PanelExplicaciones
 */
export function EjemploBasico() {
  const erroresEjemplo: ErrorDetectado[] = [
    {
      numeroJugada: 12,
      turno: 'white',
      fenAntes: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4',
      jugadaRealizada: {
        numeroJugada: 12,
        turno: 'white',
        jugadaSAN: 'Qxf7??',
        fen: 'rnbqkb1r/pppp1Qpp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 4'
      },
      mejorJugada: 'd1e2',
      mejorJugadaSAN: 'Qe2',
      evaluaciónAntes: 50,
      evaluaciónDespués: -300,
      pérdidaCentipawns: 350,
      explicación: 'En la jugada 12, las blancas jugaron Qxf7??, sacrificando la dama sin compensación adecuada. Esta jugada permite a las negras capturar la dama con el rey (Kxf7) ganando material decisivo. La mejor jugada era Qe2, manteniendo la tensión y desarrollando la posición de manera segura.',
      variante: ['e7f7', 'f3g5', 'f7e8']
    },
    {
      numeroJugada: 22,
      turno: 'black',
      fenAntes: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4',
      jugadaRealizada: {
        numeroJugada: 22,
        turno: 'black',
        jugadaSAN: 'Nxe4?',
        fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5'
      },
      mejorJugada: 'e8g8',
      mejorJugadaSAN: 'O-O',
      evaluaciónAntes: -20,
      evaluaciónDespués: 150,
      pérdidaCentipawns: 170,
      explicación: 'En la jugada 22, las negras jugaron Nxe4? capturando un peón pero perdiendo tiempo y permitiendo un ataque peligroso. La mejor jugada era O-O (enroque corto), poniendo al rey a salvo y conectando las torres.',
      variante: []
    }
  ];

  const [índiceActual, setÍndiceActual] = useState(0);
  const [mostrarPanel, setMostrarPanel] = useState(true);

  const handleGenerarExplicaciónExtendida = async (error: ErrorDetectado): Promise<string> => {
    // Simular llamada a API con delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `Análisis detallado de la jugada ${error.numeroJugada}:

La jugada ${error.jugadaRealizada.jugadaSAN} fue un error significativo porque:

1. **Pérdida de material**: La jugada sacrifica piezas valiosas sin obtener compensación posicional o táctica adecuada.

2. **Debilitamiento de la estructura**: Esta jugada deja debilidades permanentes en la posición que serán difíciles de defender en el medio juego.

3. **Pérdida de iniciativa**: Después de esta jugada, el oponente obtiene la iniciativa y puede dictar el curso del juego.

La alternativa ${error.mejorJugadaSAN} era superior porque:
- Mantiene la tensión en el centro
- Desarrolla las piezas de manera armónica
- Prepara un plan coherente para el medio juego

**Conceptos tácticos relevantes**: Este error ilustra la importancia de calcular las consecuencias de nuestras jugadas antes de ejecutarlas, especialmente cuando involucran capturas o sacrificios.`;
  };

  if (!mostrarPanel) {
    return (
      <div style={{ padding: '2rem' }}>
        <button
          onClick={() => setMostrarPanel(true)}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Mostrar Panel de Explicaciones
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>
        Ejemplo: Panel de Explicaciones
      </h1>
      
      <PanelExplicaciones
        error={erroresEjemplo[índiceActual]}
        todosLosErrores={erroresEjemplo}
        índiceActual={índiceActual}
        onSeleccionarError={(idx) => setÍndiceActual(idx)}
        onVolver={() => setMostrarPanel(false)}
        onGenerarExplicaciónExtendida={handleGenerarExplicaciónExtendida}
      />
    </div>
  );
}

/**
 * Ejemplo con un solo error
 */
export function EjemploErrorÚnico() {
  const errorÚnico: ErrorDetectado = {
    numeroJugada: 15,
    turno: 'white',
    fenAntes: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 2 5',
    jugadaRealizada: {
      numeroJugada: 15,
      turno: 'white',
      jugadaSAN: 'd4?',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 5'
    },
    mejorJugada: 'f1e2',
    mejorJugadaSAN: 'Be2',
    evaluaciónAntes: 10,
    evaluaciónDespués: -90,
    pérdidaCentipawns: 100,
    explicación: 'Debilita la casilla d4 sin necesidad. Be2 desarrolla con solidez.',
    variante: ['f1e2', 'f8e7', 'e1g1']
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>
        Ejemplo: Error Único
      </h1>
      
      <PanelExplicaciones
        error={errorÚnico}
        todosLosErrores={[errorÚnico]}
        índiceActual={0}
        onSeleccionarError={() => {}}
        onVolver={() => alert('Volver al análisis')}
        onGenerarExplicaciónExtendida={async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
          return 'Explicación extendida detallada del único error...';
        }}
      />
    </div>
  );
}
