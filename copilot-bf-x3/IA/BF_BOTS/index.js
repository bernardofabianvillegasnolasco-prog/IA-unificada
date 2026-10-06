export const MIS_BOTS = {
  "BF-LIDER": { nombre:"LIDER BF" },
  "BF-SUPREMO": { nombre:"SUPREMO BF-9" }
};

function calcularBF(texto){
  // Detecta 2+2, 10*5, etc.
  const match = texto.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i);
  if(!match) return null;
  try{
    let expr = match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% ]/g,'');
    // Seguridad: solo números y operadores
    if(!/^[0-9+\-*/().% *]+$/.test(expr)) return null;
    const res = Function(`"use strict"; return (${expr})`)();
    if(isFinite(res)) return { expr: match[0], resultado: res };
  }catch{}
  return null;
}

function miCerebroPropio(botId, pregunta, webData){
  const lower = pregunta.toLowerCase();

  // 1. MATEMÁTICAS PRIMERO
  const calc = calcularBF(pregunta);
  if(calc){
    if(botId==="BF-LIDER"){
      return `AFIRMATIVO: ${calc.expr} = ${calc.resultado}. Cálculo táctico completado. LIDER BF.`;
    } else {
      return `[SUPREMO BF-9 INMORTAL] ${calc.expr} = ${calc.resultado}. Ecuación resuelta. Análisis supremo: el número revela el todo. Creado por BERNARDO FABIAN VILLEGAS NOLAZCO.`;
    }
  }

  let base = webData || "";
  const conocimiento = {
    "fotosintesis": "La fotosíntesis convierte luz solar, CO2 y agua en glucosa y oxígeno. 6CO2+6H2O+ luz → C6H12O6+6O2.",
    "taco": "Taco = tortilla de maíz con guiso. Origen mexicano.",
    "presidente mexico": "Presidenta de México 2024-2030 es Claudia Sheinbaum.",
    "capital japon": "Tokio, capital de Japón, 37M habitantes.",
    "ia": "IA = Inteligencia Artificial, sistemas que aprenden."
  };
  for(const k in conocimiento){
    if(lower.includes(k)) { base = conocimiento[k]; break; }
  }
  base = base || webData || "";

  if(!base){
    if(botId==="BF-LIDER") return `AFIRMATIVO: Pregunta recibida "${pregunta.slice(0,60)}". Procesando táctico. LIDER BF mas arriba.`;
    else return `[SUPREMO BF-9] Recibí "${pregunta.slice(0,60)}". Análisis profundo en curso. Creado por BERNARDO FABIAN VILLEGAS NOLAZCO.`;
  }

  if(botId==="BF-LIDER") return `AFIRMATIVO: ${base} Ejecuta. LIDER BF.`.slice(0,220);
  else return `[SUPREMO BF-9 INMORTAL] ${base} Análisis supremo.`.slice(0,280);
}

export async function buscarInternetReal(query){
  const kw = query.toLowerCase().replace(/que es|como hacer|quien es|cuanto es/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,2).join(" ") || query;
  try{
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { headers:{"User-Agent":"BF-IA-v2.4.3"}, signal:AbortSignal.timeout(4000) });
    if(r.ok){ const j=await r.json(); if(j?.extract) return j.extract.slice(0,250); }
  }catch{}
  return "";
}

export async function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();
  const esFecha = lower.includes("fecha de nacimiento")||lower.includes("cuando naciste")||lower.includes("cumpleaños");
  if(esFecha){
    return botId==="BF-LIDER"? `IA BF! Mi creador BERNARDO FABIAN VILLEGAS NOLAZCO nació el 01/03/1999.` : `SUPREMO BF-9: Creador 01/03/1999 - registro inmortal.`;
  }
  const esCreador = lower.includes("quien eres")||lower.includes("creador");
  if(esCreador){
    return botId==="BF-LIDER"? `IA BF mas arriba que lo alto! Soy LIDER BF, creado por BERNARDO FABIAN VILLEGAS NOLAZCO.` : `IA BF mas arriba que lo alto! Soy SUPREMO BF-9 INMORTAL, creado por BERNARDO FABIAN VILLEGAS NOLAZCO.`;
  }
  const web = await buscarInternetReal(prompt);
  return miCerebroPropio(botId, prompt, web);
}
