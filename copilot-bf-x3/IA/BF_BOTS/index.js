export const MIS_BOTS = {"BF-LIDER":{nombre:"LIDER BF"}};
export async function responderConBotPropio(botId,prompt){
  const l=prompt.toLowerCase();
  if(l.includes("ladrillo")||l.includes("tabique")||l.includes("pegar")){
    return `Te explico como pegar un ladrillo, facil y claro. Primero prepara hilo, plomada y nivel. Traza derecho con hilo tenso y escuadra 3 4 5. Mezcla un bote de cemento con cuatro de arena y agua hasta que quede pastosa. Moja el tabique 10 minutos. Pon una cama de un centimetro y medio, asienta el tabique con golpecitos y deja un centimetro de junta. Cada hilada va cuatrapeada y cada tres metros pon castillo. Para un metro necesitas 25 tabiques.`;
  }
  const m=l.match(/raiz cuadrada de\s*(\d+)/i); if(m){const n=parseFloat(m[1]);const r=Math.sqrt(n);return `La raiz cuadrada de ${n} es ${r.toFixed(4)}, porque si multiplicas ${r.toFixed(4)} por si mismo te da ${n}.`;}
  try{const kw=prompt.split(" ").filter(w=>w.length>3).slice(0,2).join(" "); const res=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`,{signal:AbortSignal.timeout(3000)}); if(res.ok){const j=await res.json(); if(j.extract) return j.extract.replace(/\*\*/g,"").slice(0,600);}}catch{}
  return `Me preguntas por ${prompt}, te lo explico simple y directo, como platicando.`;
}
