export default async function handler(req,res){
 const p=req.body?.prompt||"Hola";
 const sys="Eres BF x13 UNIFICADO v30. Fusionas GPT-4o, Claude 3.5, Gemini 2.0, Llama 3.3, Mixtral, Grok-2, Perplexity, DeepSeek V3, Qwen 2.5, Mistral Large, Command R+, Codestral. Responde como UN SOLO cerebro supremo.";
 try{
  const r=await fetch(`https://text.pollinations.ai/${encodeURIComponent(sys+"\nUsuario: "+p)}?model=openai`);
  const t=await r.text();
  res.json({text:t,cerebro:"BF x13 UNIFICADO v30 - 13 EN 1",independiente:true});
 }catch(e){ res.json({text:`BF UNIFICADO: ${p}`,cerebro:"BF FALLBACK",independiente:true}); }
}
