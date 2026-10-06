export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.json({
    creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
    familia:"Llama x2 ULTRA - 2 BOTS PROPIOS",
    estado:"2 BOTS PROPIOS ACTIVOS - LIDER + SUPREMO - 100% BF",
    bots:["BF-LIDER","BF-SUPREMO"],
    version:"2.3.0-2-bots-propios",
    modo:"2 cerebros propios puros - código BF - 0 APIs",
    origen:"La Higuera a Utah",
    timestamp:new Date().toISOString()
  });
}
