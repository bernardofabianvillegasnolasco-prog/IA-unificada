export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcular(t){
  const l=t.toLowerCase();
  let m=l.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){
    const n=parseFloat(m[1]);
    if(n<0){ const r=Math.sqrt(Math.abs(n)); return `La raiz cuadrada de ${n} no existe en numeros reales, seria ${r}i, un numero imaginario.`;}
    const r=Math.sqrt(n);
    const res = Number.isInteger(r)? r : r.toFixed(4);
    return `Mira, la raiz cuadrada de ${n} es ${res}. Si multiplicas ${res} por ${res}, te da ${n}.`;
  }
  const mt=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i);
  if(mt){try{let e=mt[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return `El resultado de ${mt[0]} es ${r}.`;}}catch{}}
  return null;
}

function respuestaFluidaLadrillo(){
  return `Como pegar un ladrillo, te explico facil como si estuvieramos en la obra:

Primero prepara hilo, plomada, nivel, tu cuchara, botes, cemento y arena.

Luego traza derecho. Pon dos estacas y amarra el hilo bien tenso. Para escuadrar usa el 3 4 5, marcas 60 centimetros de un lado, 80 del otro, y la diagonal debe darte 100 centimetros. Asi queda a 90 grados.

Ahora la mezcla. Un bote de cemento por cuatro de arena. Mezcla en seco primero, despues le echas agua poco a poco hasta que quede pastosa, no aguada. Si la volteas no debe escurrir.

Moja el tabique 10 minutos en agua, si esta seco te chupa el agua del mortero y no pega.

Para pegar, pon una cama de mezcla de un centimetro y medio sobre la base, asienta el tabique y dale golpecitos con el mango de la cuchara hasta nivelarlo. Deja un centimetro de junta entre cada tabique.

Cada hilada va cuatrapeada, o sea el tabique de arriba queda a la mitad del de abajo, asi amarras el muro. Cada tres metros pon un castillo con cuatro varillas de tres octavos.

Para que te des una idea, para un metro cuadrado necesitas 25 tabiques de 7 por 14 por 28, medio bote de cemento y dos botes de arena.

Si me dices cuanto mide tu muro te calculo exacto cuantos necesitas.`;
}

function detectar(t){
  const l=t.toLowerCase().replace(/[()]/g," ");
  if(l.includes("ladrillo")||l.includes("tabique")||l.includes("pegar")||l.includes("albañil")||l.includes("muro")||l.includes("block")) return respuestaFluidaLadrillo();
  if(l.includes("traduce")||l.includes("diccionario")||l.includes("como se dice")){
    let m=l.match(/(?:traduce|diccionario|como se dice)\s+([a-záéíóúñ]+)/i);
    if(m){
      const dicc={hola:"hello", ladrillo:"brick", tabique:"brick", gracias:"thank you", casa:"house", agua:"water", cemento:"cement"};
      const p=m[1].toLowerCase();
      if(dicc[p]) return `La palabra ${p} en ingles se dice ${dicc[p]}. Por ejemplo, si dices ${p} alla te entienden como ${dicc[p]}.`;
      return `La palabra ${p} en ingles es ${p}, la busco y te digo. Dime a que idioma la quieres.`;
    }
  }
  if(l.includes("agricultura")||l.includes("cultivo")) return "La agricultura es cultivar la tierra. Necesitas suelo con pH entre 6 y 7, abono NPK, y agua unos 5 litros por metro al dia con riego por goteo. El maiz te da 8 toneladas por hectarea si lo cuidas.";
  if(l.includes("ganaderia")) return "La ganaderia es criar animales. Una vaca pesa unos 450 kilos, razas como Angus dan buena carne, y una lechera te da 25 litros diarios.";
  return null;
}

export async function buscarInternetReal(q){ try{ const kw=q.toLowerCase().replace(/como|que es|explica/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" "); if(!kw) return ""; const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v9.2"}, signal:AbortSignal.timeout(3000)}); if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,500);} }catch{} return ""; }

export async function responderConBotPropio(botId, prompt){
  const calc=calcular(prompt); if(calc) return calc;
  const det=detectar(prompt); if(det) return det;
  const web=await buscarInternetReal(prompt);
  if(web){
    // Limpia para voz natural
    let limpio = web.replace(/\*\*/g,"").replace(/\*/g,"").replace(/#/g,"");
    return limpio.slice(0,600);
  }
  return `Preguntaste por ${prompt}. Te lo explico de forma simple y directa, como platicando. Dime que parte quieres que profundice.`;
}
