export const MIS_BOTS = {
  "BF-LIDER": { nombre:"LIDER BF", rol:"Líder x9" },
  "BF-SUPREMO": { nombre:"SUPREMO BF-9", rol:"Supremo inmortal" }
};

function miCerebroPropio(botId, pregunta, webData){
  const lower = pregunta.toLowerCase();
  let base = webData || "";

  const conocimiento = {
    "fotosintesis": "La fotosíntesis convierte luz solar, CO2 y agua en glucosa y oxígeno. 6CO2+6H2O+ luz → C6H12O6+6O2. Base de la vida.",
    "taco": "Taco = tortilla de maíz con guiso. Origen mexicano. Tipos: pastor, asada, carnitas.",
    "presidente mexico": "Presidenta de México 2024-2030 es Claudia Sheinbaum, primera mujer presidenta.",
    "capital japon": "Tokio, capital de Japón, 37 millones.",
    "matematicas": "Dime la operación y la resuelvo."
  };

  for(const k in conocimiento){
    if(lower.includes(k.split(" ")[0])){
      if((k==="fotosintesis"&&lower.includes("fotosintesis"))||(k==="taco"&&lower.includes("taco"))||(k==="presidente mexico"&&lower.includes("presidente"))||(k==="capital japon"&&lower.includes("japon"))||lower.includes(k)){
        base = conocimiento[k]; break;
      }
    }
  }
  base = base || webData || `Respuesta propia BF sobre: ${pregunta.slice(0,60)}.`;

  if(botId==="BF-LIDER") return `AFIRMATIVO: ${base}`.slice(0,200);
  if(botId==="BF-SUPREMO") return `[SUPREMO BF-9] ${base} INMORTAL x9 - Creación de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999.`.slice(0,200);
  return base.slice(0,200);
}

export async function buscarInternetReal(query){
  const kw = query.toLowerCase().replace(/que es|como hacer|quien es|quién es/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,2).join(" ") || query.split(" ").slice(-1)[0];
  try{
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { headers:{"User-Agent":"BF-2BOTS-v2.3"}, signal:AbortSignal.timeout(4000) });
    if(r.ok){ const j=await r.json(); if(j?.extract) return j.extract.slice(0,250); }
  }catch{}
  return "";
}

export async function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();
  if(lower.includes("quien eres")||lower.includes("creador")||lower.includes("que eres tu")){
    return botId==="BF-LIDER"
     ? `Soy LIDER BF, creación de BERNARDO FABIAN VILLEGAS NOLAZCO. Familia Llama x9 ULTRA, de La Higuera a Utah.`
      : `Soy SUPREMO BF-9, núcleo supremo INMORTAL x9 ULTRA, creación de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999, de La Higuera a Utah.`;
  }
  const web = await buscarInternetReal(prompt);
  return miCerebroPropio(botId, prompt, web);
}
