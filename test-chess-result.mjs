import { Chess } from 'chess.js';

const pgn1 = `[Event "Test"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 1-0`;

const chess = new Chess();
chess.loadPgn(pgn1);

console.log('Header Result:', chess.header().Result);
console.log('Is game over?:', chess.isGameOver());
console.log('Is checkmate?:', chess.isCheckmate());

// Probar con PGN sin resultado en las jugadas
const pgn2 = `[Event "Test"]
[Site "lichess.org"]
[Date "2024.01.15"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3`;

const chess2 = new Chess();
chess2.loadPgn(pgn2);
console.log('\n--- Sin resultado en jugadas ---');
console.log('Header Result:', chess2.header().Result);
console.log('PGN generado:', chess2.pgn());
