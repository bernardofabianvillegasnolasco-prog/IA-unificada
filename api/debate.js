export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {prompt} = req.body||{};
  if(!prompt) return res.status(400).json({respuesta:"Falta prompt"});
  const q = prompt.trim();
  let final = "";
  let motores_usados = [];
  const fetchText = async (url, t=7000) => {
    try{ const c=new AbortController(); setTimeout(()=>c.abort(),t); const r=await fetch(url,{signal:c.signal, headers:{'User-Agent':'Mozilla/5.0 IA-BF-UNIVERSAL'}}); return r.ok?await r.text():null; }catch{return null;}
  };
  const fetchJSON = async (url, t=7000) => {
    try{ const c=new AbortController(); setTimeout(()=>c.abort(),t); const r=await fetch(url,{signal:c.signal}); return r.ok?await r.json():null; }catch{return null;}
  };
  const mathNatural = (v) => {
    let t=v.toLowerCase().replace(/,/g,'').trim();
    let m=t.match(/ra[ií]z cuadrada de\s*([\d\.]+)/); if(m) return `✅ Raíz cuadrada de ${m[1]} = ${Math.sqrt(parseFloat(m[1]))}`;
    m=t.match(/(\d+(\.\d+)?)\s*%\s*de\s*(\d+(\.\d+)?)/); if(m) return `✅ ${m[1]}% de ${m[3]} = ${(parseFloat(m[1])/100)*parseFloat(m[3])}`;
    m=t.match(/(\d+(\.\d+)?)\s*\^\s*(\d+(\.\d+)?)/); if(m) return `✅ ${m[1]}^${m[3]} = ${Math.pow(parseFloat(m[1]),parseFloat(m[3]))}`;
    if(/^[\d\s\+\-\*\/\(\)\.\,]+$/.test(t) && /[\+\-\*\/\^]/.test(t) && t.length<35){try{const r=Function('"use strict";return ('+t.replace(/\^/g,'**')+')')(); if(!isNaN(r)&&isFinite(r)) return `✅ ${v} = ${r}`;}catch{}}
    return null;
  };
  const math = mathNatural(q);
  if(math){ return res.status(200).json({respuesta: math, motores: ["MOTOR 1: Matemática Local"], x2:[{cerebro:"Motor Matemático", respuesta: math}]}); }
  if(q.toLowerCase().includes("materia")||q.toLowerCase().includes("dgeti")||q.toLowerCase().includes("alba")||q.toLowerCase().includes("trazo")){
    try{
      const base = `https://${req.headers.host}`;
      const m = await fetch(`${base}/api/materias`).then(r=>r.json());
      final = `🧱 MATERIAS DGETI ALBAÑILERÍA + TECNOLÓGICOS:\n\n📚 DGETI:\n${Object.entries(m.dgeti).map(([k,v])=>`${k}: ${v.join(", ")}`).join("\n")}\n\n🔨 ALBAÑILERÍA:\n${m.albanileria.join("\n")}\n\n🏗️ TECNOLÓGICOS:\n${m.tecnologicos.join(", ")}`;
      motores_usados.push("MOTOR 2: Materias DGETI");
    }catch{}
  }
  if(!final){
    try{
      const s = await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`);
      if(s?.query?.search?.[0]){
        const title=s.query.search[0].title;
        const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if(sum?.extract){ final=`🌐 [MOTOR 3: Wikipedia ES] ${sum.title}:\n${sum.extract}\n\n🔗 ${sum.content_urls?.desktop?.page}`; motores_usados.push("MOTOR 3: Wikipedia ES"); }
      }
    }catch{}
  }
  if(!final){
    try{
      const ddg=await fetchJSON(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&pretty=1&no_html=1`);
      if(ddg?.AbstractText){ final=`🌐 [MOTOR 5: DuckDuckGo] ${ddg.Heading}:\n${ddg.AbstractText}\n${ddg.AbstractURL}`; motores_usados.push("MOTOR 5: DuckDuckGo"); }
    }catch{}
  }
  if(!final){
    try{
      const htmlUrl=`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const prox=`https://api.allorigins.win/raw?url=${encodeURIComponent(htmlUrl)}`;
      const html=await fetchText(prox,8000);
      if(html){
        const matches=[...html.matchAll(/<a[^>]+class="result__url"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,200}result__snippet[^>]*>([^<]+)/g)];
        if(matches.length){
          final=`🌐 [MOTOR 6: TODO INTERNET] Resultados para "${q}":\n\n`+matches.slice(0,3).map((m,i)=>`${i+1}. ${m[2].replace(/<[^>]+>/g,'').trim()}\n${m[3].replace(/<[^>]+>/g,'').trim()}\n🔗 ${m[1]}\n`).join("\n");
          motores_usados.push("MOTOR 6: Todo Internet");
        }
      }
    }catch{}
  }
  if(!final && process.env.GROQ_API_KEY){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.GROQ_API_KEY}`},body:JSON.stringify({model:"llama-3.1-8b-instant",messages:[{role:"user",content:q}],max_tokens:1000})});
      const data=await r.json();
      if(data?.choices?.[0]?.message?.content){ final=`🤖 [MOTOR 9: Groq IA Avanzada]\n${data.choices[0].message.content}`; motores_usados.push("MOTOR 9: Groq"); }
    }catch{}
  }
  if(!final){
    final=`🔍 [MOTOR 12: Fallback] Busqué "${q}":\n• Wiki: https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}\n• DDG: https://duckduckgo.com/?q=${encodeURIComponent(q)}\n• Bing: https://www.bing.com/search?q=${encodeURIComponent(q)}`;
    motores_usados.push("MOTOR 12: Fallback");
  }
  return res.status(200).json({respuesta: final, motores: motores_usados, x2:[{cerebro: motores_usados.join(" + "), respuesta: final}]});
}
