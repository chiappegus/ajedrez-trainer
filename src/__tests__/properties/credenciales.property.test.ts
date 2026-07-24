/**
 * Pruebas basadas en propiedades para GestorCredenciales
 * Feature: lichess-game-analysis
 * Valida: Propiedades 1-2 del diseño
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GestorCredenciales } from '../../services/credenciales/GestorCredenciales';
import type { Credenciales } from '../../types/credenciales';

// Configuración global para todas las pruebas de propiedades
const CONFIG_PBT = {
  numRuns: 100,
  verbose: false
};

// ============ Generadores Personalizados ============

/**
 * Generador de credenciales válidas
 */
const generadorCredenciales = (): fc.Arbitrary<Credenciales> => 
  fc.record({
    nombreUsuario: fc.stringMatching(/^[a-zA-Z0-9_-]{3,20}$/),
    username: fc.stringMatching(/^[a-zA-Z0-9_-]{3,20}$/),
    tokenLichess: fc.string({ minLength: 20, maxLength: 50 })
      .map(s => `lip_${s}`),
    apiKeyGroq: fc.string({ minLength: 30, maxLength: 60 })
      .map(s => `gsk_${s}`)
  });

/**
 * Generador de strings vacíos o con solo espacios en blanco
 */
const generadorStringVacio = (): fc.Arbitrary<string> =>
  fc.constantFrom('', '   ', '\t', '\n', '  \t  \n  ');

// ============ Propiedad 1: Validación de Credenciales Vacías ============

describe('Propiedad 1: Validación de credenciales vacías', () => {
  let gestor: GestorCredenciales;

  beforeEach(() => {
    gestor = new GestorCredenciales();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe rechazar credenciales con nombreUsuario vacío', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        generadorStringVacio(),
        (creds, stringVacio) => {
          // Crear credenciales con nombreUsuario vacío
          const credsInválidas: Credenciales = {
            ...creds,
            nombreUsuario: stringVacio
          };
          
          const resultado = gestor.validarCredenciales(credsInválidas);
          
          // Debe fallar la validación
          return resultado.válido === false && 
                 resultado.error !== undefined;
        }
      ),
      CONFIG_PBT
    );
  });

  it('debe rechazar credenciales con tokenLichess vacío', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        generadorStringVacio(),
        (creds, stringVacio) => {
          // Crear credenciales con tokenLichess vacío
          const credsInválidas: Credenciales = {
            ...creds,
            tokenLichess: stringVacio
          };
          
          const resultado = gestor.validarCredenciales(credsInválidas);
          
          // Debe fallar la validación
          return resultado.válido === false && 
                 resultado.error !== undefined;
        }
      ),
      CONFIG_PBT
    );
  });

  it('debe rechazar credenciales con apiKeyGroq vacía', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        generadorStringVacio(),
        (creds, stringVacio) => {
          // Crear credenciales con apiKeyGroq vacía
          const credsInválidas: Credenciales = {
            ...creds,
            apiKeyGroq: stringVacio
          };
          
          const resultado = gestor.validarCredenciales(credsInválidas);
          
          // Debe fallar la validación
          return resultado.válido === false && 
                 resultado.error !== undefined;
        }
      ),
      CONFIG_PBT
    );
  });

  it('debe rechazar credenciales con cualquier campo vacío', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        fc.constantFrom('nombreUsuario', 'tokenLichess', 'apiKeyGroq'),
        generadorStringVacio(),
        (creds, campo, stringVacio) => {
          // Crear credenciales con un campo vacío
          const credsInválidas: Credenciales = {
            ...creds,
            [campo]: stringVacio
          };
          
          const resultado = gestor.validarCredenciales(credsInválidas);
          
          // Debe fallar la validación
          return resultado.válido === false;
        }
      ),
      CONFIG_PBT
    );
  });

  it('debe aceptar credenciales con todos los campos válidos', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        (creds) => {
          const resultado = gestor.validarCredenciales(creds);
          
          // Debe pasar la validación
          return resultado.válido === true && 
                 resultado.error === undefined;
        }
      ),
      CONFIG_PBT
    );
  });
});

// ============ Propiedad 2: Round-trip de Almacenamiento ============

