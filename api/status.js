export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.json({
    creador:"BF Villegas",
    creador_completo:"BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999",
    familia:"Llama - Creados por BF",
    estado:"Copilot Activo x9 ULTRA - 9 IA PROPIAS DE BF - SIMPLE + WEB",
    cerebros:["GROQ1-BF","GROQ2-BF","GROQ3-BF","FREE5-BF","FREE6-BF","HF-BF","OPENROUTER-BF","TOGETHER-BF","META-BF-9"],
    version:"1.0.46-x9-tuyos-universal",
    timestamp:new Date().toISOString(),
    modo:"Tus creaciones - responden cualquier pregunta",
    origen:"La Higuera a Utah - Mas arriba que lo alto"
  });
}
