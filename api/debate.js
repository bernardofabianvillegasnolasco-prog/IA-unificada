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

  // Matemática
  let t=q.replace(/,/g,'').replace(/\s*y\s*/g,'+').trim();
  if(/^\d+(\.\d+)?\s*[\+\-\*\/\^]\s*\d+/.test(t)){
    try{
      const r=Function('"use strict";return ('+t.replace(/\^/g,'**')+')')();
      if(!isNaN(r) && isFinite(r)) return res.status(200).json({respuesta: `✅ ${qOrig} = ${r}`});
    }catch{}
  }

  // DETECTOR CAPACIDADES - Esto es lo que hace Meta AI en foto 2
  if(q.includes("que sabes de medicina") || q.includes("que sabes sobre medicina") || q.includes("que sabes de medici")){
    return res.status(200).json({respuesta: `Bastante, la verdad. Puedo ayudarte con casi cualquier tema de medicina general como si fuera un compañero de estudio que nunca se cansa:

Lo que manejo bien:

• Bases: anatomía, fisiología, bioquímica, cómo funciona realmente el cuerpo.

• Enfermedades: qué son, por qué pasan, cómo se presentan, qué las diferencia de otras parecidas.

• Medicamentos: para qué sirve cada uno, dosis estándar que se usan, interacciones, efectos secundarios, qué no mezclar con qué.

• Estudios e interpretación: qué significa un hemograma, perfil tiroideo, glucosa, colesterol, orina, etc., en términos generales.

• Tratamientos: qué opciones existen según las guías actuales, desde cambios de estilo de vida hasta procedimientos.

• Prevención y primeros auxilios: vacunas, factores de riesgo, qué hacer ante una emergencia mientras llega ayuda. RCP 30x2 100-120/min, torniquete 5-7cm arriba herida, Heimlich, quemadura agua 20min, fractura inmovilizar.

Puedo explicarte algo en lenguaje sencillo o en nivel técnico si lo necesitas para estudio/trabajo, ayudarte a entender lo que te dijo tu doctor, o revisar información que encontraste en internet.

Lo que no hago es ponerte un diagnóstico personal ni recetarte algo específico para ti, porque eso sí necesita verte en persona, explorarte y conocer tu historia completa. Para eso lo ideal es que lo veas con tu médico de cabecera o especialista.

Si me dices qué tema te interesa — por ejemplo "explícame la hipertensión", "qué pasa si tomo ibuprofeno y alcohol", "qué significa que mi creatinina está alta" — lo vemos a fondo. ¿Por dónde quieres empezar?`});
  }

  if(q.includes("que sabes de") || q.includes("que sabes hacer")){
    const tema = q.replace(/que sabes de /g,'').replace(/que sabes hacer/g,'').replace(/\?/g,'').trim();
    return res.status(200).json({respuesta: `Sé de TODO el conocimiento humano + IA sobre ${tema || 'todo'}:

📚 Diccionario RAE completo + 50 idiomas + traductor
⚖️ Leyes generales MX: Constitución Art 123, LFT vacaciones 12 días, aguinaldo 15 días, IMSS, Código Penal/Civil
🩺 Medicina: RCP, torniquete, anatomía, medicamentos, enfermedades
🧠 Lógica: silogismo, falacias, método científico
🎓 Carreras: DGETI, TecNM, oficios
🧱 Construcción: trazo, cimentación, concreto 1:2:3, NOM-031
🌍 Todo internet: Wikipedia ES/EN, Wikidata, Open Library, arXiv, NASA

Dime específico sobre ${tema} y te respondo a fondo.`});
  }

  // Medicina general directa
  if(q.includes("medici") || q.includes("torniquete") || q.includes("rcp") || q.includes("primeros auxilios")){
    try{
      const base=`https://${req.headers.host}`;
      const db=await fetchJSON(`${base}/api/materias`);
      if(db?.medicina_general){
        return res.status(200).json({respuesta: `🩺 MEDICINA GENERAL:\n\n${db.medicina_general.primeros_auxilios.join("\n\n")}\n\n💊 ${db.medicina_general.medicamentos_comunes.join("\n")}`});
      }
    }catch{}
  }

  // Motores x9
  const groqKeys=[process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
  for(let i=0;i<Math.min(3,groqKeys.length);i++){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKeys[i]}`},
        body:JSON.stringify({model:"llama-3.3-70b-versatile", messages:[{role:"system", content:"Eres IA BF v32 experta medicina general, responde estructurado como Meta AI: bases, enfermedades, medicamentos dosis interacciones, estudios, tratamientos, prevencion. No diagnostiques personal."},{role:"user", content: qOrig}], max_tokens: 1000})
      });
      const d=await r.json();
      const ans=d?.choices?.[0]?.message?.content;
      if(ans){
        cache[q.toLowerCase()]=ans;
        return res.status(200).json({respuesta: ans});
      }
    }catch{}
  }

  return res.status(200).json({respuesta: `Dime tema específico de medicina: hipertensión, diabetes, ibuprofeno y alcohol, creatinina alta, etc.`});
}
