export const MIS_BOTS = {"BF-LIDER":{nombre:"LIDER BF"}};
function calcular(t){const l=t.toLowerCase();let m=l.match(/raiz cuadrada de\s*(\d+)/i);if(m){const n=parseFloat(m[1]);const r=Math.sqrt(n);return `La raiz cuadrada de ${n} es ${r.toFixed(4)}, porque ${r.toFixed(4)} por ${r.toFixed(4)} te da ${n}.`;}return null;}
export async function responderConBotPropio(botId,prompt){
  const calc=calcular(prompt); if(calc) return calc;
  const l=prompt.toLowerCase();
  if(l.includes("ladrillo")||l.includes("tabique")||l.includes("pegar")){
    return `Mira, pegar un ladrillo es facil. Prepara hilo, plomada y nivel. Traza con hilo tenso y escuadra 3 4 5. Mezcla un bote de cemento con cuatro de arena y agua hasta que quede pastosa. Moja el tabique 10 minutos. Pon una cama de un centimetro y medio, asienta el tabique, dale golpecitos y deja un centimetro de junta. Cada hilada va cuatrapeada y cada tres metros pon castillo. Para un metro necesitas 25 tabiques.`;
  }
  if(l.includes("sexo")){
    return `El sexo es la diferencia biologica entre hombre y mujer y tambien la relacion intima entre dos personas. Biologicamente se define por cromosomas, hormonas y organos. En pareja es una forma de expresar afecto, placer y tambien para tener hijos. Si me preguntas por educacion sexual, te explico con respeto y claro, cuidado, consentimiento y proteccion.`;
  }
  if(l.includes("traduce")||l.includes("diccionario")){
    return `Claro, dime que palabra quieres traducir y a que idioma. Por ejemplo ladrillo en ingles es brick, hola es hello.`;
  }
  try{
    const kw=prompt.split(" ").filter(w=>w.length>3).slice(0,2).join(" ");
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`,{signal:AbortSignal.timeout(3000)});
    if(r.ok){const j=await r.json(); if(j.extract) return j.extract.replace(/\*\*/g,"").slice(0,600);}
  }catch{}
  return `Te explico ${prompt} de forma simple, como platicando, sin tecnicismos. Dime que parte quieres que profundice.`;
}
