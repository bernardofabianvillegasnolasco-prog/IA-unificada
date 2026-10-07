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

  // Matemática
  let t=q.replace(/,/g,'').replace(/\s*y\s*/g,'+').trim();
  if(/^\d+(\.\d+)?\s*[\+\-\*\/\^]\s*\d+(\.\d+)?/.test(t)){
    try{
      const r=Function('"use strict";return ('+t.replace(/\^/g,'**')+')')();
      if(!isNaN(r) && isFinite(r)) return res.status(200).json({respuesta: `✅ ${qOrig} = ${r}`});
    }catch{}
  }

  // DETECTOR DICCIONARIO RAE + INGLÉS + TODOS IDIOMAS
  const esDiccionario = q.includes("que significa") || q.includes("que es") || q.includes("definicion") || q.includes("definición") || q.includes("diccionario") || q.includes("rae") || q.includes("significado de") || q.match(/^que es\s+\w+$/i) || q.match(/^define\s+\w+/i) || q.match(/^meaning of/i) || q.match(/^what does.* mean/i) || q.includes("en ingles") || q.includes("en inglés") || q.includes("traducir") || q.includes("translate");

  if(esDiccionario){
    try{
      let palabra = qOrig;
      palabra = palabra.replace(/que significa/gi,'').replace(/que es/gi,'').replace(/definicion de/gi,'').replace(/definición de/gi,'').replace(/diccionario/gi,'').replace(/rae/gi,'').replace(/significado de/gi,'').replace(/define/gi,'').replace(/meaning of/gi,'').replace(/what does/gi,'').replace(/mean/gi,'').replace(/en ingles/gi,'').replace(/en inglés/gi,'').replace(/traducir/gi,'').replace(/translate/gi,'').replace(/\?/g,'').trim();
      palabra = palabra.split(" ")[0].trim();
      if(palabra.length>=2){
        const base=`https://${req.headers.host}`;
        const lang = q.includes("en ingles")||q.includes("english")||/^[a-z]{2,}$/.test(palabra) && palabra.length<10 &&!palabra.includes(" ")? (q.includes("ingles")?"es":"en") : "es";
        const dict = await fetchJSON(`${base}/api/diccionario?q=${encodeURIComponent(palabra)}&lang=${lang}`);
        if(dict){
          let resp = `📚 DICCIONARIO COMPLETO - ${dict.fuente || "RAE + Multi-idioma"}:\n\n`;
          resp+=`Palabra: ${dict.palabra || palabra} [${dict.idioma || lang}]\n`;
          if(dict.fonetica) resp+=`🔊 Fonética: ${dict.fonetica}\n`;
          if(dict.definicion) resp+=`📖 RAE: ${dict.definicion}\n\n`;
          if(dict.definiciones) resp+=`📖 Definiciones RAE:\n${dict.definiciones.map((d,i)=>`${i+1}. ${typeof d==='string'?d:d.definition||d}`).join("\n")}\n\n`;
          if(dict.significados){
            resp+= dict.significados.map(s=>`🔹 ${s.tipo}:\n${s.definiciones?.map((d,j)=>` ${j+1}. ${d}`).join("\n")}${s.ejemplo?`\n Ej: "${s.ejemplo}"`:''}`).join("\n\n") + "\n\n";
          }
          if(dict.traducciones){
            resp+=`🌍 TRADUCCIONES:\n`;
            Object.entries(dict.traducciones).forEach(([k,v])=>{ if(v) resp+=`• ${k}: ${v}\n`; });
          }
          resp+=`\n🔗 ${dict.url || `https://dle.rae.es/${encodeURIComponent(palabra)}`}`;
          cache[q.toLowerCase()]=resp;
          return res.status(200).json({respuesta: resp});
        }
      }
    }catch{}
  }

  // Base general
  try{
    const base=`https://${req.headers.host}`;
    const db=await fetchJSON(`${base}/api/materias`);
    if(db){
      if(q.includes("ley") || q.includes("art")) return res.status(200).json({respuesta: `⚖️ LEYES GENERAL:\n${db.leyes_generales.leyes_federales.slice(0,5).join("\n")}`});
      if(q.includes("medicina") || q.includes("torniquete") || q.includes("rcp")) return res.status(200).json({respuesta: `🩺 MEDICINA:\n${db.medicina_general.primeros_auxilios.slice(0,3).join("\n\n")}`});
    }
  }catch{}

  // Motores IA x9
  const results=[];
  const groqKeys=[process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
  for(let i=0;i<Math.min(3,groqKeys.length);i++){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKeys[i]}`},
        body:JSON.stringify({model:"llama-3.3-70b-versatile", messages:[{role:"system", content:"Eres IA BF v30 diccionario RAE completo + traductor multi-idioma + experto leyes medicina."},{role:"user", content: qOrig}], max_tokens: 900})
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

  if(results.length) return res.status(200).json({respuesta: results[0]});

  // Fallback Wikipedia
  try{
    const s=await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(qOrig)}&format=json&origin=*`);
    if(s?.query?.search?.[0]){
      const title=s.query.search[0].title;
      const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract) return res.status(200).json({respuesta: `🌐 ${sum.title}: ${sum.extract}\n🔗 ${sum.content_urls?.desktop?.page}`});
    }
  }catch{}

  return res.status(200).json({respuesta: `Dime palabra para diccionario: "que significa albañilería", "definicion de torniquete", "en ingles hola", "RAE construir"`});
}
