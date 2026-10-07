export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).end();
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ respuesta: "Falta prompt" });

  let respuesta = "";
  const q = prompt.toLowerCase();

  try {
    // 1. Si es clima, noticias, dolar, etc -> busca en Wikipedia/DuckDuckGo
    if (q.includes("quien es") || q.includes("que es") || q.includes("cuando") || q.includes("dolar") || q.includes("clima") || q.includes("noticia") || q.includes("precio")) {
      const ddg = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&pretty=1&skip_disambig=1`);
      const data = await ddg.json();
      if (data.AbstractText) {
        respuesta = `🌐 Internet (DuckDuckGo):\n${data.AbstractText}\n\nFuente: ${data.AbstractURL}`;
      } else if (data.RelatedTopics && data.RelatedTopics[0]) {
        respuesta = `🌐 Internet:\n${data.RelatedTopics[0].Text || JSON.stringify(data.RelatedTopics[0])}`;
      }
    }

    // 2. Si no encontró en DDG, busca en Wikipedia ES
    if (!respuesta) {
      try {
        const wikiSearch = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(prompt)}&format=json&origin=*`);
        const wikiData = await wikiSearch.json();
        if (wikiData.query && wikiData.query.search[0]) {
          const title = wikiData.query.search[0].title;
          const summary = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
          const sumData = await summary.json();
          respuesta = `🌐 Wikipedia:\n${sumData.extract}\n\n🔗 ${sumData.content_urls?.desktop?.page}`;
        }
      } catch(e){}
    }

    // 3. Fallback a tus 9 cerebros si internet no dio nada
    if (!respuesta) {
      respuesta = `Me preguntas por ${prompt}. Te lo explico simple y directo, como platicando. Dime que quieres profundizar. [Modo local - sin internet, activa DuckDuckGo/Wikipedia arriba]`;
      // Aquí va tu lógica actual de los 9 cerebros
    }

    return res.status(200).json({ respuesta, x2: [{ respuesta }] });

  } catch (err) {
    return res.status(200).json({ respuesta: `Error internet: ${err.message}. Pero puedo responder local: ${prompt}`, x2: [{ respuesta: `Error: ${err.message}` }] });
  }
}
