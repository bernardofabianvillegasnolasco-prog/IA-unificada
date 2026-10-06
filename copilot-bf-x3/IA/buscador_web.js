export async function buscarTodoInternet(query){
  const q = query.trim();
  const lower = q.toLowerCase();

  // Extrae palabras clave reales, quita basura
  function extraerKeywords(text){
    const stopwords = ["que","qué","quien","quién","como","cómo","cuando","donde","cual","cuales","es","son","la","el","las","los","un","una","de","del","en","con","por","para","al","explicacion","simple","explicación","hacer","como","dime","me","puedes","puede"];
    let words = text.toLowerCase().replace(/[?¿!¡.,]/g,"").split(/\s+/).filter(w=>w.length>2 &&!stopwords.includes(w));
    if(words.length===0) words = text.split(/\s+/).slice(-2);
    return [...new Set(words)]; // únicos
  }

  const kws = extraerKeywords(q);
  const queriesPrioritarias = [
    kws.join(" "), // "fotosintesis"
    kws.slice(-2).join(" "), // últimas 2
    kws.slice(-1)[0], // última palabra
    kws[0], // primera clave
    q.split(" ").slice(-3).join(" ")
  ].filter(Boolean);

  const f = async (url, opts={}) => {
    try{
      const r = await fetch(url, { headers: { "User-Agent": "IA-BF-x9/1.0 BF", "Accept": "application/json,text/*",...opts.headers },...opts, signal: AbortSignal.timeout(6000) });
      if(!r.ok) return null;
      const ct = r.headers.get("content-type")||"";
      if(ct.includes("json")) return await r.json();
      return await r.text();
    }catch{ return null; }
  };

  let resultados = [];

  // 1. Wikipedia ES + EN con keywords limpias
  for(const query of queriesPrioritarias){
    if(resultados.length>0) break;
    for(const lang of ["es","en"]){
      try{
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`;
        const search = await f(searchUrl);
        const title = search?.[1]?.[0];
        if(title){
          const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
          const sum = await f(sumUrl);
          if(sum?.extract && sum.extract.length>30) { resultados.push(sum.extract); break; }
        }
      }catch{}
    }
  }

  // 2. Jina AI lee DuckDuckGo - TODO INTERNET REAL (ahora con keywords)
  if(resultados.length===0){
    for(const query of queriesPrioritarias.slice(0,2)){
      try{
        const jinaUrl = `https://r.jina.ai/https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const txt = await f(jinaUrl);
        if(txt && txt.length>200){
          // Extrae primer resultado útil
          const lines = txt.split("\n").filter(l=>l.length>40 &&!l.includes("DuckDuckGo") &&!l.includes("https://")).slice(0,3);
          const clean = lines.join(" ").replace(/\s+/g," ").slice(0,400);
          if(clean.length>80) { resultados.push(clean); break; }
        }
      }catch{}
    }
  }

  // 3. DuckDuckGo Instant
  if(resultados.length===0){
    for(const query of queriesPrioritarias.slice(0,2)){
      const ddg = await f(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      if(ddg?.AbstractText) { resultados.push(ddg.AbstractText); break; }
      if(ddg?.RelatedTopics?.[0]?.Text) { resultados.push(ddg.RelatedTopics[0].Text); break; }
    }
  }

  return resultados[0] || "";
}
