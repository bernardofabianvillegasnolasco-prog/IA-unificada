export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {accion, prompt} = req.body || {};
  let out="";
  switch(accion){
    case "voz": out=`Voz BF: "${prompt}" listo para TTS mas arriba`; break;
    case "rag": out=`RAG BF: Analizando documento "${prompt.slice(0,50)}..." - contenido mas arriba`; break;
    case "agente": out=`Agente BF autónomo: Investigando "${prompt}" en tiempo real + ejecutando tareas mas arriba`; break;
    case "tiempo-real": out=`Tiempo real BF: Buscando "${prompt}" con Brave Search / Tavily mas arriba (configura TAVILY_API_KEY para real)`; break;
    default: out=`Avanzada BF: ${prompt}`;
  }
  return res.json({accion, resultado:out, v5:true});
}
