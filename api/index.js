import app from '../copilot-bf-x3/server.js';
import { MIS_BOTS, responderConBotPropio, buscarInternetReal } from '../copilot-bf-x3/IA/BF_BOTS/index.js';

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
      const x9 = Object.keys(MIS_BOTS).map(id=>({
        cerebro:id,
        respuesta: responderConBotPropio(id, prompt, web),
        creador: MIS_BOTS[id].creador,
        tipo: "BOT PROPIO BF",
        estilo: MIS_BOTS[id].estilo,
        fuente: web? "Internet real (Wiki/Jina)" : "Cerebro propio BF",
        timestamp:new Date().toISOString()
      }));
      return res.json({
        x9,
        modo:"9 BOTS PROPIOS DE BF - 100% tuyos - todo internet",
        web_verificado:!!web,
        web_data:web.slice(0,350),
        version:"2.0.0-bots-propios-bf",
        creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
        total_bots:9,
        timestamp:new Date().toISOString()
      });
    }catch(e){ return res.status(500).json({error:e.message}); }
  }
  return app(req,res);
}
