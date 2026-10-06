import app from '../copilot-bf-x3/server.js';
import { PERSONALIDADES } from '../copilot-bf-x3/IA/personalidades.js';

const CARISMA_SIMPLE = (cerebro, prompt, webData = "") => {
  const baseBio = `Soy de BERNARDO FABIAN VILLEGAS NOLAZCO.`;
  const web = webData? ` Dato web: ${webData.substring(0,120)}.` : "";

  switch(cerebro){
    case "GROQ1": return `AFIRMATIVO: ${prompt} → Sí. ${web} ${baseBio}`.substring(0,200);
    case "GROQ2": return `La Higuera a Utah enseña: ${prompt} es camino. ${web}`.substring(0,200);
    case "GROQ3": return `${prompt} ¡CLARO! ${web} ¡MÁS ARRIBA!`.substring(0,200);
    case "FREE5": return `> exec "${prompt}" → OK ${web} 💚`.substring(0,200);
    case "FREE6": return `${prompt}, BF pregunta,\nRespuesta simple te traigo.${web? " "+web : ""}`.substring(0,200);
    case "HF": return `Simple: "${prompt}" = verificado. ${web}`.substring(0,200);
    case "OPENROUTER": return `Consenso x9: ${prompt} → ${web || "correcto"}.`.substring(0,200);
    case "TOGETHER": return `Hermano, ${prompt}: sí. ${web}`.substring(0,200);
    case "META-BF-9": return `[META-9] ${prompt}: ${web || "verificado"} - BF.`.substring(0,200);
    default: return `${prompt}: OK. ${web}`.substring(0,200);
  }
};

async function buscarInternet(query){
  try{
    // 1. Intenta DuckDuckGo instant answer (gratis, sin key)
    const ddg = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`).then(r=>r.json()).catch(()=>null);
    if(ddg?.AbstractText) return ddg.AbstractText;
    if(ddg?.Answer) return ddg.Answer;
    if(ddg?.RelatedTopics?.[0]?.Text) return ddg.RelatedTopics[0].Text;

    // 2. Fallback Wikipedia
    const wiki = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`).then(r=>r.json()).catch(()=>null);
    if(wiki?.extract) return wiki.extract;

    return "";
  }catch(e){ return ""; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";

  if (url.includes("/api/debate") && req.method === "POST") {
    try{
      const { prompt, modo = "simple" } = req.body || {};
      if (!prompt) return res.status(400).json({error:"prompt requerido"});

      // Buscar en internet para respuesta segura
      const webData = await buscarInternet(prompt);

      const cerebros = Object.keys(PERSONALIDADES);
      const x9 = cerebros.map(c => ({
        cerebro: c,
        respuesta: CARISMA_SIMPLE(c, prompt, webData),
        personalidad: PERSONALIDADES[c],
        fuente: webData? "internet: DuckDuckGo/Wiki" : "base BF",
        timestamp: new Date().toISOString()
      }));

      return res.json({
        x9,
        modo: "simple + internet",
        web_verificado: webData? true : false,
        web_data: webData.substring(0,300),
        version: "1.0.43-x9-simple-web",
        timestamp: new Date().toISOString()
      });
    }catch(e){
      return res.status(500).json({error: e.message});
    }
  }

  return app(req, res);
}
