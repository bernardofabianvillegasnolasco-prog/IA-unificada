export const MIS_BOTS = {
  "BF-UNIVERSAL": { nombre:"IA BF UNIVERSAL" }
};

export async function responderConBotPropio(botId, prompt){
  const l = prompt.toLowerCase();

  let mat = l.match(/(\d+)\s*[x×*]\s*(\d+)/i);
  if(mat){
    const a=parseFloat(mat[1]); const b=parseFloat(mat[2]);
    return `La respuesta de ${a} por ${b} es ${a*b}. Multiplicas ${a} veces ${b} y te da ${a*b}.`;
  }
  let raiz = l.match(/raiz cuadrada de\s*(\d+)/i);
  if(raiz){ const n=parseFloat(raiz[1]); const r=Math.sqrt(n); return `La raiz cuadrada de ${n} es ${r.toFixed(4)}, porque ${r.toFixed(4)} por ${r.toFixed(4)} te da ${n}.`; }

  if(l.includes("ladrillo")||l.includes("tabique")||l.includes("pegar")){
    return `Te explico como pegar un ladrillo facil. Alista hilo, plomada y nivel. Traza con hilo tenso y escuadra 3 4 5. Mezcla un bote de cemento por cuatro de arena con agua hasta pastosa. Moja el tabique 10 minutos. Pon cama de 1.5 cm, asienta con golpecitos, deja 1 cm de junta. Cada hilada va cuatrapeada y cada tres metros castillo. Para un metro ocupas 25 tabiques.`;
  }

  try{
    const q = prompt.split(" ").filter(w=>w.length>3).slice(0,3).join(" ") || prompt;
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,{headers:{"User-Agent":"BF-UNIVERSAL"},signal:AbortSignal.timeout(3000)});
    if(r.ok){ const j=await r.json(); if(j.extract) return j.extract.replace(/\*\*/g,"").slice(0,700); }
  }catch{}

  return `Me preguntas por ${prompt}. Te lo explico simple y directo, como platicando. Dime que quieres profundizar.`;
}
