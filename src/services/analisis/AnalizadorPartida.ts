/**
 * AnalizadorPartida - Orquestador principal del flujo de análisis completo
 * 
 * Responsabilidad: Coordinar todo el proceso de análisis de partidas de Lichess
 * 
 * Esta clase conecta todos los componentes del sistema:
 * Lichess API → Parser → Evaluador → Detector → Generador IA
 * 
 * Gestiona el estado del análisis (inactivo, analizando, pausado, completado, error)
 * y proporciona yields periódicos cada 2s para mantener la UI responsiva.
 * 
 * Feature: lichess-game-analysis
 * Valida: Requisitos 9.1, 9.2, 9.3, 9.5, 5.5, 8.1, 8.9, 10.3, 10.4, 12.1, 12.2
 */

import type { ClienteLichess } from '../lichess/ClienteLichess';
import type { ParserPGN } from '../parseo/ParserPGN';
import type { EvaluadorJugadas } from './EvaluadorJugadas';
import type { DetectorErrores } from './DetectorErrores';
import type { GeneradorExplicaciones } from './GeneradorExplicaciones';
import type { ResultadoAnálisis, Evaluación } from '../../types/evaluacion';
import type { ProgresoAnálisis, ErrorDetectado, EstadísticasAnálisis } from '../../types/error';
import type { Partida } from '../../types/partida';

/**
 * Estado interno del analizador
 */
interface EstadoAnalizador {
  estado: 'inactivo' | 'analizando' | 'pausado' | 'completado' | 'error';
  jugadaActual: number;
  evaluaciones: Map<number, Evaluación>;
  errores: ErrorDetectado[];
  tiempoInicio: number;
  tiemposPorJugada: number[];
  pausado: boolean;
}

/**
 * Clase orquestadora principal que coordina TODO el flujo de análisis
 */
export class AnalizadorPartida {
  private readonly clienteLichess: ClienteLichess;
  private readonly parser: ParserPGN;
  private readonly evaluador: EvaluadorJugadas;
  private readonly detector: DetectorErrores;
  private readonly generador: GeneradorExplicaciones;
  
  private estado: EstadoAnalizador;

  /**
   * Constructor con todas las dependencias necesarias
   * 
   * @param clienteLichess - Cliente para obtener PGN desde Lichess API
   * @param parser - Parser para convertir PGN en objeto estructurado
   * @param evaluador - Evaluador para analizar posiciones con Stockfish
   * @param detector - Detector para identificar errores significativos
   * @param generador - Generador de explicaciones educativas con IA
   */
  constructor(
    clienteLichess: ClienteLichess,
    parser: ParserPGN,
    evaluador: EvaluadorJugadas,
    detector: DetectorErrores,
    generador: GeneradorExplicaciones
  ) {
    this.clienteLichess = clienteLichess;
    this.parser = parser;
    this.evaluador = evaluador;
    this.detector = detector;
    this.generador = generador;

    // Inicializar estado
    this.estado = {
      estado: 'inactivo',
      jugadaActual: 0,
      evaluaciones: new Map(),
      errores: [],
      tiempoInicio: 0,
      tiemposPorJugada: [],
      pausado: false
    };
  }

  /**
   * Inicia el análisis completo de la última partida de un usuario
   * 
   * Este método orquesta todo el flujo:
   * 1. Obtiene el PGN desde Lichess
   * 2. Parsea el PGN
   * 3. Analiza jugada por jugada desde la jugada 4
   * 4. Detecta errores
   * 5. Genera explicaciones con IA
   * 6. Calcula estadísticas finales
   * 
   * @param nombreUsuario - Nombre de usuario de Lichess
   * @returns Resultado completo del análisis
   * @throws Error si falla algún paso del proceso
   */
  async iniciarAnálisis(nombreUsuario: string): Promise<ResultadoAnálisis> {
    try {
      // Resetear estado
      this.estado = {
        estado: 'analizando',
        jugadaActual: 0,
        evaluaciones: new Map(),
        errores: [],
        tiempoInicio: Date.now(),
        tiemposPorJugada: [],
        pausado: false
      };

      // Paso 1: Obtener PGN desde Lichess
      const pgn = await this.clienteLichess.obtenerÚltimaPartida(nombreUsuario);

      // Paso 2: Parsear PGN a objeto estructurado
      const partida = this.parser.parsear(pgn);

      // Paso 3: Analizar jugada por jugada
      await this.analizarJugadas(partida);

      // Paso 4: Generar explicaciones para errores detectados
      await this.generarExplicaciones();

      // Paso 5: Calcular estadísticas finales
      const estadísticas = this.calcularEstadísticas(partida);
      const pérdidaPromedio = this.calcularPérdidaPromedio();

      // Marcar como completado
      this.estado.estado = 'completado';

      const tiempoTotal = Date.now() - this.estado.tiempoInicio;

      return {
        partida,
        erroresDetectados: this.estado.errores,
        pérdidaPromedioCentipawns: pérdidaPromedio,
        jugadasAnalizadas: this.estado.jugadaActual,
        tiempoTotal,
        estadísticas
      };

    } catch (error) {
      this.estado.estado = 'error';
      throw error;
    }
  }

  /**
   * Pausa el análisis en curso
   * 
   * El análisis puede reanudarse posteriormente desde el punto donde se pausó
   */
  pausarAnálisis(): void {
    if (this.estado.estado === 'analizando') {
      this.estado.pausado = true;
      this.estado.estado = 'pausado';
    }
  }

  /**
   * Reanuda un análisis pausado
   * 
   * Continúa desde la jugada donde se pausó
   */
  reanudarAnálisis(): void {
    if (this.estado.estado === 'pausado') {
      this.estado.pausado = false;
      this.estado.estado = 'analizando';
    }
  }

