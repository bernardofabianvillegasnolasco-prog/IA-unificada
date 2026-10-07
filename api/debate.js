export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {prompt} = req.body||{};
  if(!prompt) return res.status(400).json({respuesta:"Falta prompt"});
  const q = prompt.trim();
  let final = "";

  const fetchText = async (url, timeout=7000) => {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(()=>ctrl.abort(), timeout);
      const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent':'Mozilla/5.0 IA-BF-UNIVERSAL' } });
      clearTimeout(id);
      if(!r.ok) return null;
      return await r.text();
    } catch(e){ return null; }
  };

  try {
    // 1. Wikipedia ES (más rápido y confiable)
    if(!final){
      try{
        const s = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`).then(r=>r.json());
        if(s.query?.search?.[0]){
          const title = s.query.search[0].title;
          const sum = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`).then(r=>r.json());
          if(sum.extract) final = `🌐 [Wikipedia ES] ${sum.title}:\n${sum.extract}\n\n🔗 ${sum.content_urls?.desktop?.page}`;
        }
      }catch(e){}
    }

    // 2. Wikipedia EN
    if(!final){
      try{
        const s = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`).then(r=>r.json());
        if(s.query?.search?.[0]){
          const title = s.query.search[0].title;
          const sum = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`).then(r=>r.json());
          if(sum.extract) final = `🌐 [Wikipedia EN] ${sum.title}:\n${sum.extract}\n\n🔗 ${sum.content_urls?.desktop?.page}`;
        }
      }catch(e){}
    }

    // 3. DuckDuckGo Abstract
    if(!final){
      try{
        const ddg = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&pretty=1&no_html=1&skip_disambig=1`).then(r=>r.json());
        if(ddg.AbstractText) final = `🌐 [DuckDuckGo] ${ddg.Heading}:\n${ddg.AbstractText}\n\nFuente: ${ddg.AbstractURL}`;
        else if(ddg.RelatedTopics?.[0]?.Text) final = `🌐 [DuckDuckGo]\n${ddg.RelatedTopics[0].Text}\n${ddg.RelatedTopics[0].FirstURL||''}`;
      }catch(e){}
    }

    // 4. TODO INTERNET - Bing HTML scraping via AllOrigins (esto es lo que te faltaba)
    if(!final){
      try{
        // Usamos html.duckduckgo.com que es scrapeable y trae TODO internet
        const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(htmlUrl)}`;
        const html = await fetchText(proxied, 8000);
        if(html){
          // Extrae los primeros 3 resultados reales
          const matches = [...html.matchAll(/<a[^>]+class="result__url"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,200}result__snippet[^>]*>([^<]+)/g)];
          if(matches.length){
            let texto = `🌐 [TODO INTERNET - DuckDuckGo HTML] Resultados para "${q}":\n\n`;
            matches.slice(0,3).forEach((m,i)=>{
              const url = m[1];
              const title = m[2]?.replace(/<[^>]+>/g,'').trim();
              const snippet = m[3]?.replace(/<[^>]+>/g,'').trim();
              texto += `${i+1}. ${title}\n${snippet}\n🔗 ${url}\n\n`;
            });
            final = texto;
          }
        }
      }catch(e){}
    }

    // 5. Fallback final con links directos de búsqueda (como motor real)
    if(!final){
      final = `🔍 No hay resumen instantáneo, pero busqué "${q}" en TODO internet:\n\n`+
              `• Wikipedia ES: https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}\n`+
              `• Wikipedia EN: https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}\n`+
              `• DuckDuckGo: https://duckduckgo.com/?q=${encodeURIComponent(q)}\n`+
              `• Bing: https://www.bing.com/search?q=${encodeURIComponent(q)}\n`+
              `• Google: https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }

    return res.status(200).json({ respuesta: final, x2:[{cerebro:"IA BF UNIVERSAL - TODO INTERNET", respuesta: final}] });

  } catch(err){
    return res.status(200).json({ respuesta: `❌ Error motor TODO INTERNET: ${err.message}`, x2:[{cerebro:"Error", respuesta: err.message}] });
  }
}
