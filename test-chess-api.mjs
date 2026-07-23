import { Chess } from 'chess.js';

const pgn = `[Event "Test"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 1-0`;

try {
  const chess = new Chess();
  console.log('Intentando cargar PGN...');
  const resultado = chess.loadPgn(pgn);
  console.log('Resultado de loadPgn:', resultado);
  console.log('Header:', chess.header());
  console.log('History:', chess.history());
  console.log('PGN:', chess.pgn());
} catch (error) {
  console.error('Error:', error.message);
}
