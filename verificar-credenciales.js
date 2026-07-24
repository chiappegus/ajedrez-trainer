/**
 * Script de verificación de credenciales desde .env.local
 * 
 * Ejecuta este script para verificar que las variables de entorno
 * están correctamente configuradas en .env.local
 * 
 * Uso: node verificar-credenciales.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuración de credenciales...\n');

// Leer archivo .env.local
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: No se encontró el archivo .env.local');
  console.log('   Crea un archivo .env.local en la raíz del proyecto con:');
  console.log('   VITE_LICHESS_USERNAME=tu_usuario');
  console.log('   VITE_LICHESS_API_TOKEN=lip_...');
  console.log('   VITE_GROQ_API_KEY=gsk_...');
  process.exit(1);
}

console.log('✅ Archivo .env.local encontrado\n');

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

const variables = {
  'VITE_LICHESS_USERNAME': null,
  'VITE_LICHESS_API_TOKEN': null,
  'VITE_GROQ_API_KEY': null
};

// Parsear variables
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || trimmed === '') continue;
  
  const [key, ...valueParts] = trimmed.split('=');
  const value = valueParts.join('=').trim();
  
  if (key && variables.hasOwnProperty(key)) {
    variables[key] = value;
  }
}

// Verificar cada variable
let allOk = true;

console.log('📋 Variables encontradas:\n');

for (const [key, value] of Object.entries(variables)) {
  if (!value || value === '') {
    console.log(`❌ ${key}: NO DEFINIDA`);
    allOk = false;
  } else {
    // Mostrar solo primeros 10 caracteres por seguridad
    const preview = value.length > 10 ? value.substring(0, 10) + '...' : value;
    console.log(`✅ ${key}: ${preview}`);
    
    // Validaciones específicas
    if (key === 'VITE_LICHESS_API_TOKEN' && !value.startsWith('lip_')) {
      console.log(`   ⚠️  ADVERTENCIA: El token de Lichess debe empezar con "lip_"`);
      allOk = false;
    }
    
    if (key === 'VITE_GROQ_API_KEY' && !value.startsWith('gsk_')) {
      console.log(`   ⚠️  ADVERTENCIA: La API key de Groq debe empezar con "gsk_"`);
      allOk = false;
    }
  }
}

console.log('\n');

if (allOk) {
  console.log('✅ ¡Configuración correcta! Las credenciales se cargarán automáticamente.');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Inicia el servidor: npm run dev');
  console.log('   2. Abre DevTools (F12) → Console');
  console.log('   3. Limpia localStorage: localStorage.clear()');
  console.log('   4. Recarga la página (F5)');
  console.log('   5. Verifica el log: "Credenciales cargadas desde .env.local"');
  console.log('   6. La app debe ir directo a pantalla principal');
  process.exit(0);
} else {
  console.log('❌ Hay problemas con la configuración. Revisa los errores arriba.');
  console.log('\n📝 Para corregir:');
  console.log('   1. Abre el archivo .env.local');
  console.log('   2. Asegúrate de que todas las variables estén definidas');
  console.log('   3. Verifica que el token de Lichess empiece con "lip_"');
  console.log('   4. Verifica que la API key de Groq empiece con "gsk_"');
  console.log('   5. Ejecuta este script nuevamente para verificar');
  process.exit(1);
}
