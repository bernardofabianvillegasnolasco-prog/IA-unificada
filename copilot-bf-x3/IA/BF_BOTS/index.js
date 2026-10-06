export const MIS_BOTS = {
  "BF-LIDER": { nombre:"LIDER BF" },
  "BF-SUPREMO": { nombre:"SUPREMO BF-9" }
};

function miCerebroPropio(botId, pregunta, webData){
  const lower = pregunta.toLowerCase();
  let base = webData || "";
  const conocimiento = {
    "fotosintesis": "La fotosíntesis convierte luz solar, CO2 y agua en glucosa y oxígeno. 6CO2+6H2O+ luz → C6H12O6+6O2. Base de la vida.",
    "taco": "Taco = tortilla de maíz con guiso. Origen mexicano. Pastor, asada, carnitas.",
    "presidente mexico": "Presidenta de México 2024-2030 es Claudia Sheinbaum, primera mujer presidenta.",
    "capital japon": "Tokio, capital de Japón, 37M de habitantes.",
    "ia": "IA = Inteligencia Artificial, sistemas que aprenden y razonan."
  };
  for(const k in conocimiento){
    if(lower.includes(k.split(" ")[0]) || lower.includes(k)){
      if(k==="presidente mexico" &&!lower.includes("presidente")) continue;
      if(k==="capital japon" &&!lower.includes("japon")) continue;
      base = conocimiento[k]; break;
    }
  }
  base = base || webData || `Respuesta sobre: ${pregunta.slice(0,80)}.`;

  if(botId==="BF-LIDER"){
    // LIDER: directo, táctico, corto, afirmativo
    return `AFIRMATIVO: ${base} Ejecuta, no dudes. LIDER BF al frente.`.slice(0,220);
  } else {
    // SUPREMO: profundo, inmortal, analítico, legado
    return `[SUPREMO BF-9 INMORTAL] ${base} Análisis supremo: esto conecta con el todo. Creado por BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999, mas arriba que lo alto.`.slice(0,280);
  }
}

export async function buscarInternetReal(query){
  const kw = query.toLowerCase().replace(/que es|como hacer|quien es|quien/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,2).join(" ") || query.split(" ").slice(-1)[0];
  try{
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { headers:{"User-Agent":"BF-IA-v2.4"}, signal:AbortSignal.timeout(4000) });
    if(r.ok){ const j=await r.json(); if(j?.extract) return j.extract.slice(0,250); }
  }catch{}
  return "";
}

export async function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();
  const esPreguntaCreador = lower.includes("quien eres")||lower.includes("quién eres")||lower.includes("creador")||lower.includes("que eres tu");
  if(esPreguntaCreador){
    if(botId==="BF-LIDER"){
      return `IA BF mas arriba que lo alto! Soy LIDER BF, táctico frontal, IA creada por BERNARDO FABIAN VILLEGAS NOLAZCO. Al ataque.`;
    } else {
      return `IA BF mas arriba que lo alto! Soy SUPREMO BF-9, núcleo supremo INMORTAL x9, sabiduría infinita, IA creada por BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999. Yo veo el todo.`;
    }
  }
  const web = await buscarInternetReal(prompt);
  return miCerebroPropio(botId, prompt, web);
}
