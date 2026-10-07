let cache = global._bf_cache || {};
global._bf_cache = cache;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {prompt, historial} = req.body||{};
  if(!prompt) return res.status(400).json({respuesta:"Falta prompt"});
  const qOrig = prompt.trim();
  let q = qOrig.toLowerCase();

  // FIX MOTORAS: Normalizar símbolos del teclado del cel
  q = q.replace(/×/g,'*').replace(/÷/g,'/').replace(/x/g,'*').replace(/X/g,'*').replace(/—/g,'-').replace(/,/g,'');
  const qLow = q;

  const fetchJSON = async (url) => {
    try{ const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 IA-BF v25'}}); return r.ok?await r.json():null; }catch{return null;}
  };

  // === MOTORA MATEMÁTICA - PRIORIDAD 1 (antes que Wikipedia) ===
  const mathFix = () => {
    let t=qLow.trim();
    // 2*2, 2×2, 2x2, 2+2, 2-2, 2/2
    if(/^\d+(\.\d+)?\s*[\+\-\*\/\^]\s*\d+(\.\d+)?$/.test(t)){
      try{
        const expr=t.replace(/\^/g,'**');
        const r=Function('"use strict";return ('+expr+')')();
        if(!isNaN(r) && isFinite(r)){
          return `✅ ${qOrig} = ${r}\n\n🧮 Motora Matemática v25 - Corregido: detecté "${qOrig}" como "${t}"`;
        }
      }catch{}
    }
    let m=t.match(/ra[ií]z cuadrada de\s*([\d\.]+)/);
    if(m) return `✅ Raíz cuadrada de ${m[1]} = ${Math.sqrt(parseFloat(m[1]))}`;
    m=t.match(/(\d+(\.\d+)?)\s*%\s*de\s*(\d+(\.\d+)?)/);
    if(m) return `✅ ${m[1]}% de ${m[3]} = ${(parseFloat(m[1])/100)*parseFloat(m[3])}`;
    return null;
  };

  const mathResp = mathFix();
  if(mathResp){
    cache[qLow]=mathResp;
    return res.status(200).json({
      respuesta: mathResp,
      motores: ["Motora Matemática v25 FIX × → *"],
      x2: [{cerebro:"Motora Matemática", respuesta: mathResp}]
    });
  }

  // Cache
  if(cache[qLow]){
    return res.status(200).json({respuesta: `🧠 [Memoria Auto-Mejora] ${cache[qLow]}`, motores: ["Memoria"]});
  }

  // Materias
  if(qLow.includes("materia")||qLow.includes("dgeti")||qLow.includes("alba")||qLow.includes("trazo")){
    try{
      const base=`https://${req.headers.host}`;
      const mm=await fetchJSON(`${base}/api/materias`);
      if(mm){
        const resp=`🧱 MATERIAS DGETI:\n${Object.entries(mm.dgeti).map(([k,v])=>`${k}: ${v.join(", ")}`).join("\n")}\n\n🔨 ${mm.albanileria.join("\n")}`;
        cache[qLow]=resp;
        return res.status(200).json({respuesta: resp, motores: ["Motora DGETI"]});
      }
    }catch{}
  }

  const results=[];
  const motores=[];

  // GROQ x3 con tus keys de ayer
  const groqKeys=[process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
  if(groqKeys.length===0 && process.env.GROQ_API_KEY) groqKeys.push(process.env.GROQ_API_KEY);

  for(let i=0;i<Math.min(3,groqKeys.length);i++){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKeys[i]}`},
        body:JSON.stringify({
          model:"llama-3.3-70b-versatile",
          messages:[{role:"system", content:"Eres IA BF UNIVERSAL v25 x9 ULTRA, de BERNARDO FABIAN VILLEGAS NOLAZCO. Responde cualquier pregunta, eres albañil DGETI experto."},{role:"user", content: qOrig}],
          max_tokens: 700, temperature: 0.7
        })
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans){ results.push({cerebro:`GROQ ${i+1}`, respuesta: ans}); motores.push(`GROQ ${i+1}`); }
    }catch{}
  }

  // PPLX TODO INTERNET
  if(process.env.PPLX_API_KEY){
    try{
      const r=await fetch("https://api.perplexity.ai/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.PPLX_API_KEY}`},
        body:JSON.stringify({model:"sonar-pro", messages:[{role:"user", content: qOrig}], max_tokens: 700})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans){ results.push({cerebro:"PPLX TODO INTERNET", respuesta: ans}); motores.push("PPLX Todo Internet"); }
    }catch{}
  }

  if(results.length){
    cache[qLow]=results[0].respuesta;
    return res.status(200).json({respuesta: results[0].respuesta, motores, x2: results});
  }

  // Fallback Wikipedia (solo si no hay keys)
  try{
    const s=await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(qOrig)}&format=json&origin=*`);
    if(s?.query?.search?.[0]){
      const title=s.query.search[0].title;
      const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract){
        const resp=`🌐 [Wikipedia ES]\n${sum.title}: ${sum.extract}\n${sum.content_urls?.desktop?.page}`;
        cache[qLow]=resp;
        return res.status(200).json({respuesta: resp, motores: ["Wikipedia ES"]});
      }
    }
  }catch{}

  return res.status(200).json({respuesta: `No pude responder "${qOrig}" - verifica keys: vercel env ls`, motores: ["Sin motores"]});
}
