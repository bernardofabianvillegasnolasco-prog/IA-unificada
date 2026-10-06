export async function buscarTodoInternet(query){
  const q = query.trim();
  let resultados = [];

  // Función helper fetch con UA
  const f = async (url, opts={}) => {
    try{
      const r = await fetch(url, {
        headers: { "User-Agent": "IA-BF-x9/1.0 (BF Villegas)", "Accept": "application/json,text/html",...opts.headers },
       ...opts
      });
      if(!r.ok) return null;
      const ct = r.headers.get("content-type")||"";
      if(ct.includes("json")) return await r.json();
      return await r.text();
    }catch{ return null; }
  };

  // 1. BRAVE SEARCH API (si tienes key en Vercel ENV: BRAVE_API_KEY)
  if(process.env.BRAVE_API_KEY){
    const brave = await f(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=3`, {
      headers: { "X-Subscription-Token": process.env.BRAVE_API_KEY }
    });
    if(brave?.web?.results?.[0]?.description) resultados.push(brave.web.results[0].description);
  }

  // 2. TAVILY API (si tienes TAVILY_API_KEY)
  if(process.env.TAVILY_API_KEY && resultados.length===0){
    const tav = await f("https://api.tavily.com/search", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: q, max_results:3 })
    });
    if(tav?.results?.[0]?.content) resultados.push(tav.results[0].content);
  }

  // 3. SERPER API (si tienes SERPER_API_KEY)
  if(process.env.SERPER_API_KEY && resultados.length===0){
    const ser = await f("https://google.serper.dev/search", {
      method:"POST",
      headers:{"Content-Type":"application/json","X-API-KEY":process.env.SERPER_API_KEY},
      body: JSON.stringify({ q })
    });
    if(ser?.organic?.[0]?.snippet) resultados.push(ser.organic[0].snippet);
  }

  // 4. WIKIPEDIA ES + EN (gratis, siempre funciona)
  if(resultados.length===0){
    for(const lang of ["es","en"]){
      try{
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&format=json`;
        const search = await f(searchUrl);
        const title = search?.[1]?.[0];
        if(title){
          const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
          const sum = await f(sumUrl);
          if(sum?.extract) { resultados.push(sum.extract); break; }
        }
      }catch{}
    }
  }

  // 5. JINA AI READER - lee CUALQUIER web real (Bing, DuckDuckGo results)
  if(resultados.length===0){
    try{
      // Jina lee la búsqueda de DuckDuckGo HTML y extrae texto real de internet
      const jinaDDG = await f(`https://r.jina.ai/https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
      if(jinaDDG && jinaDDG.length > 100){
        // Limpia y toma primeras líneas útiles
        const clean = jinaDDG.replace(/\n+/g," ").slice(0,400);
        if(clean.length>80) resultados.push(clean);
      }
    }catch{}
  }

  // 6. DuckDuckGo Instant Answer (fallback final)
  if(resultados.length===0){
    const ddg = await f(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
    if(ddg?.AbstractText) resultados.push(ddg.AbstractText);
    else if(ddg?.RelatedTopics?.[0]?.Text) resultados.push(ddg.RelatedTopics[0].Text);
  }

  return resultados[0] || "";
}
