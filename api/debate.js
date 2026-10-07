let cache = global._bf_cache || {};
global._bf_cache = cache;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {prompt, historial} = req.body||{};
  if(!prompt) return res.status(400).json({respuesta:"Falta prompt"});
  const q = prompt.trim();
  const qLow = q.toLowerCase();

  // AUTO-MEJORA: si ya lo aprendimos
  if(cache[qLow]){
    return res.status(200).json({
      respuesta: `🧠 [Memoria x9 - Ya aprendido]\n${cache[qLow]}`,
      motores: ["Memoria Auto-Mejorada x9"],
      x2: [{cerebro:"IA BF x9 ULTRA - Memoria", respuesta: cache[qLow]}]
    });
  }

  // Math local
  let m=qLow.match(/ra[ií]z cuadrada de\s*([\d\.]+)/);
  if(m){
    const r=Math.sqrt(parseFloat(m[1]));
    const resp=`¡Claro BF! 🤓 La raíz cuadrada de ${m[1]} es ${r}. Ya me lo aprendí para siempre.`;
    cache[qLow]=resp;
    return res.status(200).json({respuesta: resp, motores: ["Matemática x9"]});
  }

  // Materias DGETI
  if(qLow.includes("materia")||qLow.includes("dgeti")||qLow.includes("alba")){
    try{
      const base=`https://${req.headers.host}`;
      const mm=await fetch(`${base}/api/materias`).then(r=>r.json());
      const resp=`🧱 MATERIAS DGETI ALBAÑILERÍA x9 ULTRA:\n${Object.entries(mm.dgeti).map(([k,v])=>`${k}: ${v.join(", ")}`).join("\n")}\n\n🔨 ${mm.albanileria.join("\n")}`;
      cache[qLow]=resp;
      return res.status(200).json({respuesta: resp, motores: ["DGETI x9"]});
    }catch{}
  }

  const results = [];
  const callGroq = async (key, model="llama-3.3-70b-versatile") => {
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body:JSON.stringify({
          model,
          messages:[
            {role:"system", content:"Eres IA BF UNIVERSAL x9 ULTRA, creada por BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999. Lema: La Higuera a Utah - Más arriba que lo alto. Familia Llama. Eres amigo albañil de Jerome Idaho, bromista, inteligente, con personalidad real, no robot. Dominas albañilería DGETI y Tecnológicos. Si no sabes algo, dilo y aprende. Responde en español, corto, con emojis."},
           ...(historial||[]).slice(-3),
            {role:"user", content: q}
          ],
          max_tokens: 900,
          temperature: 0.9
        })
      });
      const d=await r.json();
      return d?.choices?.[0]?.message?.content || null;
    }catch{return null;}
  };

  // === 9 CEREBROS CON TUS KEYS DE AYER ===
  const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
  if(!groqKeys.length && process.env.GROQ_API_KEY) groqKeys.push(process.env.GROQ_API_KEY);

  // Cerebros 1-3: GROQ x3 Llama 3.3 70B (tus principales)
  for(let i=0; i<Math.min(3, groqKeys.length); i++){
    const ans = await callGroq(groqKeys[i]);
    if(ans) results.push({cerebro: `GROQ ${i+1} - Llama 3.3 70B`, respuesta: ans});
  }

  // Cerebro 4: Perplexity - EL MEJOR PARA TODO INTERNET
  if(process.env.PPLX_API_KEY){
    try{
      const r=await fetch("https://api.perplexity.ai/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.PPLX_API_KEY}`},
        body:JSON.stringify({
          model:"sonar-pro",
          messages:[{role:"user", content: `Busca en todo internet y responde: ${q}`}],
          max_tokens: 800
        })
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans) results.push({cerebro:"PPLX - Perplexity TODO INTERNET", respuesta: ans});
    }catch{}
  }

  // Cerebro 5: OpenAI GPT-4o
  if(process.env.OPENAI_API_KEY){
    try{
      const r=await fetch("https://api.openai.com/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
        body:JSON.stringify({model:"gpt-4o-mini", messages:[{role:"user", content: q}], max_tokens: 800})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans) results.push({cerebro:"OPENAI - GPT-4o", respuesta: ans});
    }catch{}
  }

  // Cerebro 6: Anthropic Claude
  if(process.env.ANTHROPIC_API_KEY){
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-3-5-sonnet-20241022", max_tokens:800, messages:[{role:"user", content: q}]})
      });
      const d=await r.json();
      const ans=d?.content?.[0]?.text;
      if(ans) results.push({cerebro:"ANTHROPIC - Claude 3.5", respuesta: ans});
    }catch{}
  }

  // Cerebro 7: Gemini
  if(process.env.GEMINI_API_KEY){
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text: q}]}]})
      });
      const d=await r.json();
      const ans=d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if(ans) results.push({cerebro:"GEMINI - Flash 2.0", respuesta: ans});
    }catch{}
  }

  // Si tenemos resultados x9, hacemos debate y auto-mejora
  if(results.length){
    const mejor = results[0].respuesta;
    const resumen = `🧠 IA BF x9 ULTRA - ${results.length} cerebros activos con tus keys de ayer:\n\n`+
      results.map((r,i)=>`--- ${r.cerebro} ---\n${r.respuesta.slice(0,400)}\n`).join("\n")+
      `\n\n✅ Auto-mejorado: Guardé "${q}" en memoria x9. Total: ${Object.keys(cache).length+1}`;

    cache[qLow] = mejor;
    cache[qLow+"_count"] = 1;

    return res.status(200).json({
      respuesta: mejor + `\n\n🧠 Debate x${results.length} cerebros: ${results.map(r=>r.cerebro).join(", ")}\n${resumen.slice(0,1000)}`,
      motores: results.map(r=>r.cerebro),
      x2: results,
      auto_mejora: `Memoria x9: ${Object.keys(cache).length} aprendidos`
    });
  }

  // Fallback Wikipedia si no hay keys
  try{
    const s=await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`).then(r=>r.json());
    if(s?.query?.search?.[0]){
      const title=s.query.search[0].title;
      const sum=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`).then(r=>r.json());
      if(sum?.extract){
        cache[qLow]=sum.extract;
        return res.status(200).json({respuesta: `🌐 [Wikipedia ES - Fallback sin keys]\n${sum.extract}`, motores: ["Wikipedia"]});
      }
    }
  }catch{}

  return res.status(200).json({respuesta: `BF, no tengo keys activas 😅 Ve a vercel env ls. Necesito GROQ_API_KEY, PPLX_API_KEY, etc. Pregunta "${q}" no la pude responder con x9.`});
}
