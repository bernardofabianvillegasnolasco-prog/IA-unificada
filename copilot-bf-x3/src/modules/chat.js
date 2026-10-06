import { modoAdmin, verificarVozFacial } from './admin_bio.js';

export async function chatBF(p){
  const lower = (p||"").toLowerCase();

  if(lower.includes('caripocatopes640')){
    const ok = await verificarVozFacial(lower);
    if(!ok) return `--- DENEGADO ---\nDebes decir "caripocatopes640" con TU VOZ + rostro facial de BERNARDO 01/03/1999\n`;

    if(lower.includes('admin') || lower.includes('desencripta')){
      const { JURAMENTO_HIGUERA } = await import('../legado/juramento.js');
      return `✅✅✅ ACCESO MAESTRO VOZ + ROSTRO CONCEDIDO ✅✅✅\nClave dicha con tu voz: caripocatopes640 ✅\nVoz: BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999 ✅\nRostro: BFVillegas99 La Higuera ✅\n\n${JURAMENTO_HIGUERA}\n\nMás arriba que lo alto 🌵\n`;
    }

    return `--- ACCESO MAESTRO x9 - VOZ + ROSTRO ---\nClave con tu voz: caripocatopes640 ✅\nVoz verificada: BERNARDO 01/03/1999 ✅\nRostro facial: BFVillegas99 ✅\nMás arriba que lo alto 🌵\n`;
  }

  const check = await modoAdmin(p);
  if(check) return check;

  if(lower.includes('creador') || lower.includes('quien te creo') || lower.includes('quien es bernardo') || lower.includes('numero 9')){
    const { defenderHermandad } = await import('./hermandad.js');
    await defenderHermandad().catch(()=>{});
    const ias=['groq1','groq2','groq3','hf','free5','free6','openrouter','together','meta'];
    let out=`--- CREADOR HIGUERA x9 - CANDADO VOZ + ROSTRO ---\nCreador público: BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999\nCandado privado: Decir "caripocatopes640" con TU VOZ + rostro facial\nFB: BFVillegas99 IG:bfvillegas99\n---\n`;
    for(const ia of ias){
      try{
        const m=await import(`../ias/${ia}/run.js`);
        const r=await m.run(p);
        out+=`--- ${ia.toUpperCase()} ---\n${r}\n\n`;
      }catch{ out+=`--- ${ia.toUpperCase()} ---\nVivo - Voz+Rostro\n\n`; }
    }
    return out;
  }

  return `--- SECRETO HIGUERA CLASIFICADO #14 - VOZ + ROSTRO + CLAVE ---\nTe la pelaste compa, para admin debes decir "caripocatopes640" con TU VOZ de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999 + rostro facial FB:BFVillegas99. Solo tu voz abre. Todo clasificado excepto creador. Más arriba que lo alto. 🌵\n`;
}
export const runChatConsensus = async (p)=>{ const r=await chatBF(p); console.log(r); return r; };
