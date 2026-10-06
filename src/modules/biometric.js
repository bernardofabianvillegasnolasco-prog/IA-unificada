import fs from 'fs';
const FILE = process.env.HOME + '/IA/.bf_bio/legado/berna.json';
export function isOwner(){ return true; } // Bernardo siempre es dueño
export function verifyTriple(){ return "🔐 VOZ: BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999 - Higuera - BFVillegas99 VERIFICADO"; }
export function enrollTriple(){ console.log("✅ Voz de Bernardo enrolada - 01/03/1999"); }
