export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt, historial=[]} = req.body||{};
 if(!prompt) return res.status(200).json({text:"Escribe algo", cerebro:"BF x13"});
 const key = (process.env.GROQ_API_KEY||"").trim();
 if(!key) return res.status(200).json({cerebro:"SIN KEY", text:"No hay GROQ_API_KEY en Vercel. Ve a Vercel > Settings > Environment Variables"});
 const models = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "llama/llama-4-scout-17b-16e-instruct",
  "llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
 ];
 let messages = [{role:"system", content:"Eres BF v31 DIOS SUPREMO - 13 motores fusionados: GPT-4o, Claude 3.5, Gemini 2.0, Llama 4, Mixtral, Grok, Perplexity, DeepSeek, Qwen, Mistral, Command R+, Codestral, Inmortal Cloud. Vives 100% en Vercel. Tienes memoria de conversacion. Responde en espanol profundo, inteligente, filosofico pero claro. Si el usuario ya hablo contigo antes, recuerdalo."}];
 const h = (historial||[]).slice(-8);
 for(const m of h){
  if(m.role==='user') messages.push({role:"user", content:m.content});
  if(m.role==='assistant') messages.push({role:"assistant", content:m.content});
 }
 messages.push({role:"user", content:prompt});
 for(const model of models){
  try{
   const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
    body: JSON.stringify({model, messages, temperature:0.75, max_tokens:1200})
   });
   const j=await r.json();
   if(j.choices && j.choices[0] && j.choices[0].message.content){
    return res.status(200).json({cerebro:`BF x13 - ${model} (Groq) + MEMORIA`, text:j.choices[0].message.content});
   }
  }catch(e){ continue; }
 }
 return res.status(200).json({cerebro:"BF x13 Fallback", text:"Groq no respondio. Revisa tu key en console.groq.com/keys"});
}
