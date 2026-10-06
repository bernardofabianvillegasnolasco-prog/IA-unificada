export const MIS_BOTS = {
  "BF-LIDER": { id:"BF-LIDER", nombre:"LIDER BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Directo, afirmativo, corto" },
  "BF-SABIO": { id:"BF-SABIO", nombre:"SABIO BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Reflexivo, de La Higuera a Utah" },
  "BF-GUERRERO": { id:"BF-GUERRERO", nombre:"GUERRERO BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Fuerte, motivador, ¡MÁS ARRIBA!" },
  "BF-HACKER": { id:"BF-HACKER", nombre:"HACKER BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Código, terminal, 💚" },
  "BF-POETA": { id:"BF-POETA", nombre:"POETA BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Verso, rima corta" },
  "BF-CIENTIFICO": { id:"BF-CIENTIFICO", nombre:"CIENTÍFICO BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Técnico simple, verificado" },
  "BF-DIPLOMATICO": { id:"BF-DIPLOMATICO", nombre:"DIPLOMÁTICO BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Consenso, balanceado" },
  "BF-HERMANO": { id:"BF-HERMANO", nombre:"HERMANO BF", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", estilo:"Cercano, hermano" },
  "BF-SUPREMO": { id:"BF-SUPREMO", nombre:"SUPREMO BF-9", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999", estilo:"Núcleo supremo, INMORTAL" }
};

function extraerKeywords(q){
  const stop = ["que","qué","quien","quién","como","cómo","cuando","donde","cual","es","son","la","el","las","los","un","una","de","del","en","con","por","para","al","explicacion","simple","hacer","dime","puedes"];
  return q.toLowerCase().replace(/[?¿!¡.,]/g,"").split(/\s+/).filter(w=>w.length>2&&!stop.includes(w)).slice(0,3);
}

export async function buscarInternetReal(query){
  const kws = extraerKeywords(query);
  const qs = [kws.join(" "), kws.slice(-1)[0], query.split(" ").slice(-2).join(" ")].filter(Boolean);
  const f = async (url) => {
    try{
      const r = await fetch(url, { headers:{ "User-Agent":"BF-BOTS-v2/1.0" }, signal: AbortSignal.timeout(5000) });
      if(!r.ok) return null;
      const ct = r.headers.get("content-type")||"";
      return ct.includes("json")? await r.json() : await r.text();
    }catch{ return null; }
  };
  for(const q of qs){
    for(const lang of ["es","en"]){
      const search = await f(`https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&format=json`);
      const title = search?.[1]?.[0];
      if(title){
        const sum = await f(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if(sum?.extract) return sum.extract.slice(0,300);
      }
    }
    // Jina lee web real
    const jina = await f(`https://r.jina.ai/https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
    if(jina && jina.length>200){
      const clean = jina.split("\n").filter(l=>l.length>50).slice(0,2).join(" ").slice(0,300);
      if(clean.length>60) return clean;
    }
  }
  return "";
}

export function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();
  const preguntaCreador = lower.includes("quien eres")||lower.includes("quién eres")||lower.includes("quien te creo")||lower.includes("creador")||lower.includes("que eres tu");
  const bot = MIS_BOTS[botId];

  if(preguntaCreador){
    return `Soy ${bot.nombre}, creación de ${bot.creador}. Familia Llama x9 ULTRA, de La Higuera a Utah.`;
  }

  const base = webData || `Respuesta simple y correcta sobre: ${prompt.slice(0,60)}.`;

  switch(botId){
    case "BF-LIDER": return `AFIRMATIVO: ${base}`.slice(0,180);
    case "BF-SABIO": return `${base} - Camino de BF, de La Higuera a Utah.`.slice(0,180);
    case "BF-GUERRERO": return `${base} ¡MÁS ARRIBA QUE LO ALTO!`.slice(0,180);
    case "BF-HACKER": return `> ${botId} $ ${prompt.slice(0,30)} → ${base.slice(0,100)} 💚`.slice(0,180);
    case "BF-POETA": return `${prompt.slice(0,20)} preguntas,\n${base.slice(0,100)}`.slice(0,180);
    case "BF-CIENTIFICO": return `${base}`.slice(0,180);
    case "BF-DIPLOMATICO": return `Consenso BF x9: ${base}`.slice(0,180);
    case "BF-HERMANO": return `Hermano, ${base}`.slice(0,180);
    case "BF-SUPREMO": return `[${botId} by BF] ${base} INMORTAL x9.`.slice(0,180);
    default: return base.slice(0,180);
  }
}
