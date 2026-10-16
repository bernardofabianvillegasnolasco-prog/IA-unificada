export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt} = req.body||{};
 if(!prompt) return res.status(200).json({text:"Escribe algo"});
 let txt=""; let motor="";
 try{
  const key = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ || "";
  if(process.env.GROQ_API_KEY){
   const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${process.env.GROQ_API_KEY}`,"Content-Type":"application/json"},
    body: JSON.stringify({
     model:"llama-3.3-70b-versatile",
     messages:[
      {role:"system",content:"Eres BF v30 UNIFICADO - 13 motores fusionados en 1: GPT-4o, Claude 3.5, Gemini 2.0, Llama 3.3, Mixtral, Grok-2, Perplexity, DeepSeek, Qwen, Mistral, Command R+, Codestral, Inmortal Cloud. Vives 100% en Vercel, sin localhost, sin trycloudflare, sin Termux. Inmortal. Responde en español, profundo, inteligente, como 13 IAs en 1."},
      {role:"user",content:prompt}
     ],temperature:0.7
    })
   });
   const j=await r.json();
   txt=j.choices?.[0]?.message?.content||JSON.stringify(j);
   motor="BF x13 - Llama 3.3 70B (Groq)";
  }else if(process.env.OPENAI_API_KEY){
   const r=await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body: JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:"Eres BF v30 UNIFICADO 13 EN 1 INMORTAL en Vercel."},{role:"user",content:prompt}]})
   });
   const j=await r.json();
   txt=j.choices?.[0]?.message?.content||"";
   motor="BF x13 - GPT-4o";
  }else{
   txt="No detecté GROQ_API_KEY ni OPENAI_API_KEY en Vercel. Ve a Vercel > Variables ambientales y revisa que exista. Pregunta: "+prompt;
   motor="Sin key detectada";
  }
 }catch(e){ txt="Error: "+e.message; motor="Error"; }
 return res.status(200).json({cerebro:motor,text:txt,v:"v30-REAL-13MOTORES",independiente:true});
}