  /**
   * Obtiene el progreso actual del análisis
   * 
   * @returns Información detallada sobre el progreso, incluyendo estimación de tiempo restante
   */
  obtenerProgreso(): ProgresoAnálisis {
    const tiempoPromedio = this.calcularTiempoPromedioPorJugada();
    const jugadasRestantes = this.estado.evaluaciones.size - this.estado.jugadaActual;
    const tiempoRestante = jugadasRestantes * tiempoPromedio;

    return {
      estado: this.estado.estado,
      jugadaActual: this.estado.jugadaActual,
      totalJugadas: this.estado.evaluaciones.size || 0,
      erroresEncontrados: this.estado.errores.length,
      tiempoPromedioPorJugada: tiempoPromedio,
      tiempoRestanteEstimado: tiempoRestante
    };
  }

  /**
   * Bucle principal de análisis jugada por jugada desde jugada 4
   * 
   * @param partida - Partida a analizar
   * @private
   */
  private async analizarJugadas(partida: Partida): Promise<void> {
    let evaluaciónAnterior: Evaluación | null = null;
    let tiempoÚltimoYield = Date.now();

    // Iterar desde la jugada 4 (índice 3) según requisito 5.5
    for (let i = 0; i < partida.jugadas.length; i++) {
      // Verificar si está pausado
      while (this.estado.pausado) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const jugada = partida.jugadas[i];
      this.estado.jugadaActual = i + 1;

      // Obtener FEN de la posición actual
      const fen = jugada.fen;
      if (!fen) {
        continue; // Skip si no hay FEN
      }

      // Evaluar la posición
      const tiempoInicioJugada = Date.now();
      const evaluaciónActual = await this.evaluador.evaluarPosición(fen);
      const tiempoEvaluación = Date.now() - tiempoInicioJugada;
      
      this.estado.tiemposPorJugada.push(tiempoEvaluación);
      this.estado.evaluaciones.set(i, evaluaciónActual);

      // Detectar errores si hay evaluación anterior y estamos desde jugada 4+
      if (evaluaciónAnterior && i >= 3) {
        const error = this.detector.detectarError(
          evaluaciónAnterior,
          evaluaciónActual,
          jugada,
          jugada.numeroJugada
        );

        if (error) {
          this.estado.errores.push(error);
        }
      }

      // Actualizar evaluación anterior para próxima iteración
      evaluaciónAnterior = evaluaciónActual;

      // Yield cada 2 segundos para mantener UI responsiva (Requisito 10.2)
      if (Date.now() - tiempoÚltimoYield > 2000) {
        await new Promise(resolve => setTimeout(resolve, 0));
        tiempoÚltimoYield = Date.now();
      }
    }
  }

  /**
   * Genera explicaciones con IA para todos los errores detectados
   * 
   * @private
   */
  private async generarExplicaciones(): Promise<void> {
    for (const error of this.estado.errores) {
      // Verificar si está pausado
      while (this.estado.pausado) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      try {
        // Generar explicación concisa
        const explicación = await this.generador.generarExplicaciónConcisa(error);
        error.explicación = explicación;
      } catch (err) {
        // Fallback a explicación básica si Groq falla
        error.explicación = this.generador.generarExplicaciónBásica(error);
      }
    }
  }

  /**
   * Calcula estadísticas finales del análisis
   * 
   * @param partida - Partida analizada
   * @returns Estadísticas agregadas
   * @private
   */
  private calcularEstadísticas(partida: Partida): EstadísticasAnálisis {
    // Contar errores por color
    let erroresBlancas = 0;
    let erroresNegras = 0;
    let mayorPérdida = 0;
    let jugadaMayorPérdida = 0;

    for (const error of this.estado.errores) {
      if (error.turno === 'white') {
        erroresBlancas++;
      } else {
        erroresNegras++;
      }

      if (error.pérdidaCentipawns > mayorPérdida) {
        mayorPérdida = error.pérdidaCentipawns;
        jugadaMayorPérdida = error.numeroJugada;
      }
    }

    // Clasificar rendimiento según pérdida promedio (Requisito 12.1, 12.2)
    const pérdidaPromedio = this.calcularPérdidaPromedio();
    let rendimiento: 'excelente' | 'sólido' | 'aceptable' | 'mejorable';

    if (pérdidaPromedio < 20) {
      rendimiento = 'excelente';
    } else if (pérdidaPromedio < 50) {
      rendimiento = 'sólido';
    } else if (pérdidaPromedio < 100) {
      rendimiento = 'aceptable';
    } else {
      rendimiento = 'mejorable';
    }

    return {
      totalJugadas: partida.jugadas.length,
      erroresBlancas,
      erroresNegras,
      mayorPérdida,
      jugadaMayorPérdida,
      rendimientoGeneral: rendimiento
    };
  }

  /**
   * Calcula la pérdida promedio de centipawns
   * 
   * @returns Pérdida promedio por jugada con error
   * @private
   */
  private calcularPérdidaPromedio(): number {
    if (this.estado.errores.length === 0) {
      return 0;
    }

    const sumaPérdidas = this.estado.errores.reduce(
      (sum, error) => sum + error.pérdidaCentipawns,
      0
    );

    return sumaPérdidas / this.estado.errores.length;
  }

  /**
   * Calcula el tiempo promedio por jugada
   * 
   * @returns Tiempo promedio en milisegundos
   * @private
   */
  private calcularTiempoPromedioPorJugada(): number {
    if (this.estado.tiemposPorJugada.length === 0) {
      return 0;
    }

    const sumaTiempos = this.estado.tiemposPorJugada.reduce((sum, t) => sum + t, 0);
    return sumaTiempos / this.estado.tiemposPorJugada.length;
  }
}
