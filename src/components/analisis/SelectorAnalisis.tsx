/**
 * Selector de opciones de análisis
 * Feature: lichess-game-analysis
 */

import { useState } from 'react';
import './SelectorAnalisis.css';

export type TipoPartida = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface OpcionesAnalisis {
  tipoPartida: TipoPartida;
  cantidadPartidas: number;
  limiteErrores: 3 | 5;
}

interface SelectorAnalisisProps {
  username: string;
  onIniciarAnalisis: (opciones: OpcionesAnalisis) => void;
  cargando: boolean;
}

export function SelectorAnalisis({ username, onIniciarAnalisis, cargando }: SelectorAnalisisProps) {
  const [tipoPartida, setTipoPartida] = useState<TipoPartida>('blitz');
  const [limiteErrores, setLimiteErrores] = useState<3 | 5>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onIniciarAnalisis({
      tipoPartida,
      cantidadPartidas: 1,
      limiteErrores
    });
  };

  const tiposPartida: { value: TipoPartida; label: string; emoji: string }[] = [
    { value: 'bullet', label: 'Bullet', emoji: '⚡' },
    { value: 'blitz', label: 'Blitz', emoji: '🔥' },
    { value: 'rapid', label: 'Rápida', emoji: '⏱️' },
    { value: 'classical', label: 'Clásica', emoji: '♟️' },
  ];

  return (
    <div className="selector-analisis">
      <div className="selector-usuario">
        <span className="usuario-icono">👤</span>
        <span className="usuario-nombre">Logueado como: <strong>{username}</strong></span>
      </div>

      <form onSubmit={handleSubmit} className="selector-form">
        <div className="selector-grupo">
          <label htmlFor="tipo-partida">Tipo de partida</label>
          <select
            id="tipo-partida"
            value={tipoPartida}
            onChange={(e) => setTipoPartida(e.target.value as TipoPartida)}
            disabled={cargando}
          >
            {tiposPartida.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.emoji} {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="selector-info">
          <span className="info-icono">ℹ️</span>
          <span>Se analizará tu última partida del tipo seleccionado</span>
        </div>

        <div className="selector-grupo">
          <label>Errores a mostrar</label>
          <div className="selector-radio-group">
            <label className={`radio-option ${limiteErrores === 3 ? 'selected' : ''}`}>
              <input
                type="radio"
                name="limite-errores"
                value="3"
                checked={limiteErrores === 3}
                onChange={() => setLimiteErrores(3)}
                disabled={cargando}
              />
              <span>Top 3 errores</span>
            </label>
            <label className={`radio-option ${limiteErrores === 5 ? 'selected' : ''}`}>
              <input
                type="radio"
                name="limite-errores"
                value="5"
                checked={limiteErrores === 5}
                onChange={() => setLimiteErrores(5)}
                disabled={cargando}
              />
              <span>Top 5 errores</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn-analizar"
          disabled={cargando}
        >
          {cargando ? '⏳ Analizando...' : '🔍 Analizar última partida'}
        </button>
      </form>
    </div>
  );
}
