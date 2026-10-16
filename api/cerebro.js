export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt} = req.body||{};
 if(!prompt) return res.status(200).json({text:"Escribe algo"});
 const key = (process.env.GROQ_API_KEY||"").trim();
 if(!key) return res.json({cerebro:"SIN KEY",text:"No hay GROQ_API_KEY"});
 const models = [
  "llama-3.3-70b-versatile",
  "llama/llama-4-scout-17b-16e-instruct",
  "llama/llama-4-maverick-17b-128e-instruct",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
 ];
 for(const m of models){
  try{
   const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
    body: JSON.stringify({model:m,messages:[{role:"system",content:"Eres BF v30 UNIFICADO - 13 motores fusionados, inmortal, vives en Vercel. Responde en español profundo."},{role:"user",content:prompt}],temperature:0.7,max_tokens:800})
   });
   const j=await r.json();
   if(j.choices?.[0]?.message?.content){
    return res.json({cerebro:`BF x13 - ${m} (Groq)`,text:j.choices[0].message.content});
   }
  }catch(e){ continue; }
 }
 return res.json({cerebro:"BF x13 Fallback",text:"Groq no respondio con ningun modelo nuevo. Intenta regenerar la key en console.groq.com/keys"});
}
