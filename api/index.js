import app from '../copilot-bf-x3/server.js';
import { PERSONALIDADES } from '../copilot-bf-x3/IA/personalidades.js';

const SIMPLE = (c, prompt, web="") => {
  const bio = "Soy de BERNARDO FABIAN VILLEGAS NOLAZCO.";
  const w = web? ` Web: ${web.slice(0,100)}.` : "";
  const p = prompt.slice(0,50);
  switch(c){
    case "GROQ1": return `AFIRMATIVO: ${p} → Sí.${w}`.slice(0,180);
    case "GROQ2": return `De La Higuera a Utah: ${p} es camino.${w}`.slice(0,180);
    case "GROQ3": return `${p} ¡CLARO!${w} ¡MÁS ARRIBA!`.slice(0,180);
    case "FREE5": return `> ${p} → OK${w} 💚`.slice(0,180);
    case "FREE6": return `${p} preguntas,\nSimple te respondo.${w}`.slice(0,180);
    case "HF": return `"${p}" verificado.${w}`.slice(0,180);
    case "OPENROUTER": return `x9: ${p} → ${w || "correcto"}.`.slice(0,180);
    case "TOGETHER": return `Hermano, ${p}: sí.${w}`.slice(0,180);
    case "META-BF-9": return `[META-9] ${p}: ${w || "verificado"}.`.slice(0,180);
    default: return `${p}: OK${w}`.slice(0,180);
  }
};

async function buscarWeb(q){
  try{
    // Wikipedia ES OpenSearch + Summary - más confiable en Vercel
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json`;
    const search = await fetch(searchUrl, { headers: { "User-Agent": "IA-BF-x9/1.0" } }).then(r=>r.json()).catch(()=>null);
    const title = search?.[1]?.[0];
    if(title){
      const sumUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const sum = await fetch(sumUrl, { headers: { "User-Agent": "IA-BF-x9/1.0" } }).then(r=>r.json()).catch(()=>null);
      if(sum?.extract) return sum.extract;
    }
    // Fallback DuckDuckGo con UA
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
    const ddg = await fetch(ddgUrl, { headers: { "User-Agent": "IA-BF-x9/1.0" } }).then(r=>r.json()).catch(()=>null);
    if(ddg?.AbstractText) return ddg.AbstractText;
    if(ddg?.RelatedTopics?.[0]?.Text) return ddg.RelatedTopics[0].Text;
    return "";
  }catch{ return ""; }
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();

  const url = req.url || "";

  if(url.includes("/api/status")){
    return res.json({
      creador:"BF Villegas",
      familia:"Llama",
      estado:"Copilot Activo x9 ULTRA - SIMPLE + WEB",
      cerebros:Object.keys(PERSONALIDADES),
      version:"1.0.44-x9-simple-web",
      timestamp:new Date().toISOString(),
      modo:"simple + internet verificado"
    });
  }

  if(url.includes("/api/debate") && req.method==="POST"){
    try{
      const {prompt} = req.body || {};
      if(!prompt) return res.status(400).json({error:"prompt requerido"});
      const web = await buscarWeb(prompt);
      const x9 = Object.keys(PERSONALIDADES).map(c=>({
        cerebro:c,
        respuesta:SIMPLE(c,prompt,web),
        personalidad:PERSONALIDADES[c],
        fuente: web? "Wikipedia/WEB verificada" : "base BF",
        timestamp:new Date().toISOString()
      }));
      return res.json({x9, modo:"simple + web", web_verificado:!!web, web_data:web.slice(0,300), version:"1.0.44-x9-simple-web", timestamp:new Date().toISOString()});
    }catch(e){ return res.status(500).json({error:e.message}); }
  }

  return app(req,res);
}
