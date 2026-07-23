/**
 * Pruebas unitarias para GestorCredenciales
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1.9, 0.2.1, 0.2.5, 0.3.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GestorCredenciales } from '../../services/credenciales/GestorCredenciales';
import type { Credenciales } from '../../types/credenciales';

describe('GestorCredenciales', () => {
  let gestor: GestorCredenciales;

  beforeEach(() => {
    gestor = new GestorCredenciales();
    // Limpiar localStorage antes de cada prueba
    localStorage.clear();
  });

  afterEach(() => {
    // Limpiar después de cada prueba
    localStorage.clear();
  });

  describe('validarCredenciales', () => {
    it('debe aceptar credenciales válidas con token que empiece con lip_', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: 'lip_abc123def456',
        apiKeyGroq: 'gsk_xyz789'
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(true);
      expect(resultado.error).toBeUndefined();
    });

    it('debe rechazar credenciales con nombre de usuario vacío', () => {
      const credenciales: Credenciales = {
        nombreUsuario: '',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(false);
      expect(resultado.error).toBe('El nombre de usuario es requerido');
    });

    it('debe rechazar credenciales con nombre de usuario solo espacios', () => {
      const credenciales: Credenciales = {
        nombreUsuario: '   ',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(false);
      expect(resultado.error).toBe('El nombre de usuario es requerido');
    });

    it('debe rechazar credenciales con token Lichess vacío', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: '',
        apiKeyGroq: 'gsk_xyz789'
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(false);
      expect(resultado.error).toBe('El token de Lichess es requerido');
    });

    it('debe rechazar credenciales con API Key Groq vacía', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: ''
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(false);
      expect(resultado.error).toBe('La API Key de Groq es requerida');
    });

    it('debe rechazar username con caracteres especiales inválidos', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'test@user',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(false);
      expect(resultado.error).toContain('letras, números, guiones y guiones bajos');
    });

    it('debe aceptar username con guiones y guiones bajos', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'test-user_123',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(true);
    });

    it('debe rechazar token Lichess que no empiece con lip_', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: 'abc123def456',
        apiKeyGroq: 'gsk_xyz789'
      };

      const resultado = gestor.validarCredenciales(credenciales);

      expect(resultado.válido).toBe(false);
      expect(resultado.error).toContain('lip_');
    });

    it('debe rechazar credenciales null', () => {
      const resultado = gestor.validarCredenciales(null as any);

      expect(resultado.válido).toBe(false);
      expect(resultado.error).toBe('Las credenciales no pueden estar vacías');
    });
  });

  describe('guardarCredenciales y cargarCredenciales', () => {
    it('debe guardar y cargar credenciales correctamente (round-trip)', () => {
      const credencialesOriginales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: 'lip_abc123def456',
        apiKeyGroq: 'gsk_xyz789abc'
      };

      gestor.guardarCredenciales(credencialesOriginales);
      const credencialesRecuperadas = gestor.cargarCredenciales();

      expect(credencialesRecuperadas).not.toBeNull();
      expect(credencialesRecuperadas?.nombreUsuario).toBe(credencialesOriginales.nombreUsuario);
      expect(credencialesRecuperadas?.tokenLichess).toBe(credencialesOriginales.tokenLichess);
      expect(credencialesRecuperadas?.apiKeyGroq).toBe(credencialesOriginales.apiKeyGroq);
    });

    it('debe encriptar los tokens al guardar', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      gestor.guardarCredenciales(credenciales);

      // Obtener datos crudos de localStorage
      const datosJSON = localStorage.getItem('ajedrez_trainer_credenciales_v1');
      expect(datosJSON).not.toBeNull();

      const datos = JSON.parse(datosJSON!);
      
      // El token debe estar encriptado (no debe ser igual al original)
      expect(datos.tokenLichessEncriptado).not.toBe(credenciales.tokenLichess);
      expect(datos.apiKeyGroqEncriptada).not.toBe(credenciales.apiKeyGroq);
      
      // Pero el nombre de usuario debe estar en texto plano
      expect(datos.nombreUsuario).toBe(credenciales.nombreUsuario);
    });

    it('debe rechazar guardar credenciales inválidas', () => {
      const credencialesInvalidas: Credenciales = {
        nombreUsuario: '',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      expect(() => {
        gestor.guardarCredenciales(credencialesInvalidas);
      }).toThrow();
    });

    it('debe retornar null cuando no hay credenciales almacenadas', () => {
      const credenciales = gestor.cargarCredenciales();
      expect(credenciales).toBeNull();
    });
  });

  describe('limpiarCredenciales', () => {
    it('debe eliminar credenciales de localStorage', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      gestor.guardarCredenciales(credenciales);
      expect(gestor.cargarCredenciales()).not.toBeNull();

      gestor.limpiarCredenciales();
      expect(gestor.cargarCredenciales()).toBeNull();
    });
  });

  describe('verificarExistenciaConfiguracion', () => {
    it('debe retornar false cuando no hay credenciales', () => {
      expect(gestor.verificarExistenciaConfiguracion()).toBe(false);
    });

    it('debe retornar true cuando existen credenciales', () => {
      const credenciales: Credenciales = {
        nombreUsuario: 'testuser',
        tokenLichess: 'lip_abc123',
        apiKeyGroq: 'gsk_xyz789'
      };

      gestor.guardarCredenciales(credenciales);
      expect(gestor.verificarExistenciaConfiguracion()).toBe(true);
    });
  });
});
