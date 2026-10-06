export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.json({
    creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
    familia:"Llama x9 ULTRA - BOTS PROPIOS",
    estado:"9 BOTS PROPIOS ACTIVOS - 100% BF - SIN CASES PRESTADOS",
    bots:["BF-LIDER","BF-SABIO","BF-GUERRERO","BF-HACKER","BF-POETA","BF-CIENTIFICO","BF-DIPLOMATICO","BF-HERMANO","BF-SUPREMO"],
    version:"2.0.0-bots-propios-bf",
    modo:"Bots propios con todo internet",
    origen:"La Higuera a Utah",
    timestamp:new Date().toISOString()
  });
}
