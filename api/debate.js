export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  const {prompt} = req.body||{};
  if(!prompt) return res.status(400).json({respuesta:"Falta prompt"});

  let respuesta = "";
  const q = prompt.trim();

  try {
    // MOTOR DE BUSQUEDA REAL - 3 FUENTES
    // 1. DuckDuckGo
    try {
      const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&pretty=1&no_html=1&skip_disambig=1`);
      const ddg = await ddgRes.json();
      if(ddg.AbstractText) respuesta = `🌐 ${ddg.AbstractText}\n\nFuente: ${ddg.AbstractURL}`;
      else if(ddg.RelatedTopics && ddg.RelatedTopics[0] && ddg.RelatedTopics[0].Text) respuesta = `🌐 ${ddg.RelatedTopics[0].Text}\n${ddg.RelatedTopics[0].FirstURL||''}`;
    } catch(e){}

    // 2. Wikipedia ES (si DDG no dio nada)
    if(!respuesta){
      try {
        const searchRes = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`);
        const searchData = await searchRes.json();
        if(searchData.query && searchData.query.search[0]){
          const title = searchData.query.search[0].title;
          const sumRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
          const sum = await sumRes.json();
          if(sum.extract) respuesta = `🌐 Wikipedia - ${sum.title}:\n${sum.extract}\n\n🔗 ${sum.content_urls?.desktop?.page}`;
        }
      } catch(e){}
    }

    // 3. Wikipedia EN fallback
    if(!respuesta){
      try {
        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`);
        const searchData = await searchRes.json();
        if(searchData.query && searchData.query.search[0]){
          const title = searchData.query.search[0].title;
          const sumRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
          const sum = await sumRes.json();
          if(sum.extract) respuesta = `🌐 Wikipedia EN - ${sum.title}:\n${sum.extract}\n\n🔗 ${sum.content_urls?.desktop?.page}`;
        }
      } catch(e){}
    }

    // Si nada funcionó, respuesta con búsqueda
    if(!respuesta){
      respuesta = `🔍 Busqué "${q}" en internet pero no hay resumen directo. Intenta ser más específico.\n\nPuedes buscar manualmente:\n• https://es.wikipedia.org/wiki/${encodeURIComponent(q)}\n• https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    }

    return res.status(200).json({ respuesta, x2:[{cerebro:"IA BF UNIVERSAL - Motor Búsqueda", respuesta}] });

  } catch(err){
    return res.status(200).json({ respuesta: `❌ Error motor búsqueda: ${err.message}`, x2:[{cerebro:"Error", respuesta: err.message}] });
  }
}
