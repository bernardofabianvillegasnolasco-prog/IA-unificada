export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.json({
    creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
    familia:"Llama x9 ULTRA - 100% PROPIO",
    estado:"9 BOTS PUROS PROPIOS - 0 APIs externas - CÓDIGO BF",
    bots:["BF-LIDER","BF-SABIO","BF-GUERRERO","BF-HACKER","BF-POETA","BF-CIENTIFICO","BF-DIPLOMATICO","BF-HERMANO","BF-SUPREMO"],
    version:"2.2.0-bots-puros-propios",
    modo:"Cerebro propio JS puro + Wiki - sin Groq, sin Brave, sin llaves",
    origen:"La Higuera a Utah - 100% BF",
    timestamp:new Date().toISOString()
  });
}
