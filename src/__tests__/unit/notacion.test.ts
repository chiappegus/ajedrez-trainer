import { describe, it, expect } from 'vitest';
import { sanAFigurine } from '../../utils/notacion';

describe('sanAFigurine', () => {
  it('debe convertir caballo N a figurine', () => {
    expect(sanAFigurine('Nf3')).toBe('♞f3');
    expect(sanAFigurine('Nc6')).toBe('♞c6');
    expect(sanAFigurine('Nxe4')).toBe('♞xe4');
  });

  it('debe convertir alfil B a figurine', () => {
    expect(sanAFigurine('Bb5')).toBe('♝b5');
    expect(sanAFigurine('Bxf7+')).toBe('♝xf7+');
    expect(sanAFigurine('Bg5')).toBe('♝g5');
  });

  it('debe convertir dama Q a figurine', () => {
    expect(sanAFigurine('Qd1')).toBe('♛d1');
    expect(sanAFigurine('Qxd7+')).toBe('♛xd7+');
    expect(sanAFigurine('Qh5#')).toBe('♛h5#');
  });

  it('debe convertir torre R a figurine', () => {
    expect(sanAFigurine('Rad1')).toBe('♜ad1');
    expect(sanAFigurine('Rxe1')).toBe('♜xe1');
    expect(sanAFigurine('Rf1')).toBe('♜f1');
  });

  it('debe convertir rey K a figurine', () => {
    expect(sanAFigurine('Kf1')).toBe('♚f1');
    expect(sanAFigurine('Kxe4')).toBe('♚xe4');
  });

  it('no debe modificar movimientos de peon', () => {
    expect(sanAFigurine('e4')).toBe('e4');
    expect(sanAFigurine('d5')).toBe('d5');
    expect(sanAFigurine('exd5')).toBe('exd5');
    expect(sanAFigurine('e8=Q')).toBe('e8=Q');
  });

  it('no debe modificar enroque', () => {
    expect(sanAFigurine('O-O')).toBe('O-O');
    expect(sanAFigurine('O-O-O')).toBe('O-O-O');
  });

  it('debe manejar strings vacios o null-like', () => {
    expect(sanAFigurine('')).toBe('');
  });
});
