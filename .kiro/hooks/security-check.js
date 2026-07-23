#!/usr/bin/env node

// Script de verificación de seguridad para detectar contenido sensible en archivos

import { readFileSync } from 'fs';
import { stdin } from 'process';

// Leer el contexto del hook desde stdin
let input = '';
for await (const chunk of stdin) {
  input += chunk;
}

const context = JSON.parse(input);
const filePath = context.file?.path;

if (!filePath) {
  console.error('❌ No se proporcionó la ruta del archivo');
  process.exit(1);
}

// Ignorar archivos .env.local y .env.example (se asume que son intencionales)
if (filePath.endsWith('.env.local') || filePath.endsWith('.env.example')) {
  console.log('✅ Archivo de configuración ignorado (permitido)');
  process.exit(0);
}

try {
  const content = readFileSync(filePath, 'utf-8');
  
  // Patrones de contenido sensible
  const sensitivePatterns = [
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, tipo: 'Contraseña en texto plano' },
    { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, tipo: 'API Key en texto plano' },
    { pattern: /secret\s*[:=]\s*['"][^'"]+['"]/gi, tipo: 'Secret en texto plano' },
    { pattern: /token\s*[:=]\s*['"][^'"]+['"]/gi, tipo: 'Token en texto plano' },
    { pattern: /private[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, tipo: 'Private Key en texto plano' },
    { pattern: /lip_[a-zA-Z0-9]{20,}/g, tipo: 'Lichess API Token' },
    { pattern: /gsk_[a-zA-Z0-9]{20,}/g, tipo: 'Groq API Key' },
    { pattern: /Bearer\s+[a-zA-Z0-9_-]{20,}/gi, tipo: 'Bearer Token' }
  ];
  
  const encontrados = [];
  
  for (const { pattern, tipo } of sensitivePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      encontrados.push({ tipo, cantidad: matches.length });
    }
  }
  
  if (encontrados.length > 0) {
    console.log('⚠️  ADVERTENCIA: Contenido sensible detectado en el archivo');
    console.log('─────────────────────────────────────────────────────');
    console.log(`📁 Archivo: ${filePath}\n`);
    
    for (const { tipo, cantidad } of encontrados) {
      console.log(`  🔒 ${tipo} (${cantidad} ocurrencia${cantidad > 1 ? 's' : ''})`);
    }
    
    console.log('\n💡 Recomendaciones:');
    console.log('  • Usa variables de entorno (.env.local) para credenciales');
    console.log('  • Verifica que .env.local esté en .gitignore');
    console.log('  • NO commites credenciales reales al repositorio\n');
    
    // No falla el hook, solo advierte
    process.exit(0);
  }
  
  console.log('✅ No se detectó contenido sensible');
  process.exit(0);
  
} catch (error) {
  console.error(`❌ Error al verificar el archivo: ${error.message}`);
  process.exit(1);
}