describe('Propiedad 2: Round-trip almacenamiento de credenciales', () => {
  let gestor: GestorCredenciales;

  beforeEach(() => {
    gestor = new GestorCredenciales();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe preservar credenciales después de guardar y cargar (round-trip)', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        (credsOriginales) => {
          // Guardar
          gestor.guardarCredenciales(credsOriginales);
          
          // Cargar
          const credsRecuperadas = gestor.cargarCredenciales();
          
          // Verificar equivalencia completa
          return credsRecuperadas !== null &&
                 credsRecuperadas.nombreUsuario === credsOriginales.nombreUsuario &&
                 credsRecuperadas.tokenLichess === credsOriginales.tokenLichess &&
                 credsRecuperadas.apiKeyGroq === credsOriginales.apiKeyGroq;
        }
      ),
      CONFIG_PBT
    );
  });

  it('debe encriptar tokens al almacenar (no deben estar en texto plano)', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        (creds) => {
          // Guardar
          gestor.guardarCredenciales(creds);
          
          // Obtener datos crudos de localStorage
          const datosJSON = localStorage.getItem('ajedrez_trainer_credenciales_v1');
          
          if (!datosJSON) return false;
          
          const datos = JSON.parse(datosJSON);
          
          // Los tokens deben estar encriptados (no deben ser iguales al original)
          const tokenNoEncriptado = datos.tokenLichessEncriptado === creds.tokenLichess;
          const apiKeyNoEncriptada = datos.apiKeyGroqEncriptada === creds.apiKeyGroq;
          
          // Debe retornar true si ambos están encriptados (no en texto plano)
          return !tokenNoEncriptado && !apiKeyNoEncriptada;
        }
      ),
      CONFIG_PBT
    );
  });

  it('debe mantener el nombreUsuario sin encriptar', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        (creds) => {
          // Guardar
          gestor.guardarCredenciales(creds);
          
          // Obtener datos crudos de localStorage
          const datosJSON = localStorage.getItem('ajedrez_trainer_credenciales_v1');
          
          if (!datosJSON) return false;
          
          const datos = JSON.parse(datosJSON);
          
          // El nombre de usuario debe estar en texto plano (no es información sensible)
          return datos.nombreUsuario === creds.nombreUsuario;
        }
      ),
      CONFIG_PBT
    );
  });

  it('debe incluir versión y timestamp al almacenar', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        (creds) => {
          const tiempoAntes = Date.now();
          
          // Guardar
          gestor.guardarCredenciales(creds);
          
          const tiempoDespués = Date.now();
          
          // Obtener datos crudos de localStorage
          const datosJSON = localStorage.getItem('ajedrez_trainer_credenciales_v1');
          
          if (!datosJSON) return false;
          
          const datos = JSON.parse(datosJSON);
          
          // Debe tener versión 1
          const tieneVersionCorrecta = datos.version === 1;
          
          // Debe tener timestamp válido entre tiempoAntes y tiempoDespués
          const tieneTimestampValido = 
            datos.fechaAlmacenamiento >= tiempoAntes &&
            datos.fechaAlmacenamiento <= tiempoDespués;
          
          return tieneVersionCorrecta && tieneTimestampValido;
        }
      ),
      CONFIG_PBT
    );
  });

  it('verificarExistenciaConfiguracion debe retornar true después de guardar', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        (creds) => {
          // Limpiar antes de esta prueba individual
          localStorage.clear();
          
          // Crear un gestor fresco
          const gestorLocal = new GestorCredenciales();
          
          // Antes de guardar debe ser false
          const antesDeSalvar = gestorLocal.verificarExistenciaConfiguracion();
          
          // Guardar
          gestorLocal.guardarCredenciales(creds);
          
          // Después de guardar debe ser true
          const despuesDeSalvar = gestorLocal.verificarExistenciaConfiguracion();
          
          return antesDeSalvar === false && despuesDeSalvar === true;
        }
      ),
      CONFIG_PBT
    );
  });

  it('limpiarCredenciales debe eliminar las credenciales guardadas', () => {
    fc.assert(
      fc.property(
        generadorCredenciales(),
        (creds) => {
          // Limpiar antes de esta prueba individual
          localStorage.clear();
          
          // Crear un gestor fresco
          const gestorLocal = new GestorCredenciales();
          
          // Guardar
          gestorLocal.guardarCredenciales(creds);
          
          // Verificar que existen
          const existenAntes = gestorLocal.verificarExistenciaConfiguracion();
          
          // Limpiar
          gestorLocal.limpiarCredenciales();
          
          // Verificar que ya no existen
          const existenDespués = gestorLocal.verificarExistenciaConfiguracion();
          const cargadasDespués = gestorLocal.cargarCredenciales();
          
          return existenAntes === true && 
                 existenDespués === false && 
                 cargadasDespués === null;
        }
      ),
      CONFIG_PBT
    );
  });
});
