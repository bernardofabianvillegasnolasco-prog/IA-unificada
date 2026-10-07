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
  let motores = [];

  const fetchJSON = async (url, opts={}) => {
    try{ const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 IA-BF v24',...opts.headers||{}},...opts}); return r.ok?await r.json():null; }catch{return null;}
  };
  const fetchText = async (url) => {
    try{ const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}}); return r.ok?await r.text():null; }catch{return null;}
  };

  // === FUNCIONES MOTORAS ===
  // Motora 1: Matemática
  let m=qLow.match(/ra[ií]z cuadrada de\s*([\d\.]+)/);
  if(m){
    const n=parseFloat(m[1]); const r=Math.sqrt(n);
    const resp=`✅ Raíz cuadrada de ${n} = ${r}\n${r} × ${r} = ${n}`;
    cache[qLow]=resp; motores.push("Motora Matemática");
    return res.status(200).json({respuesta: resp, motores, x2:[{cerebro:"Motora Matemática", respuesta: resp}]});
  }
  m=qLow.match(/(\d+(\.\d+)?)\s*%\s*de\s*(\d+(\.\d+)?)/);
  if(m){
    const resp=`✅ ${m[1]}% de ${m[3]} = ${(parseFloat(m[1])/100)*parseFloat(m[3])}`;
    return res.status(200).json({respuesta: resp, motores: ["Motora Porcentaje"]});
  }

  // Auto-mejora cache
  if(cache[qLow]){
    motores.push("Motora Memoria Auto-Mejora");
    return res.status(200).json({respuesta: `🧠 [Auto-Mejora] Ya aprendí:\n${cache[qLow]}`, motores});
  }

  // Motora 2: DGETI Albañilería
  if(qLow.includes("materia")||qLow.includes("dgeti")||qLow.includes("alba")||qLow.includes("trazo")||qLow.includes("constru")){
    try{
      const base=`https://${req.headers.host}`;
      const mm=await fetchJSON(`${base}/api/materias`);
      if(mm){
        const resp=`🧱 MATERIAS DGETI + ALBAÑILERÍA + TECNOLÓGICOS:\n\n`+
        Object.entries(mm.dgeti).map(([k,v])=>`${k}: ${v.join(", ")}`).join("\n")+
        `\n\n🔨 ${mm.albanileria.join("\n")}\n\n🏗️ ${mm.tecnologicos.join(", ")}`;
        cache[qLow]=resp; motores.push("Motora DGETI");
        return res.status(200).json({respuesta: resp, motores});
      }
    }catch{}
  }

  const results = [];
  const callGroq = async (key) => {
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body:JSON.stringify({
          model:"llama-3.3-70b-versatile",
          messages:[
            {role:"system", content:"Eres IA BF UNIVERSAL v24 x9 ULTRA, creada por BERNARDO FABIAN VILLEGAS NOLAZCO. Eres albañil experto DGETI, con personalidad real, no robot. Respondes cualquier pregunta."},
           ...(historial||[]).slice(-3),
            {role:"user", content: q}
          ],
          max_tokens: 900, temperature: 0.8
        })
      });
      const d=await r.json();
      return d?.choices?.[0]?.message?.content || null;
    }catch{return null;}
  };

  // === MOTORES DE BÚSQUEDA TODO INTERNET + IA ===
  const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
  if(groqKeys.length===0 && process.env.GROQ_API_KEY) groqKeys.push(process.env.GROQ_API_KEY);

  // Motores 1-3: GROQ x3
  for(let i=0; i<Math.min(3, groqKeys.length); i++){
    const ans = await callGroq(groqKeys[i]);
    if(ans){ results.push({cerebro: `GROQ ${i+1} Llama 3.3 70B`, respuesta: ans}); motores.push(`Búsqueda Groq ${i+1}`); }
  }

  // Motor 4: Perplexity - TODO INTERNET REAL
  if(process.env.PPLX_API_KEY){
    try{
      const r=await fetch("https://api.perplexity.ai/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.PPLX_API_KEY}`},
        body:JSON.stringify({model:"sonar-pro", messages:[{role:"user", content: `Busca en todo internet: ${q}`}], max_tokens: 800})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans){ results.push({cerebro:"PPLX TODO INTERNET", respuesta: ans}); motores.push("Búsqueda Perplexity Todo Internet"); }
    }catch{}
  }

  // Motor 5: Brave Search API (si tienes key)
  if(process.env.BRAVE_API_KEY){
    try{
      const r=await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=3`,{headers:{'X-Subscription-Token': process.env.BRAVE_API_KEY}});
      const d=await r.json();
      if(d?.web?.results?.length){
        const txt=d.web.results.map((x,i)=>`${i+1}. ${x.title}\n${x.description}\n${x.url}`).join("\n\n");
        results.push({cerebro:"BRAVE TODO INTERNET", respuesta: txt}); motores.push("Búsqueda Brave");
      }
    }catch{}
  }

  // Motor 6: OpenAI
  if(process.env.OPENAI_API_KEY){
    try{
      const r=await fetch("https://api.openai.com/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
        body:JSON.stringify({model:"gpt-4o-mini", messages:[{role:"user", content: q}], max_tokens: 700})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans){ results.push({cerebro:"OPENAI GPT-4o", respuesta: ans}); motores.push("Búsqueda OpenAI"); }
    }catch{}
  }

  // Motor 7: Anthropic
  if(process.env.ANTHROPIC_API_KEY){
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-3-5-sonnet-20241022", max_tokens:700, messages:[{role:"user", content: q}]})
      });
      const d=await r.json();
      const ans=d?.content?.[0]?.text;
      if(ans){ results.push({cerebro:"CLAUDE 3.5", respuesta: ans}); motores.push("Búsqueda Claude"); }
    }catch{}
  }

  // Motor 8: Gemini
  if(process.env.GEMINI_API_KEY){
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text: q}]}]})
      });
      const d=await r.json();
      const ans=d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if(ans){ results.push({cerebro:"GEMINI 2.0", respuesta: ans}); motores.push("Búsqueda Gemini"); }
    }catch{}
  }

  // Motor 9-10: Wikipedia + DuckDuckGo HTML (gratis, siempre activo)
  if(results.length===0){
    try{
      const s=await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`);
      if(s?.query?.search?.[0]){
        const title=s.query.search[0].title;
        const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if(sum?.extract){ results.push({cerebro:"Wikipedia ES", respuesta: `${sum.title}: ${sum.extract}\n${sum.content_urls?.desktop?.page}`}); motores.push("Búsqueda Wikipedia"); }
      }
    }catch{}
  }
  if(results.length===0){
    try{
      const htmlUrl=`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const prox=`https://api.allorigins.win/raw?url=${encodeURIComponent(htmlUrl)}`;
      const html=await fetchText(prox);
      if(html){
        const matches=[...html.matchAll(/<a[^>]+class="result__url"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,200}result__snippet[^>]*>([^<]+)/g)];
        if(matches.length){
          const txt=matches.slice(0,3).map((m,i)=>`${i+1}. ${m[2].replace(/<[^>]+>/g,'').trim()}\n${m[3].replace(/<[^>]+>/g,'').trim()}\n${m[1]}`).join("\n\n");
          results.push({cerebro:"DDG HTML TODO INTERNET", respuesta: txt}); motores.push("Búsqueda DDG Todo Internet");
        }
      }
    }catch{}
  }

  if(results.length){
    const mejor = results[0].respuesta;
    cache[qLow]=mejor;
    return res.status(200).json({respuesta: mejor, motores, x2: results, total_motores: motores.length});
  }

  return res.status(200).json({respuesta: `No pude responder "${q}" - verifica tus keys: vercel env ls`, motores: ["Sin motores"]});
}
