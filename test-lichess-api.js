// Script de prueba para la API de Lichess
// Lee credenciales de .env.local y prueba la conexión

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configurar __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env.local
config({ path: resolve(__dirname, '.env.local') });

const username = process.env.VITE_LICHESS_USERNAME;
const token = process.env.VITE_LICHESS_API_TOKEN;

console.log('🎮 Test de conexión a la API de Lichess\n');
console.log('═══════════════════════════════════════\n');

// Validar que existen las credenciales
if (!username || !token) {
  console.error('❌ Error: No se encontraron las credenciales en .env.local');
  console.error('   Asegúrate de que existen:');
  console.error('   - VITE_LICHESS_USERNAME');
  console.error('   - VITE_LICHESS_API_TOKEN\n');
  process.exit(1);
}

console.log(`📋 Usuario: ${username}`);
console.log(`🔑 Token: ${token.substring(0, 10)}...`);
console.log('');

// Construir la URL de la API
const apiUrl = `https://lichess.org/api/games/user/${username}?max=1&pgnInJson=true`;

console.log('🔄 Realizando petición a la API de Lichess...\n');

try {
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/x-ndjson'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error('❌ Error 401: Token de autorización inválido');
      console.error('   Verifica que el token sea correcto en .env.local');
      console.error('   Genera uno nuevo en: https://lichess.org/account/oauth/token\n');
      process.exit(1);
    } else if (response.status === 404) {
      console.error('❌ Error 404: Usuario no encontrado');
      console.error('   Verifica que el username sea correcto en .env.local\n');
      process.exit(1);
    } else {
      console.error(`❌ Error ${response.status}: ${response.statusText}\n`);
      process.exit(1);
    }
  }

  console.log('✅ Conexión exitosa a la API de Lichess!\n');

  // Leer el contenido (NDJSON - una línea por partida)
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    console.log('⚠️  El usuario no tiene partidas registradas\n');
    process.exit(0);
  }

  // Parsear la primera línea (primera partida)
  const lines = text.trim().split('\n');
  const gameData = JSON.parse(lines[0]);

  console.log('📊 Información de la última partida:\n');
  console.log('───────────────────────────────────────');
  
  // Fecha
  const gameDate = new Date(gameData.createdAt);
  console.log(`📅 Fecha: ${gameDate.toLocaleString('es-ES')}`);
  
  // Jugadores
  const whitePlayer = gameData.players.white.user?.name || 'Anónimo';
  const blackPlayer = gameData.players.black.user?.name || 'Anónimo';
  console.log(`👥 Blancas: ${whitePlayer}`);
  console.log(`👥 Negras: ${blackPlayer}`);
  
  // Resultado
  const winner = gameData.winner;
  let resultado = 'Tablas';
  if (winner === 'white') {
    resultado = `Victoria de blancas (${whitePlayer})`;
  } else if (winner === 'black') {
    resultado = `Victoria de negras (${blackPlayer})`;
  }
  console.log(`🏆 Resultado: ${resultado}`);
  
  // Variante y control de tiempo
  console.log(`♟️  Variante: ${gameData.variant || 'Standard'}`);
  console.log(`⏱️  Ritmo: ${gameData.speed || 'N/A'}`);
  
  // Estado de la partida
  console.log(`📌 Estado: ${gameData.status}`);
  
  console.log('───────────────────────────────────────\n');
  
  // Mostrar el PGN (primeros 200 caracteres)
  if (gameData.pgn) {
    console.log('📝 PGN (primeros 200 caracteres):\n');
    const pgnPreview = gameData.pgn.substring(0, 200);
    console.log(pgnPreview);
    if (gameData.pgn.length > 200) {
      console.log('...\n');
    } else {
      console.log('\n');
    }
  } else {
    console.log('⚠️  No se encontró el PGN de la partida\n');
  }

  console.log('✅ Test completado exitosamente!\n');

} catch (error) {
  console.error('❌ Error al conectar con la API de Lichess:');
  console.error(`   ${error.message}\n`);
  
  if (error.cause) {
    console.error('Detalles del error:');
    console.error(error.cause);
  }
  
  process.exit(1);
}
