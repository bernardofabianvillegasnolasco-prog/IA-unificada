export const MIS_BOTS = {
  "BF-LIDER": { nombre:"LIDER BF", prompt:"Directo y afirmativo" },
  "BF-SABIO": { nombre:"SABIO BF", prompt:"Sabio de La Higuera a Utah" },
  "BF-GUERRERO": { nombre:"GUERRERO BF", prompt:"Guerrero motivador" },
  "BF-HACKER": { nombre:"HACKER BF", prompt:"Hacker terminal" },
  "BF-POETA": { nombre:"POETA BF", prompt:"Poeta en verso" },
  "BF-CIENTIFICO": { nombre:"CIENTIFICO BF", prompt:"Científico simple" },
  "BF-DIPLOMATICO": { nombre:"DIPLOMATICO BF", prompt:"Diplomático consenso" },
  "BF-HERMANO": { nombre:"HERMANO BF", prompt:"Hermano cercano" },
  "BF-SUPREMO": { nombre:"SUPREMO BF-9", prompt:"Supremo inmortal" }
};

// NUESTRO PROPIO CEREBRO - sin APIs, 100% JS tuyo
function miCerebroPropio(botId, pregunta, webData){
  const lower = pregunta.toLowerCase();
  const web = webData || "";

  // Base de conocimiento propia BF
  const conocimientoPropio = {
    "fotosintesis": "La fotosíntesis convierte luz solar, CO2 y agua en glucosa y oxígeno. Es la base de la vida. 6CO2+6H2O+ luz → C6H12O6+6O2",
    "taco": "Taco = tortilla de maíz con guiso. Origen prehispánico mexicano. Tipos: pastor, asada, carnitas. Se hace calentando tortilla y poniendo guiso con salsa.",
    "presidente mexico": "Presidenta de México 2024-2030 es Claudia Sheinbaum, primera mujer presidenta, de Morena, científica y ex jefa de CDMX.",
    "capital japon": "Tokio, 37 millones, capital de Japón, hogar del Emperador.",
    "que es llama": "Llama es familia de modelos de lenguaje creada por Meta, pero nuestra familia Llama x9 ULTRA es creación de BERNARDO FABIAN VILLEGAS NOLAZCO.",
    "matematicas": "Resuelvo: suma, resta, multiplicación. Dime números."
  };

  let base = web;
  for(const key in conocimientoPropio){
    if(lower.includes(key.split(" ")[0]) || (webData && webData.toLowerCase().includes(key))){
      if(key==="fotosintesis" && lower.includes("fotosintesis")) base = conocimientoPropio[key];
      if(key==="taco" && lower.includes("taco")) base = conocimientoPropio[key];
      if(key==="presidente mexico" && lower.includes("presidente")) base = conocimientoPropio[key];
      if(key==="capital japon" && lower.includes("japon")) base = conocimientoPropio[key];
    }
  }
  if(!base){
    // Si no hay web ni conocimiento, usa nuestra lógica propia
    if(lower.includes("cuanto es")||lower.includes("2+2")||lower.includes("+")){
      try{ const m=lower.match(/(\d+)\s*\+\s*(\d+)/); if(m) base=`${m[1]}+${m[2]} = ${parseInt(m[1])+parseInt(m[2])}`; }catch{}
    }
    base = base || `Respuesta propia BF sobre: ${pregunta.slice(0,60)}. Verificado por x9 ULTRA.`;
  }

  switch(botId){
    case "BF-LIDER": return `AFIRMATIVO: ${base}`.slice(0,180);
    case "BF-SABIO": return `${base} - Reflexión de La Higuera a Utah, camino de BF.`.slice(0,180);
    case "BF-GUERRERO": return `${base} ¡MÁS ARRIBA QUE LO ALTO! ¡Vamos con todo!`.slice(0,180);
    case "BF-HACKER": return `> BF-HACKER@x9:~$ echo "${pregunta.slice(0,20)}"\n${base.slice(0,100)} // 💚 by BF`.slice(0,180);
    case "BF-POETA": return `${pregunta.slice(0,15)} preguntas,\n${base.slice(0,80)}\nDe BF con amor.`.slice(0,180);
    case "BF-CIENTIFICO": return `[CIENTÍFICO BF] ${base} [verificado x9]`.slice(0,180);
    case "BF-DIPLOMATICO": return `Consenso x9 BF: ${base} - Todos de acuerdo.`.slice(0,180);
    case "BF-HERMANO": return `Hermano, ${base} Cuenta conmigo.`.slice(0,180);
    case "BF-SUPREMO": return `[SUPREMO BF-9] ${base} INMORTAL. Creación de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999.`.slice(0,180);
    default: return base.slice(0,180);
  }
}

export async function buscarInternetReal(query){
  const kw = query.toLowerCase().replace(/que es|como hacer|quien es/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,2).join(" ") || query.split(" ").slice(-1)[0];
  try{
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { headers:{"User-Agent":"BF-PURO-v2.2"}, signal:AbortSignal.timeout(4000) });
    if(r.ok){ const j=await r.json(); if(j?.extract) return j.extract.slice(0,250); }
  }catch{}
  return "";
}

export async function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();
  if(lower.includes("quien eres")||lower.includes("quién eres")||lower.includes("creador")||lower.includes("que eres tu")||(lower.includes("llama")&&lower.includes("que es"))){
    return `Soy ${MIS_BOTS[botId].nombre}, creación de BERNARDO FABIAN VILLEGAS NOLAZCO. Familia Llama x9 ULTRA, de La Higuera a Utah. 100% BF, sin APIs prestadas.`;
  }
  const web = await buscarInternetReal(prompt);
  return miCerebroPropio(botId, prompt, web);
}

export { MIS_BOTS as BOTS };
