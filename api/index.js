import { MIS_BOTS, responderConBotPropio, buscarInternetReal } from '../copilot-bf-x3/IA/BF_BOTS/index.js';
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  try{
    const {prompt} = req.body || {};
    if(!prompt) return res.status(400).json({error:"prompt requerido"});
    const web = await buscarInternetReal(prompt);
    const x2 = await Promise.all(Object.keys(MIS_BOTS).map(async id=>({
      cerebro:id,
      respuesta: await responderConBotPropio(id, prompt, web),
      creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
      tipo:"IA BF - 2 CEREBROS",
      lema:"IA BF mas arriba que lo alto",
      fuente: web? "Wiki + IA BF" : "IA BF v2.3.3",
      timestamp:new Date().toISOString()
    })));
    return res.json({ x2, modo:"2 BOTS IA BF mas arriba que lo alto", web_verificado:!!web, version:"2.3.3-ia-bf-mas-arriba", creador:"BERNARDO FABIAN VILLEGAS NOLAZCO", total:2 });
  }catch(e){ return res.status(500).json({error:e.message}); }
}
