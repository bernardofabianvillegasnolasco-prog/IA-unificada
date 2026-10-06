import app from '../copilot-bf-x3/server.js';
import { BOTS_BF, responderBot } from '../copilot-bf-x3/IA/bots.js';

async function buscarWeb(q){
  const queries = [q, q.split(" ").slice(0,2).join(" "), "Llama", "Meta AI", "inteligencia artificial"];
  if(q.toLowerCase().includes("llama")) queries.unshift("Llama (modelo de lenguaje)", "Llama");
  for(const query of queries){
    try{
      const url = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
      const s = await fetch(url, {headers:{"User-Agent":"IA-BF-x9/1.0"}}).then(r=>r.json()).catch(()=>null);
      const title = s?.[1]?.[0];
      if(title){
        const sum = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {headers:{"User-Agent":"IA-BF-x9/1.0"}}).then(r=>r.json()).catch(()=>null);
        if(sum?.extract) return sum.extract;
      }
    }catch{}
  }
  return "";
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();

  if((req.url||"").includes("/api/debate") && req.method==="POST"){
    try{
      const {prompt} = req.body || {};
      if(!prompt) return res.status(400).json({error:"prompt requerido"});
      const web = await buscarWeb(prompt);
      const x9 = Object.keys(BOTS_BF).map(c=>({
        cerebro:c,
        respuesta: responderBot(c, prompt, web),
        creador: BOTS_BF[c].creador,
        rol: BOTS_BF[c].rol,
        fuente: web? "Wikipedia verificada + IA BF" : "IA propia de BF Villegas",
        timestamp:new Date().toISOString()
      }));
      return res.json({
        x9,
        modo:"9 IA propias de BF - universales",
        web_verificado:!!web,
        web_data:web.slice(0,250),
        version:"1.0.46-x9-tuyos-universal",
        creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
        timestamp:new Date().toISOString()
      });
    }catch(e){ return res.status(500).json({error:e.message}); }
  }
  return app(req,res);
}
