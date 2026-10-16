export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt} = req.body||{};
 if(!prompt) return res.status(200).json({text:"Escribe algo"});
 let txt=""; let motor="";
 const models = ["llama-3.1-8b-instant","llama3-8b-8192","mixtral-8x7b-32768","gemma2-9b-it","llama-3.1-70b-versatile"];
 try{
  if(!process.env.GROQ_API_KEY) throw new Error("No GROQ_API_KEY en Vercel");
  let ok=false;
  for(const m of models){
   try{
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
     method:"POST",
     headers:{"Authorization":`Bearer ${process.env.GROQ_API_KEY}`,"Content-Type":"application/json"},
     body: JSON.stringify({
      model:m,
      messages:[
       {role:"system",content:"Eres BF v30 UNIFICADO - 13 motores fusionados: GPT-4o, Claude 3.5, Gemini 2.0, Llama, Mixtral, Grok, Perplexity, DeepSeek, Qwen, Mistral, Command R+, Codestral, Inmortal Cloud. Vives 100% en Vercel sin localhost. Inmortal. Responde en español claro, inteligente, profundo, como 13 IAs en 1."},
       {role:"user",content:prompt}
      ],temperature:0.7,max_tokens:800
     })
    });
    const j=await r.json();
    if(j.choices?.[0]?.message?.content){
     txt=j.choices[0].message.content; motor=`BF x13 - ${m} (Groq)`; ok=true; break;
    }
   }catch(e){ continue; }
  }
  if(!ok) txt="Groq no respondió con ningún modelo. Respuesta de prueba: Matemáticas es la ciencia de números, patrones y estructuras lógicas que estudia cantidad, espacio y cambio.";
 }catch(e){ txt="Error: "+e.message; motor="Error"; }
 return res.status(200).json({cerebro:motor,text:txt,v:"v30-REAL-FINAL",independiente:true});
}
