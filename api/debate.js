let cache = global._bf_cache || {};
let fallos = global._bf_fallos || [];
global._bf_cache = cache;
global._bf_fallos = fallos;

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

  const registrarFallo = (qq) => {
    fallos.push({q: qq, t: Date.now()});
    if(fallos.length>20) fallos=fallos.slice(-20);
    global._bf_fallos=fallos;
  };

  // Matemática
  let t=q.replace(/,/g,'').replace(/\s*y\s*/g,'+').trim();
  if(/^\d+(\.\d+)?\s*[\+\-\*\/\^]\s*\d+/.test(t)){
    try{
      const r=Function('"use strict";return ('+t.replace(/\^/g,'**')+')')();
      if(!isNaN(r) && isFinite(r)) return res.status(200).json({respuesta: `✅ ${qOrig} = ${r}`});
    }catch{}
  }

  if(cache[q.toLowerCase()]) return res.status(200).json({respuesta: cache[q.toLowerCase()]});

  // Capacidades
  if(q.includes("que sabes de medicina")){
    return res.status(200).json({respuesta: `Bastante, la verdad. Puedo ayudarte con casi cualquier tema de medicina general como si fuera un compañero de estudio que nunca se cansa:

Lo que manejo bien:
- Bases: anatomía, fisiología, bioquímica
- Enfermedades: qué son, por qué pasan, cómo se presentan
- Medicamentos: para qué sirve, dosis estándar, interacciones, efectos secundarios
- Estudios: hemograma, tiroideo, glucosa, colesterol, orina
- Tratamientos: guías actuales, cambios estilo vida hasta procedimientos
- Prevención y primeros auxilios: vacunas, RCP 30x2 100-120/min, torniquete 5-7cm, Heimlich, quemadura agua 20min

Puedo explicar en lenguaje sencillo o técnico. No diagnostico personal, ve con tu médico de cabecera.

Dime tema: hipertensión, diabetes, ibuprofeno y alcohol, creatinina alta, etc.`});
  }

  // Motores x9
  const groqKeys=[process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
  for(let i=0;i<Math.min(3,groqKeys.length);i++){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKeys[i]}`},
        body:JSON.stringify({model:"llama-3.3-70b-versatile", messages:[{role:"system", content:"Eres IA BF v33 con BOOT autocorrector evolutivo, todo conocimiento humano + IA"},{role:"user", content: qOrig}], max_tokens: 1000})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans){
        cache[q.toLowerCase()]=ans;
        return res.status(200).json({respuesta: ans});
      }
    }catch{}
  }

  // Si falla todo, registrar para que BOOT lo autocorrija después
  try{
    const base=`https://${req.headers.host}`;
    const evo=await fetchJSON(`${base}/api/conocimiento?q=${encodeURIComponent(qOrig)}`);
    if(evo?.resumen){
      cache[q.toLowerCase()]=evo.resumen;
      return res.status(200).json({respuesta: evo.resumen});
    }
  }catch{}

  registrarFallo(qOrig);
  return res.status(200).json({respuesta: `BF, no pude responder "${qOrig}" ahora, pero mi BOOT AUTOCORRECTOR lo registró y lo corregirá solo en 10 min. Fallos en cola: ${fallos.length}. Mientras dime otro tema.`});
}
