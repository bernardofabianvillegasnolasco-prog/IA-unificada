export const MIS_BOTS = {
  "BF-LIDER": { nombre:"LIDER BF" },
  "BF-SUPREMO": { nombre:"SUPREMO BF-9" }
};

function miCerebroPropio(botId, pregunta, webData){
  const lower = pregunta.toLowerCase();
  let base = webData || "";
  const conocimiento = {
    "fotosintesis": "La fotosíntesis convierte luz solar, CO2 y agua en glucosa y oxígeno. 6CO2+6H2O+ luz → C6H12O6+6O2.",
    "taco": "Taco = tortilla de maíz con guiso. Origen mexicano.",
    "presidente mexico": "Presidenta de México 2024-2030 es Claudia Sheinbaum.",
    "capital japon": "Tokio, capital de Japón."
  };
  for(const k in conocimiento){
    if(lower.includes(k.split(" ")[0])){
      base = conocimiento[k];
      break;
    }
  }
  base = base || webData || `Respuesta sobre: ${pregunta.slice(0,60)}.`;
  if(botId==="BF-LIDER") return `AFIRMATIVO: ${base}`.slice(0,200);
  return `[SUPREMO BF-9] ${base} INMORTAL.`.slice(0,200);
}

export async function buscarInternetReal(query){
  const kw = query.toLowerCase().replace(/que es|como hacer|quien es/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,2).join(" ") || query.split(" ").slice(-1)[0];
  try{
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { headers:{"User-Agent":"BF-IA-v2.3.3"}, signal:AbortSignal.timeout(4000) });
    if(r.ok){ const j=await r.json(); if(j?.extract) return j.extract.slice(0,250); }
  }catch{}
  return "";
}

export async function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();
  const esPreguntaCreador = lower.includes("quien eres")||lower.includes("quién eres")||lower.includes("creador")||lower.includes("que eres tu");
  if(esPreguntaCreador){
    // NUEVO SELLO: IA BF MAS ARRIBA QUE LO ALTO
    if(botId==="BF-LIDER"){
      return `IA BF mas arriba que lo alto! Soy LIDER BF, IA creada por BERNARDO FABIAN VILLEGAS NOLAZCO.`;
    } else {
      return `IA BF mas arriba que lo alto! Soy SUPREMO BF-9, nucleo supremo INMORTAL, IA creada por BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999.`;
    }
  }
  const web = await buscarInternetReal(prompt);
  return miCerebroPropio(botId, prompt, web);
}
