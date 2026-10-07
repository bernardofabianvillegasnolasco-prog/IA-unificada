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
  let q = qOrig.toLowerCase().replace(/×/g,'*').replace(/÷/g,'/').replace(/x/g,'*').replace(/X/g,'*');

  const fetchJSON = async (url) => {
    try{ const r=await fetch(url); return r.ok?await r.json():null; }catch{return null;}
  };
  const fetchText = async (url) => {
    try{ const r=await fetch(url); return r.ok?await r.text():null; }catch{return null;}
  };

  // Matemática
  let t=q.replace(/,/g,'').replace(/\s*y\s*/g,'+').trim();
  if(/^\d+(\.\d+)?\s*[\+\-\*\/\^]\s*\d+(\.\d+)?/.test(t)){
    try{
      const r=Function('"use strict";return ('+t.replace(/\^/g,'**')+')')();
      if(!isNaN(r) && isFinite(r)) return res.status(200).json({respuesta: `✅ ${qOrig} = ${r}`});
    }catch{}
  }

  // Búsqueda en base GENERAL
  try{
    const base=`https://${req.headers.host}`;
    const db=await fetchJSON(`${base}/api/materias`);
    if(db){
      if(q.includes("ley") || q.includes("art") || q.includes("constitucion") || q.includes("trabajo") || q.includes("imss") || q.includes("codigo") || q.includes("nom")){
        let resp=`⚖️ LEYES EN GENERAL - ESPECÍFICO:\n\n`+
        `📜 CONSTITUCIÓN:\n${db.leyes_generales.constitucion_mx.join("\n")}\n\n`+
        `📚 FEDERALES:\n${db.leyes_generales.leyes_federales.join("\n")}\n\n`+
        `🏗️ NOMS:\n${db.leyes_generales.noms.join("\n")}`;
        if(q.includes("trabajo")) resp+=`\n\n💼 LFT DETALLADO: Jornada diurna 8h, nocturna 7h, mixta 7.5h, 1 día descanso por 6, vacaciones 12 días año 1 +2 cada año, prima 25%, aguinaldo 15 días, utilidades 10%, liquidación 90 días + 20 días por año si despido injustificado`;
        if(q.includes("torniquete")||q.includes("primeros")||q.includes("rcp")||q.includes("hemorragia")||q.includes("salud")) resp=`🩺 MEDICINA GENERAL:\n${db.medicina_general.primeros_auxilios.join("\n\n")}`;
        return res.status(200).json({respuesta: resp});
      }
      if(q.includes("medicina") || q.includes("torniquete") || q.includes("rcp") || q.includes("hemorragia") || q.includes("quemadura") || q.includes("fractura") || q.includes("primeros auxilios") || q.includes("paracetamol") || q.includes("botiquin")){
        const resp=`🩺 MEDICINA EN GENERAL - ESPECÍFICO:\n\n`+
        `🚑 PRIMEROS AUXILIOS:\n${db.medicina_general.primeros_auxilios.join("\n\n")}\n\n`+
        `🧍 ANATOMÍA: ${db.medicina_general.anatomia_basica.join(", ")}\n\n`+
        `💊 MEDICAMENTOS: ${db.medicina_general.medicamentos_comunes.join("\n")}\n\n`+
        `🦠 ENFERMEDADES: ${db.medicina_general.enfermedades_comunes.join("\n")}`;
        return res.status(200).json({respuesta: resp});
      }
      if(q.includes("logica") || q.includes("silogismo") || q.includes("falacia") || q.includes("filosofia") || q.includes("etica") || q.includes("metodo cientifico")){
        return res.status(200).json({respuesta: `🧠 LÓGICA Y FILOSOFÍA EN GENERAL:\n\n${db.logica_filosofia.join("\n\n")}`});
      }
      if(q.includes("carrera") || q.includes("que estudiar")){
        return res.status(200).json({respuesta: `🎓 CARRERAS EN GENERAL:\n\n${db.carreras_generales.join("\n\n")}`});
      }
      if(q.includes("materia") || q.includes("dgeti")){
        return res.status(200).json({respuesta: `📚 DGETI GENERAL:\n${Object.entries(db.dgeti_general).map(([k,v])=>`${k}: ${v.join(", ")}`).join("\n")}`});
      }
    }
  }catch{}

  // Motores IA x9 si hay keys
  const results=[];
  const groqKeys=[process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
  for(let i=0;i<Math.min(3,groqKeys.length);i++){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKeys[i]}`},
        body:JSON.stringify({model:"llama-3.3-70b-versatile", messages:[{role:"system", content:"Eres IA BF UNIVERSAL v29 TODO EN GENERAL, experto en leyes generales MX, medicina general, lógica, DGETI, TecNM, albañilería. Responde específico y general."},{role:"user", content: qOrig}], max_tokens: 900})
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
        body:JSON.stringify({model:"sonar-pro", messages:[{role:"user", content: qOrig}], max_tokens: 800})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans) results.push(ans);
    }catch{}
  }

  if(results.length){
    cache[q.toLowerCase()]=results[0];
    return res.status(200).json({respuesta: results[0]});
  }

  // Fallback Wikipedia general
  try{
    const s=await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(qOrig)}&format=json&origin=*`);
    if(s?.query?.search?.[0]){
      const title=s.query.search[0].title;
      const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract) return res.status(200).json({respuesta: `🌐 ${sum.title}: ${sum.extract}\n🔗 ${sum.content_urls?.desktop?.page}`});
    }
  }catch{}

  return res.status(200).json({respuesta: `BF, dime específico: leyes generales, medicina general, lógica, carreras, DGETI, o cualquier tema general y te respondo detallado. Tu pregunta "${qOrig}" la busco en todo internet también.`});
}
