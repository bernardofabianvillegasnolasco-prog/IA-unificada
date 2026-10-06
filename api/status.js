export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.json({
    creador:"BF Villegas",
    creador_completo:"BERNARDO FABIAN VILLEGAS NOLAZCO",
    familia:"Llama x9 ULTRA",
    estado:"Copilot Activo x9 - TODO INTERNET + IA BF",
    cerebros:["GROQ1-BF","GROQ2-BF","GROQ3-BF","FREE5-BF","FREE6-BF","HF-BF","OPENROUTER-BF","TOGETHER-BF","META-BF-9"],
    version:"1.0.49-x9-todo-internet",
    modo:"Todo internet: Brave, Tavily, Serper, Wiki ES/EN, DDG, Jina",
    timestamp:new Date().toISOString()
  });
}
