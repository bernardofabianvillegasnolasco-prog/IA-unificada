export async function POST(req){
  const { prompt } = await req.json();
  let respuesta = "";
  try {
    const ddg = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&pretty=1`, { cache: 'no-store' });
    const data = await ddg.json();
    if (data.AbstractText) respuesta = `🌐 Internet: ${data.AbstractText} - ${data.AbstractURL}`;
    else {
      const wiki = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(prompt)}&format=json`);
      const w = await wiki.json();
      if (w.query?.search?.[0]) respuesta = `🌐 Wiki: ${w.query.search[0].snippet.replace(/<[^>]+>/g,'')} - https://es.wikipedia.org/wiki/${encodeURIComponent(w.query.search[0].title)}`;
    }
    if (!respuesta) respuesta = `Respuesta local para: ${prompt}. Conectado a internet pero no hay resultado directo.`;
  } catch(e){ respuesta = `Error: ${e.message}`; }
  return Response.json({ respuesta, x2: [{ respuesta }] });
}
