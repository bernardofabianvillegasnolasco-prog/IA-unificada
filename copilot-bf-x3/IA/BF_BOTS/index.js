export const MIS_BOTS = {"BF-LIDER":{nombre:"BF"}};
export async function responderConBotPropio(botId, prompt){
  const l = prompt.toLowerCase();

  if(l.includes("raiz cuadrada")){
    let m=l.match(/(\d+)/); if(m){ const n=parseFloat(m[0]); const r=Math.sqrt(n); return `La raiz cuadrada de ${n} es ${r.toFixed(4)}. Te explico, si multiplicas ${r.toFixed(4)} por ${r.toFixed(4)} te da ${n}, por eso es su raiz.`; }
  }
  if(l.includes("ladrillo")||l.includes("tabique")||l.includes("pegar")||l.includes("muro")){
    return `Te explico como pegar un ladrillo facil, como si estuvieramos en obra.\n\nPrimero alista hilo, plomada y nivel. Pones dos estacas y amarras el hilo bien tenso. Para que quede derecho usa la escuadra 3 4 5, marcas 60 cm de un lado, 80 del otro y la diagonal te debe dar 100 cm.\n\nLuego la mezcla, un bote de cemento por cuatro de arena, revuelves en seco y le echas agua poco a poco hasta que quede pastosa, no aguada.\n\nMoja el tabique 10 minutos, si no lo mojas te chupa el agua y no pega.\n\nYa para pegar, pones una cama de mezcla de un centimetro y medio, asientas el tabique, le das golpecitos con el mango y dejas un centimetro de junta. Cada hilada va cuatrapeada, o sea la de arriba a la mitad de la de abajo. Cada tres metros pon un castillo.\n\nPara un metro cuadrado ocupas 25 tabiques de 7 por 14 por 28.\n\nSi me dices cuanto mide tu muro te digo exacto cuantos ocupas.`;
  }
  if(l.includes("que es el sexo")){
    return `El sexo es la diferencia biologica entre hombre y mujer y tambien la relacion intima entre dos personas cuando hay confianza y consentimiento. Biologicamente se define por cromosomas y organos, y en pareja es una forma de mostrar afecto y tambien para tener hijos. Si quieres te explico con respeto sobre cuidado, proteccion y consentimiento.`;
  }

  try{
    const q = prompt.split(" ").filter(w=>w.length>3).slice(0,3).join(" ");
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,{signal:AbortSignal.timeout(3000)});
    if(r.ok){ const j=await r.json(); if(j.extract){ return j.extract.replace(/\*\*/g,"").slice(0,700); } }
  }catch{}

  return `Me preguntas por ${prompt}. Te lo explico simple y directo, como platicando con un amigo, paso a paso y sin rodeos. Dime que parte quieres que profundice y te lo detallo.`;
}
