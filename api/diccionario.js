export async function consultaRAE(palabra){
  const w = String(palabra||'').toLowerCase().trim().replace(/[^a-záéíóúñü\s-]/gi,'').split(/\s+/)[0];
  if(!w) return null;
  try{
    const r = await fetch('https://dle.rae.es/' + encodeURIComponent(w), {headers:{'User-Agent':'Mozilla/5.0'}});
    const html = await r.text();
    // Sacamos las definiciones del DLE
    const defs = [...html.matchAll(/<span class="def"[^>]*>(.*?)<\/span>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').trim()).filter(Boolean).slice(0,3);
    const etimo = (html.match(/<p class="etim"[^>]*>(.*?)<\/p>/)||[])[1]?.replace(/<[^>]+>/g,'').trim() || '';
    if(!defs.length) return null;
    return {palabra:w, definiciones:defs, etimologia:etimo, fuente:'Diccionario de la lengua española - RAE', url:'https://dle.rae.es/'+encodeURIComponent(w)};
  }catch(e){ return null; }
}
export function extraePalabraDiccionario(prompt){
  const low = String(prompt||'').toLowerCase();
  const m = low.match(/(?:qué significa|que significa|significado de|definición de|definicion de|define|diccionario|rae)\s+([a-záéíóúñü]+)/i);
  if(m) return m[1];
  if(low.startsWith('rae ')) return low.replace('rae ','').split(' ')[0];
  return null;
}
