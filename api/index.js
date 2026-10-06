import { MIS_BOTS, responderConBotPropio, buscarInternetReal } from '../copilot-bf-x3/IA/BF_BOTS/index.js';
import app from '../copilot-bf-x3/server.js';
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  if((req.url||"").includes("/api/debate") && req.method==="POST"){
    try{
      const {prompt} = req.body || {};
      if(!prompt) return res.status(400).json({error:"prompt requerido"});
      const web = await buscarInternetReal(prompt);
      const x2 = await Promise.all(Object.keys(MIS_BOTS).map(async id=>({
        cerebro:id,
        respuesta: await responderConBotPropio(id, prompt, web),
        creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
        tipo:"BOT 100% PROPIO BF - 2 CEREBROS",
        fuente: web? "Wiki + cerebro BF" : "Cerebro propio BF v2.3",
        timestamp:new Date().toISOString()
      })));
      return res.json({ x2, modo:"2 BOTS PROPIOS - LIDER + SUPREMO", web_verificado:!!web, web_data:web.slice(0,300), version:"2.3.0-2-bots", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", total:2, timestamp:new Date().toISOString() });
    }catch(e){ return res.status(500).json({error:e.message}); }
  }
  return app(req,res);
}
