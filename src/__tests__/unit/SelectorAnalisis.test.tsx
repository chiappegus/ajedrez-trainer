/**
 * Tests para SelectorAnalisis
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectorAnalisis } from '../../components/analisis/SelectorAnalisis';

describe('SelectorAnalisis', () => {
  const defaultProps = {
    username: 'TestUser',
    onIniciarAnalisis: vi.fn(),
    cargando: false,
  };

  it('debe mostrar el username del usuario', () => {
    render(<SelectorAnalisis {...defaultProps} />);
    expect(screen.getByText(/TestUser/)).toBeDefined();
  });

  it('debe mostrar selector de tipo de partida con opciones', () => {
    render(<SelectorAnalisis {...defaultProps} />);
    const select = screen.getByLabelText(/tipo de partida/i);
    expect(select).toBeDefined();
  });

  it('debe tener opciones de Bullet, Blitz, Rápida, Clásica', () => {
    render(<SelectorAnalisis {...defaultProps} />);
    expect(screen.getByText(/Bullet/)).toBeDefined();
    expect(screen.getByText(/Blitz/)).toBeDefined();
    expect(screen.getByText(/Rápida/)).toBeDefined();
    expect(screen.getByText(/Clásica/)).toBeDefined();
  });

  it('debe tener radio buttons para top 3 y top 5 errores', () => {
    render(<SelectorAnalisis {...defaultProps} />);
    expect(screen.getByText(/Top 3 errores/)).toBeDefined();
    expect(screen.getByText(/Top 5 errores/)).toBeDefined();
  });

  it('debe llamar onIniciarAnalisis con opciones correctas al submit', () => {
    const onIniciar = vi.fn();
    render(<SelectorAnalisis {...defaultProps} onIniciarAnalisis={onIniciar} />);
    
    const btn = screen.getByRole('button', { name: /analizar/i });
    fireEvent.click(btn);
    
    expect(onIniciar).toHaveBeenCalledWith({
      tipoPartida: 'blitz',
      cantidadPartidas: 1,
      limiteErrores: 5
    });
  });

  it('debe deshabilitar controles cuando está cargando', () => {
    render(<SelectorAnalisis {...defaultProps} cargando={true} />);
    
    const btn = screen.getByRole('button');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('debe permitir cambiar tipo de partida', () => {
    const onIniciar = vi.fn();
    render(<SelectorAnalisis {...defaultProps} onIniciarAnalisis={onIniciar} />);
    
    const select = screen.getByLabelText(/tipo de partida/i);
    fireEvent.change(select, { target: { value: 'rapid' } });
    
    const btn = screen.getByRole('button', { name: /analizar/i });
    fireEvent.click(btn);
    
    expect(onIniciar).toHaveBeenCalledWith(expect.objectContaining({
      tipoPartida: 'rapid'
    }));
  });

  it('debe permitir cambiar limite de errores a 3', () => {
    const onIniciar = vi.fn();
    render(<SelectorAnalisis {...defaultProps} onIniciarAnalisis={onIniciar} />);
    
    const radio3 = screen.getByText(/Top 3 errores/).closest('label')?.querySelector('input');
    if (radio3) fireEvent.click(radio3);
    
    const btn = screen.getByRole('button', { name: /analizar/i });
    fireEvent.click(btn);
    
    expect(onIniciar).toHaveBeenCalledWith(expect.objectContaining({
      limiteErrores: 3
    }));
  });
});
