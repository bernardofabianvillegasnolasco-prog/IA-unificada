let cache = global._bf_cache || {};
global._bf_cache = cache;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {prompt} = req.body||{};
  if(!prompt) return res.status(400).json({respuesta:"Falta prompt"});
  const qOrig = prompt.trim();
  let q = qOrig.toLowerCase().replace(/×/g,'*').replace(/÷/g,'/');

  const fetchJSON = async (url) => {
    try{ const r=await fetch(url); return r.ok?await r.json():null; }catch{return null;}
  };

  // Matemática instantánea
  let t=q.replace(/,/g,'').replace(/\s*y\s*/g,'+').trim();
  if(/^\d+(\.\d+)?\s*[\+\-\*\/\^]\s*\d+/.test(t)){
    try{
      const r=Function('"use strict";return ('+t.replace(/\^/g,'**')+')')();
      if(!isNaN(r) && isFinite(r)) return res.status(200).json({respuesta: `✅ ${qOrig} = ${r}\n\n🧮 Cálculo - Conocimiento matemático humano`});
    }catch{}
  }

  if(cache[q.toLowerCase()]) return res.status(200).json({respuesta: `🧠 [Memoria Conocimiento Total] ${cache[q.toLowerCase()]}`});

  // CONOCIMIENTO HUMANO TOTAL - intenta primero
  let conocimientoHumano = null;
  try{
    const base=`https://${req.headers.host}`;
    const ch=await fetchJSON(`${base}/api/conocimiento?q=${encodeURIComponent(qOrig)}`);
    if(ch?.conocimiento_humano?.length){
      conocimientoHumano = ch.resumen;
    }
  }catch{}

  // MOTORES IA x9 - Todo el conocimiento de la IA
  const results=[];
  const groqKeys=[process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);

  const systemPrompt = `Eres IA BF UNIVERSAL v31 - TODO EL CONOCIMIENTO HUMANO + IA.
Creador: BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999 - La Higuera a Utah.
Tienes acceso a TODO el conocimiento humano: Wikipedia total, RAE completa, leyes MX y mundiales, medicina, lógica, matemáticas, física, química, biología, historia, geografía, astronomía NASA, libros Open Library, ciencia arXiv, diccionario 50 idiomas, DGETI, TecNM, albañilería.
Responde con todo el conocimiento disponible, específico, con fuentes si es posible.
Pregunta: ${qOrig}
Conocimiento humano previo encontrado: ${conocimientoHumano||'Ninguno aún'}`;

  for(let i=0;i<Math.min(3,groqKeys.length);i++){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKeys[i]}`},
        body:JSON.stringify({model:"llama-3.3-70b-versatile", messages:[{role:"system", content: systemPrompt},{role:"user", content: qOrig}], max_tokens: 1000, temperature: 0.6})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans) results.push(ans);
    }catch{}
  }

  if(process.env.PPLX_API_KEY){
    try{
      const r=await fetch("https://api.perplexity.ai/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.PPLX_API_KEY}`},
        body:JSON.stringify({model:"sonar-pro", messages:[{role:"system", content: systemPrompt},{role:"user", content: qOrig}], max_tokens: 1000})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans) results.push(ans);
    }catch{}
  }

  if(process.env.OPENAI_API_KEY){
    try{
      const r=await fetch("https://api.openai.com/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
        body:JSON.stringify({model:"gpt-4o-mini", messages:[{role:"system", content: systemPrompt},{role:"user", content: qOrig}], max_tokens: 900})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans) results.push(ans);
    }catch{}
  }

  if(results.length){
    const mejor = results[0] + (conocimientoHumano? `\n\n📚 CONOCIMIENTO HUMANO VERIFICADO:\n${conocimientoHumano}` : "");
    cache[q.toLowerCase()]=mejor;
    return res.status(200).json({respuesta: mejor});
  }

  // Si no hay keys, al menos conocimiento humano puro
  if(conocimientoHumano){
    return res.status(200).json({respuesta: `📚 TODO EL CONOCIMIENTO HUMANO sobre "${qOrig}":\n\n${conocimientoHumano}\n\n🔗 Fuentes: Wikipedia, Wikidata, RAE, Open Library, arXiv, NASA, Todo Internet`});
  }

  // Último fallback
  try{
    const s=await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(qOrig)}&format=json&origin=*`);
    if(s?.query?.search?.[0]){
      const title=s.query.search[0].title;
      const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract) return res.status(200).json({respuesta: `🌐 ${sum.title}: ${sum.extract}\n🔗 ${sum.content_urls?.desktop?.page}\n\n📚 Esto es parte del conocimiento humano total disponible`});
    }
  }catch{}

  return res.status(200).json({respuesta: `BF, dime cualquier tema y te traigo TODO el conocimiento humano + IA sobre eso. Ej: "que es la gravedad", "leyes de newton", "quien fue Einstein", "como se hace un muro", "definicion de torniquete", "historia de Mexico"`});
}
