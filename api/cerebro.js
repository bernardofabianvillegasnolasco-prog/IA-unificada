export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt} = req.body||{};
 if(!prompt) return res.status(200).json({text:"Escribe algo"});
 let txt="", debug="", motor="";
 const models = ["llama-3.1-8b-instant","llama3-8b-8192","mixtral-8x7b-32768"];
 try{
  if(!process.env.GROQ_API_KEY) return res.json({cerebro:"SIN KEY",text:"No hay GROQ_API_KEY en Vercel. Ve a Variables Ambientales."});
  const key = process.env.GROQ_API_KEY.trim();
  for(const m of models){
   const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
    body: JSON.stringify({model:m,messages:[{role:"user",content:prompt}],max_tokens:500})
   });
   const j=await r.json();
   debug = JSON.stringify(j).slice(0,800);
   if(j.choices?.[0]?.message?.content){ txt=j.choices[0].message.content; motor=m; break; }
   if(j.error){ txt=`Groq error con ${m}: ${j.error.message || JSON.stringify(j.error)}`; motor=`ERROR-${m}`; break; }
  }
  if(!txt) txt=`Groq no devolvio contenido. Debug: ${debug}. Key empieza con ${key.slice(0,7)}... len ${key.length}`;
 }catch(e){ txt="Exception: "+e.message+" "+e.stack?.slice(0,500); }
 return res.status(200).json({cerebro:`BF x13 - ${motor} (Groq)`,text:txt});
}
