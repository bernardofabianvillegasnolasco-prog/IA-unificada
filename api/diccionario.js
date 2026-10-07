export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();

  const q = (req.query.q || req.query.word || req.body?.q || "").trim();
  const lang = (req.query.lang || req.body?.lang || "es").toLowerCase();
  if(!q) return res.status(400).json({error:"Falta palabra q="});

  const palabra = q.toLowerCase();
  let resultado = null;

  const fetchJSON = async (url) => {
    try{ const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 IA-BF-Diccionario'}}); if(!r.ok) return null; return await r.json(); }catch{return null;}
  };
  const fetchText = async (url) => {
    try{ const r=await fetch(url); if(!r.ok) return null; return await r.text(); }catch{return null;}
  };

  // 1. RAE OFICIAL via rae-api.com
  if(lang==="es" || lang==="rae"){
    try{
      const rae = await fetchJSON(`https://rae-api.com/api/search?word=${encodeURIComponent(palabra)}`);
      if(rae && rae.ok){
        const defs = rae.data?.definitions || rae.definitions || [];
        if(defs.length){
          resultado = {
            fuente: "Real Academia Española - RAE",
            palabra,
            idioma: "español",
            definiciones: defs.slice(0,5),
            url: `https://dle.rae.es/${encodeURIComponent(palabra)}`
          };
        }
      }
    }catch{}
    // Fallback RAE scrape dle.rae.es
    if(!resultado){
      try{
        const html = await fetchText(`https://dle.rae.es/${encodeURIComponent(palabra)}`);
        if(html){
          const match = html.match(/<meta property="og:description" content="([^"]+)"/);
          if(match){
            resultado = {
              fuente: "RAE - DLE",
              palabra,
              idioma: "español",
              definicion: match[1].replace(/&quot;/g,'"'),
              url: `https://dle.rae.es/${encodeURIComponent(palabra)}`
            };
          }
        }
      }catch{}
    }
  }

  // 2. DiccionarioAPI.dev - 20 idiomas gratis (en, es, fr, de, it, pt, etc)
  if(!resultado){
    try{
      const dict = await fetchJSON(`https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(palabra)}`);
      if(dict && Array.isArray(dict) && dict[0]){
        const entry = dict[0];
        const meanings = entry.meanings?.map(m=>({
          tipo: m.partOfSpeech,
          definiciones: m.definitions?.slice(0,3).map(d=>d.definition),
          ejemplo: m.definitions?.[0]?.example,
          sinonimos: m.definitions?.[0]?.synonyms?.slice(0,5),
          antonimos: m.definitions?.[0]?.antonyms?.slice(0,5)
        })) || [];
        resultado = {
          fuente: `DictionaryAPI - ${lang}`,
          palabra: entry.word,
          fonetica: entry.phonetic || entry.phonetics?.[0]?.text,
          audio: entry.phonetics?.find(p=>p.audio)?.audio,
          idioma: lang,
          origen: entry.origin,
          significados: meanings,
          url: `https://www.dictionary.com/browse/${encodeURIComponent(palabra)}`
        };
      }
    }catch{}
  }

  // 3. Wiktionary fallback - todos los idiomas
  if(!resultado){
    try{
      const wiki = await fetchJSON(`https://${lang}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(palabra)}`);
      if(wiki && wiki[lang]){
        resultado = {
          fuente: `Wiktionary ${lang}`,
          palabra,
          idioma: lang,
          definiciones: wiki[lang].slice(0,3).map(d=>d.definitions?.[0]?.definition).flat().slice(0,5),
          url: `https://${lang}.wiktionary.org/wiki/${encodeURIComponent(palabra)}`
        };
      }
    }catch{}
  }

  // 4. Traductor MyMemory - traducción a cualquier idioma
  let traducciones = {};
  try{
    const langs = ["en|es","es|en","es|fr","es|de","es|it","es|pt","es|en"];
    const pair = lang==="es"? "es|en" : `${lang}|es`;
    const trans = await fetchJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(palabra)}&langpair=${pair}`);
    if(trans?.responseData?.translatedText){
      traducciones[pair] = trans.responseData.translatedText;
    }
    // Traducir a inglés, francés, alemán, italiano, portugués, náhuatl, etc
    const multi = await Promise.all([
      fetchJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(palabra)}&langpair=${lang}|en`),
      fetchJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(palabra)}&langpair=${lang}|fr`),
      fetchJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(palabra)}&langpair=${lang}|de`),
      fetchJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(palabra)}&langpair=${lang}|it`),
    ]);
    traducciones = {
      en: multi[0]?.responseData?.translatedText,
      fr: multi[1]?.responseData?.translatedText,
      de: multi[2]?.responseData?.translatedText,
      it: multi[3]?.responseData?.translatedText,
    };
  }catch{}

  if(!resultado){
    return res.status(200).json({
      palabra,
      idioma: lang,
      mensaje: `No encontré "${palabra}" en ${lang}, pero aquí traducción:`,
      traducciones,
      sugerencia: `Busca en RAE: https://dle.rae.es/${encodeURIComponent(palabra)} | En inglés: https://dictionary.cambridge.org/es/diccionario/ingles-espanol/${encodeURIComponent(palabra)}`
    });
  }

  return res.status(200).json({...resultado, traducciones, palabra_buscada: palabra});
}
