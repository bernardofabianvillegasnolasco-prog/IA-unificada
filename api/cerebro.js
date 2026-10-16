export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt} = req.body||{};
 const models = ["llama-3.1-8b-instant","llama3-8b-8192","mixtral-8x7b-32768","gemma2-9b-it"];
 let txt=""; let motor="";
 try{
  for(const m of models){
   const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${process.env.GROQ_API_KEY}`,"Content-Type":"application/json"},
    body: JSON.stringify({model:m,messages:[{role:"system",content:"Eres BF v30 UNIFICADO 13 en 1, inmortal, vives en Vercel. Responde en español profundo."},{role:"user",content:prompt}],temperature:0.7})
   });
   const j=await r.json();
   if(j.choices?.[0]?.message?.content){ txt=j.choices[0].message.content; motor=m; break; }
  }
  if(!txt) txt="Math: ciencia de numeros y patrones. (Fallback porque Groq no respondio)";
 }catch(e){ txt="Error: "+e.message; }
 return res.status(200).json({cerebro:`BF x13 - ${motor} (Groq)`,text:txt});
}
