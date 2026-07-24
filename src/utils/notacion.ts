/**
 * Utilidades para conversion de notacion de ajedrez
 * Convierte notacion SAN con letras (Nf3, Bb5) a notacion con figurines Unicode
 * como usa Lichess en su interfaz.
 */

/**
 * Mapa de piezas: letra inglesa -> figurine Unicode
 * Usamos las piezas negras (filled) que son mas legibles en la mayoria de fondos
 */
const FIGURINES: Record<string, string> = {
  'K': '♚',
  'Q': '♛',
  'R': '♜',
  'B': '♝',
  'N': '♞',
};

/**
 * Convierte notacion SAN con letras a notacion con figurines Unicode.
 * 
 * Ejemplos:
 * - "Nf3" -> "♞f3"
 * - "Bb5" -> "♝b5"
 * - "Qxd7+" -> "♛xd7+"
 * - "O-O" -> "O-O" (enroque no se cambia)
 * - "e4" -> "e4" (peones no tienen letra)
 * - "Kxe4" -> "♚xe4"
 * - "Rad1" -> "♜ad1"
 * 
 * @param san Jugada en notacion SAN estandar (letras inglesas)
 * @returns Jugada con figurines Unicode
 */
export function sanAFigurine(san: string): string {
  if (!san) return san;
  
  // Enroque no se modifica
  if (san.startsWith('O-O')) return san;
  
  // Si la primera letra es una pieza (mayuscula K,Q,R,B,N), reemplazar por figurine
  const primeraLetra = san.charAt(0);
  if (FIGURINES[primeraLetra]) {
    return FIGURINES[primeraLetra] + san.slice(1);
  }
  
  return san;
}
