/**
 * Tests unitarios para ConfiguracionCredenciales
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1.2, 0.1.3, 0.1.4, 0.1.5, 0.1.6, 0.1.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfiguracionCredenciales } from './ConfiguracionCredenciales';
import { GestorCredenciales } from '../../services/credenciales/GestorCredenciales';

// Mock de GestorCredenciales
vi.mock('../../services/credenciales/GestorCredenciales');

describe('ConfiguracionCredenciales', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    vi.clearAllMocks();
    
    // Mock de localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    global.localStorage = localStorageMock as Storage;
  });

  it('renderiza el formulario con todos los campos', () => {
    render(<ConfiguracionCredenciales />);

    expect(screen.getByLabelText(/nombre de usuario de lichess/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/token de api personal de lichess/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/api key de groq/i)).toBeInTheDocument();
  });

  it('incluye enlaces a páginas de generación de tokens', () => {
    render(<ConfiguracionCredenciales />);

    const linkLichess = screen.getByText(/generar token en lichess/i);
    expect(linkLichess).toHaveAttribute('href', 'https://lichess.org/account/oauth/token');
    expect(linkLichess).toHaveAttribute('target', '_blank');

    const linkGroq = screen.getByText(/generar api key en groq/i);
    expect(linkGroq).toHaveAttribute('href', 'https://console.groq.com/keys');
    expect(linkGroq).toHaveAttribute('target', '_blank');
  });

  it('muestra estado "Guardando..." mientras procesa', async () => {
    vi.mocked(GestorCredenciales).prototype.validarCredenciales = vi.fn(() => ({ válido: true }));
    vi.mocked(GestorCredenciales).prototype.guardarCredenciales = vi.fn();

    render(<ConfiguracionCredenciales />);

    const botonGuardar = screen.getByRole('button', { name: /guardar credenciales/i });
    
    // Rellenar campos
    fireEvent.change(screen.getByLabelText(/nombre de usuario de lichess/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/token de api personal de lichess/i), {
      target: { value: 'lip_testtoken' }
    });
    fireEvent.change(screen.getByLabelText(/api key de groq/i), {
      target: { value: 'gsk_testkey' }
    });

    // Verificar estado inicial
    expect(botonGuardar).toHaveTextContent(/guardar credenciales/i);
    expect(botonGuardar).not.toBeDisabled();

    // Submit del formulario
    const form = botonGuardar.closest('form');
    fireEvent.submit(form!);

    // Verificar que se guardaron las credenciales
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/credenciales guardadas exitosamente/i);
    });
  });

  it('muestra mensaje de error cuando la validación falla', async () => {
    const mensajeError = 'El token de Lichess debe empezar con "lip_"';
    
    vi.mocked(GestorCredenciales).prototype.validarCredenciales = vi.fn(() => ({
      válido: false,
      error: mensajeError
    }));

    render(<ConfiguracionCredenciales />);

    // Rellenar campos con datos inválidos
    fireEvent.change(screen.getByLabelText(/nombre de usuario de lichess/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/token de api personal de lichess/i), {
      target: { value: 'invalid_token' }
    });
    fireEvent.change(screen.getByLabelText(/api key de groq/i), {
      target: { value: 'gsk_testkey' }
    });

    // Submit del formulario
    const form = screen.getByRole('button', { name: /guardar credenciales/i }).closest('form');
    fireEvent.submit(form!);

    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(mensajeError);
    });
  });

  it('muestra mensaje de éxito cuando se guardan las credenciales', async () => {
    vi.mocked(GestorCredenciales).prototype.validarCredenciales = vi.fn(() => ({ válido: true }));
    vi.mocked(GestorCredenciales).prototype.guardarCredenciales = vi.fn();

    render(<ConfiguracionCredenciales />);

    // Rellenar campos con datos válidos
    fireEvent.change(screen.getByLabelText(/nombre de usuario de lichess/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/token de api personal de lichess/i), {
      target: { value: 'lip_testtoken' }
    });
    fireEvent.change(screen.getByLabelText(/api key de groq/i), {
      target: { value: 'gsk_testkey' }
    });

    // Submit del formulario
    const form = screen.getByRole('button', { name: /guardar credenciales/i }).closest('form');
    fireEvent.submit(form!);

    // Verificar mensaje de éxito
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/credenciales guardadas exitosamente/i);
    });
  });

  it('limpia las credenciales cuando se hace clic en limpiar', async () => {
    const mockLimpiar = vi.fn();
    vi.mocked(GestorCredenciales).prototype.limpiarCredenciales = mockLimpiar;
    
    // Mock de window.confirm
    global.confirm = vi.fn(() => true);

    render(<ConfiguracionCredenciales />);

    const botonLimpiar = screen.getByRole('button', { name: /limpiar credenciales/i });
    fireEvent.click(botonLimpiar);

    await waitFor(() => {
      expect(mockLimpiar).toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent(/credenciales eliminadas exitosamente/i);
    });
  });

  it('llama al callback onGuardadoExitoso después de guardar', async () => {
    const mockCallback = vi.fn();
    
    vi.mocked(GestorCredenciales).prototype.validarCredenciales = vi.fn(() => ({ válido: true }));
    vi.mocked(GestorCredenciales).prototype.guardarCredenciales = vi.fn();

    render(<ConfiguracionCredenciales onGuardadoExitoso={mockCallback} />);

    // Rellenar campos
    fireEvent.change(screen.getByLabelText(/nombre de usuario de lichess/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/token de api personal de lichess/i), {
      target: { value: 'lip_testtoken' }
    });
    fireEvent.change(screen.getByLabelText(/api key de groq/i), {
      target: { value: 'gsk_testkey' }
    });

    // Submit
    const form = screen.getByRole('button', { name: /guardar credenciales/i }).closest('form');
    fireEvent.submit(form!);

    // Verificar que el callback es llamado después de 1 segundo
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});
