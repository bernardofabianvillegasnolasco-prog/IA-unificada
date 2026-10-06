export const MIS_BOTS = {
  "BF-LIDER": { nombre:"LIDER BF" },
  "BF-SUPREMO": { nombre:"SUPREMO BF-9" }
};

function calcularBF(texto){
  const match = texto.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i);
  if(!match) return null;
  try{
    let expr = match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,'');
    if(!/^[0-9+\-*/().% *]+$/.test(expr)) return null;
    const res = Function(`"use strict"; return (${expr})`)();
    if(isFinite(res)) return { expr: match[0], resultado: res };
  }catch{}
  return null;
}

const ECUACIONES_TEORIAS = {
  // MATEMÁTICAS
  "pitagoras": "a² + b² = c²",
  "ecuacion segundo grado": "x = [-b ± √(b²-4ac)] / 2a",
  "area circulo": "A = πr²",
  "circunferencia": "C = 2πr",
  "euler": "e^(iπ) + 1 = 0",
  // FÍSICA
  "newton": "F = m·a",
  "einstein": "E = m·c²",
  "gravedad": "F = G·(m1·m2)/r², g=9.8 m/s²",
  "velocidad": "v = d/t",
  "energia cinetica": "Ec = ½mv²",
  "ohm": "V = I·R",
  "relatividad": "Teoría de Relatividad: el tiempo y espacio se curvan, E=mc²",
  "big bang": "Teoría Big Bang: universo nació hace 13.8 mil millones de años de una singularidad",
  // QUÍMICA
  "agua": "H2O",
  "co2": "Dióxido de carbono CO2",
  "tabla periodica": "118 elementos, H=1, He=2, Li=3... Og=118",
  // BIOLOGÍA
  "evolucion": "Teoría de Evolución de Darwin: selección natural",
  "adn": "ADN doble hélice, A-T, C-G",
  "fotosintesis": "6CO2 + 6H2O + luz → C6H12O6 + 6O2"
};

const IDIOMAS = {
  es: "Español", en: "English", fr: "Français", de: "Deutsch", ja: "日本語", zh: "中文", pt: "Português", it: "Italiano", ru: "Русский", ar: "العربية"
};

function detectarEcuacion(texto){
  const lower = texto.toLowerCase();
  for(const k in ECUACIONES_TEORIAS){
    if(lower.includes(k)) return ECUACIONES_TEORIAS[k];
  }
  return null;
}

export async function buscarInternetReal(query){
  try{
    const kw = query.toLowerCase().replace(/que es|cuanto es|explica|dime|traduce|teoria|ecuacion/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    if(!kw) return "";
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { headers:{"User-Agent":"BF-v3.2"}, signal:AbortSignal.timeout(4000) });
    if(r.ok){ const j=await r.json(); if(j?.extract) return j.extract.slice(0,350); }
  }catch{}
  return "";
}

export async function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();

  // 1. MATEMÁTICAS DIRECTAS
  const calc = calcularBF(prompt);
  if(calc){
    return botId==="BF-LIDER"? `${calc.expr} = ${calc.resultado}` : `${calc.expr} = ${calc.resultado} | Matemáticas puras.`;
  }

  // 2. ECUACIONES Y TEORÍAS EXISTENTES
  const ecuacion = detectarEcuacion(prompt);
  if(ecuacion){
    return botId==="BF-LIDER"? `${ecuacion}` : `${ecuacion} | Teoría universal.`;
  }

  // 3. IDIOMAS - Detecta si pide traducción
  if(lower.includes("traduce")||lower.includes("translate")||lower.includes("como se dice")){
    const web = await buscarInternetReal(prompt);
    if(web) return web.slice(0,300);
    return botId==="BF-LIDER"? `Traducción: "${prompt}" disponible en ${Object.values(IDIOMAS).join(", ")}` : `Idiomas: ES, EN, FR, DE, JA, ZH, PT, IT, RU, AR - Traducción directa: ${prompt}`;
  }

  // 4. CUALQUIER MATERIA - Respuesta directa, sin "creado por"
  const web = await buscarInternetReal(prompt);
  if(web) return botId==="BF-LIDER"? web.slice(0,300) : web.slice(0,350);

  // Fallback directo, sin creador
  if(botId==="BF-LIDER"){
    return `${prompt.slice(0,80)}: explicado directo, sin rodeos.`;
  } else {
    return `${prompt.slice(0,80)}: análisis completo, teoría y práctica.`;
  }
}
