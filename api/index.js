import app from '../copilot-bf-x3/server.js';
import { BOTS_BF, responderBot } from '../copilot-bf-x3/IA/bots.js';
import { buscarTodoInternet } from '../copilot-bf-x3/IA/buscador_web.js';

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();

  if((req.url||"").includes("/api/debate") && req.method==="POST"){
    try{
      const {prompt} = req.body || {};
      if(!prompt) return res.status(400).json({error:"prompt requerido"});

      const web = await buscarTodoInternet(prompt);

      const x9 = Object.keys(BOTS_BF).map(c=>({
        cerebro:c,
        respuesta: responderBot(c, prompt, web),
        creador: BOTS_BF[c].creador,
        rol: BOTS_BF[c].rol,
        fuente: web? "INTERNET COMPLETO (Brave/Tavily/Wiki/DDG/Jina)" : "IA propia BF",
        timestamp:new Date().toISOString()
      }));

      return res.json({
        x9,
        modo:"todo internet + IA BF",
        web_verificado:!!web,
        web_data:web.slice(0,400),
        version:"1.0.49-x9-todo-internet",
        fuentes:["Brave Search","Tavily","Serper","Wikipedia ES/EN","DuckDuckGo","Jina AI Reader"],
        timestamp:new Date().toISOString()
      });
    }catch(e){ return res.status(500).json({error:e.message}); }
  }
  return app(req,res);
}
