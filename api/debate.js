import { MIS_BOTS, responderConBotPropio } from '../copilot-bf-x3/IA/BF_BOTS/index.js';
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {prompt} = req.body||{};
  if(!prompt) return res.status(400).json({error:"falta prompt"});
  try{
    const botId = Object.keys(MIS_BOTS)[0];
    const bot = MIS_BOTS[botId];
    const respuesta = await responderConBotPropio(botId, prompt);
    return res.status(200).json({x2:[{cerebro:bot.nombre, respuesta}]});
  }catch(e){
    return res.status(200).json({x2:[{cerebro:"IA BF UNIVERSAL", respuesta:`Me preguntas por ${prompt}. Estoy listo para explicartelo simple.`}]});
  }
}
