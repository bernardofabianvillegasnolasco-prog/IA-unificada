export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();

  const q = (req.query.q || req.body?.q || "").trim();
  if(!q) return res.status(400).json({error:"Falta q="});
  const palabra = q;

  const fetchJSON = async (url, opts={}) => {
    try{ const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 IA-BF v31 CONOCIMIENTO TOTAL',...opts.headers||{}},...opts}); if(!r.ok) return null; return await r.json(); }catch{return null;}
  };
  const fetchText = async (url) => {
    try{ const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}}); if(!r.ok) return null; return await r.text(); }catch{return null;}
  };

  let resultados = [];

  // 1. WIKIPEDIA ES + EN - Enciclopedia humana total
  try{
    const [es, en] = await Promise.all([
      fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(palabra)}&format=json&origin=*`),
      fetchJSON(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(palabra)}&format=json&origin=*`)
    ]);
    if(es?.query?.search?.[0]){
      const title=es.query.search[0].title;
      const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract) resultados.push({fuente:"Wikipedia ES - Conocimiento Humano", titulo: sum.title, texto: sum.extract, url: sum.content_urls?.desktop?.page, peso: 10});
    }
    if(en?.query?.search?.[0]){
      const title=en.query.search[0].title;
      const sum=await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract) resultados.push({fuente:"Wikipedia EN - Human Knowledge", titulo: sum.title, texto: sum.extract, url: sum.content_urls?.desktop?.page, peso: 9});
    }
  }catch{}

  // 2. WIKIDATA - Base de datos estructurada de todo
  try{
    const wd=await fetchJSON(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(palabra)}&language=es&format=json&origin=*`);
    if(wd?.search?.[0]){
      const id=wd.search[0].id;
      const entity=await fetchJSON(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=descriptions|labels&languages=es|en&format=json&origin=*`);
      const desc=entity?.entities?.[id]?.descriptions?.es?.value || entity?.entities?.[id]?.descriptions?.en?.value;
      if(desc) resultados.push({fuente:"Wikidata - Base Conocimiento Humano", titulo: wd.search[0].label, texto: desc, url: `https://www.wikidata.org/wiki/${id}`, peso: 8});
    }
  }catch{}

  // 3. WIKTIONARY + RAE - Diccionario total
  try{
    const rae=await fetchJSON(`https://rae-api.com/api/search?word=${encodeURIComponent(palabra)}`);
    if(rae?.data?.definitions?.length) resultados.push({fuente:"RAE - Lengua Española", titulo: palabra, texto: rae.data.definitions.slice(0,3).join(" | "), url: `https://dle.rae.es/${palabra}`, peso: 8});
  }catch{}
  try{
    const dict=await fetchJSON(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(palabra)}`);
    if(dict?.[0]?.meanings?.[0]?.definitions?.[0]?.definition) resultados.push({fuente:"Dictionary EN", titulo: palabra, texto: dict[0].meanings[0].definitions[0].definition, url: `https://dictionary.cambridge.org/dictionary/english/${palabra}`, peso: 7});
  }catch{}

  // 4. OPEN LIBRARY - Libros de la humanidad
  try{
    const books=await fetchJSON(`https://openlibrary.org/search.json?q=${encodeURIComponent(palabra)}&limit=2`);
    if(books?.docs?.[0]) resultados.push({fuente:"Open Library - Libros Humanidad", titulo: books.docs[0].title, texto: `Autor: ${books.docs[0].author_name?.[0]||'Desconocido'} - Año: ${books.docs[0].first_publish_year||''} - ${books.docs[0].subject?.slice(0,3).join(", ")||''}`, url: `https://openlibrary.org${books.docs[0].key}`, peso: 6});
  }catch{}

  // 5. ARXIV - Ciencia total
  try{
    const arxiv=await fetchText(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(palabra)}&max_results=1`);
    if(arxiv){
      const titleMatch=arxiv.match(/<title>([^<]+)<\/title>/g);
      const summaryMatch=arxiv.match(/<summary>([^<]+)<\/summary>/);
      if(titleMatch && summaryMatch) resultados.push({fuente:"arXiv - Ciencia Humana", titulo: titleMatch[1]?.replace(/<[^>]+>/g,'').slice(0,100), texto: summaryMatch[1].replace(/<[^>]+>/g,'').slice(0,400), url: `https://arxiv.org/search/?query=${encodeURIComponent(palabra)}`, peso: 7});
    }
  }catch{}

  // 6. NASA + GEOGRAFÍA + TODO
  if(palabra.match(/planeta|estrella|nasa|universo|galaxia/i)){
    try{
      const nasa=await fetchJSON(`https://images-api.nasa.gov/search?q=${encodeURIComponent(palabra)}&media_type=image`);
      if(nasa?.collection?.items?.[0]) resultados.push({fuente:"NASA - Conocimiento Espacial", titulo: nasa.collection.items[0].data[0].title, texto: nasa.collection.items[0].data[0].description?.slice(0,400), url: `https://images.nasa.gov/search-results?q=${palabra}`, peso: 8});
    }catch{}
  }

  // 7. DUCKDUCKGO + BRAVE - Todo internet
  try{
    const htmlUrl=`https://html.duckduckgo.com/html/?q=${encodeURIComponent(palabra)}`;
    const prox=`https://api.allorigins.win/raw?url=${encodeURIComponent(htmlUrl)}`;
    const html=await fetchText(prox);
    if(html){
      const matches=[...html.matchAll(/<a[^>]+class="result__url"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,200}result__snippet[^>]*>([^<]+)/g)];
      matches.slice(0,2).forEach(m=>{
        resultados.push({fuente:"Todo Internet - DDG", titulo: m[2].replace(/<[^>]+>/g,'').trim(), texto: m[3].replace(/<[^>]+>/g,'').trim(), url: m[1], peso: 5});
      });
    }
  }catch{}

  // Ordenar por peso
  resultados.sort((a,b)=>b.peso-a.peso);

  return res.status(200).json({
    query: palabra,
    total_fuentes: resultados.length,
    conocimiento_humano: resultados,
    resumen: resultados.slice(0,3).map(r=>`[${r.fuente}] ${r.titulo}: ${r.texto}`).join("\n\n"),
    mensaje: `Conocimiento total de la humanidad sobre "${palabra}" - ${resultados.length} fuentes`
  });
}
