/**
 * Ejemplos de uso de la validación de credenciales
 * Feature: lichess-game-analysis
 * Tarea: 2.4 Implementar validación de credenciales
 */

import { GestorCredenciales } from './GestorCredenciales';
import type { Credenciales } from '../../types/credenciales';

// Crear instancia del gestor
const gestor = new GestorCredenciales();

console.log('=== Ejemplos de Validación de Credenciales ===\n');

// Ejemplo 1: Credenciales válidas
console.log('1. Credenciales VÁLIDAS:');
const credencialesValidas: Credenciales = {
  nombreUsuario: 'usuario_test-123',
  tokenLichess: 'lip_abc123def456',
  apiKeyGroq: 'gsk_xyz789abc'
};

let resultado = gestor.validarCredenciales(credencialesValidas);
console.log(`   Resultado: ${resultado.válido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
if (resultado.error) console.log(`   Error: ${resultado.error}`);
console.log('');

// Ejemplo 2: Username vacío
console.log('2. Username VACÍO:');
const credencialesUsernameVacio: Credenciales = {
  nombreUsuario: '',
  tokenLichess: 'lip_abc123',
  apiKeyGroq: 'gsk_xyz789'
};

resultado = gestor.validarCredenciales(credencialesUsernameVacio);
console.log(`   Resultado: ${resultado.válido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
if (resultado.error) console.log(`   Error: ${resultado.error}`);
console.log('');

// Ejemplo 3: Username con caracteres especiales inválidos
console.log('3. Username con caracteres INVÁLIDOS (@):');
const credencialesUsernameInvalido: Credenciales = {
  nombreUsuario: 'test@user',
  tokenLichess: 'lip_abc123',
  apiKeyGroq: 'gsk_xyz789'
};

resultado = gestor.validarCredenciales(credencialesUsernameInvalido);
console.log(`   Resultado: ${resultado.válido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
if (resultado.error) console.log(`   Error: ${resultado.error}`);
console.log('');

// Ejemplo 4: Token Lichess sin prefijo "lip_"
console.log('4. Token Lichess SIN prefijo "lip_":');
const credencialesTokenInvalido: Credenciales = {
  nombreUsuario: 'testuser',
  tokenLichess: 'abc123def456',
  apiKeyGroq: 'gsk_xyz789'
};

resultado = gestor.validarCredenciales(credencialesTokenInvalido);
console.log(`   Resultado: ${resultado.válido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
if (resultado.error) console.log(`   Error: ${resultado.error}`);
console.log('');

// Ejemplo 5: API Key Groq vacía
console.log('5. API Key Groq VACÍA:');
const credencialesApiKeyVacia: Credenciales = {
  nombreUsuario: 'testuser',
  tokenLichess: 'lip_abc123',
  apiKeyGroq: ''
};

resultado = gestor.validarCredenciales(credencialesApiKeyVacia);
console.log(`   Resultado: ${resultado.válido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
if (resultado.error) console.log(`   Error: ${resultado.error}`);
console.log('');

// Ejemplo 6: Username con solo espacios
console.log('6. Username con SOLO ESPACIOS:');
const credencialesUsernameEspacios: Credenciales = {
  nombreUsuario: '   ',
  tokenLichess: 'lip_abc123',
  apiKeyGroq: 'gsk_xyz789'
};

resultado = gestor.validarCredenciales(credencialesUsernameEspacios);
console.log(`   Resultado: ${resultado.válido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
if (resultado.error) console.log(`   Error: ${resultado.error}`);
console.log('');

// Ejemplo 7: Uso en flujo completo (guardar)
console.log('7. Flujo completo - GUARDAR credenciales:');
try {
  gestor.guardarCredenciales(credencialesValidas);
  console.log('   ✅ Credenciales guardadas exitosamente');
} catch (error) {
  console.log('   ❌ Error al guardar:', (error as Error).message);
}
console.log('');

// Ejemplo 8: Intento de guardar credenciales inválidas
console.log('8. Flujo completo - RECHAZAR credenciales inválidas:');
try {
  gestor.guardarCredenciales(credencialesUsernameVacio);
  console.log('   ❌ ERROR: No debería llegar aquí');
} catch (error) {
  console.log('   ✅ Credenciales rechazadas correctamente');
  console.log('   Error:', (error as Error).message);
}
console.log('');

console.log('=== Fin de ejemplos ===');
