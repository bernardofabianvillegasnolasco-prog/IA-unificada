let cache = global._bf_cache || {};
let fallos = global._bf_fallos || [];
global._bf_cache = cache;
global._bf_fallos = fallos;

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const ahora = new Date().toISOString();
  let acciones = [];
  const fetchJSON = async (url) => {
    try{
      const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 IA-BF'}});
      if(!r.ok) return null;
      return await r.json();
    }catch{return null;}
  };

  if(fallos.length>0){
    acciones.push(`Detectados ${fallos.length} fallos`);
    for(let f of fallos.slice(-2)){
      try{
        const wiki = await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(f.q)}&format=json&origin=*`);
        if(wiki?.query?.search?.[0]){
          const title=wiki.query.search[0].title;
          const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
          if(sum?.extract){
            cache[f.q.toLowerCase()] = `✅ [Auto-corregido BOOT ${ahora}]\n${sum.title}: ${sum.extract}\n🔗 ${sum.content_urls?.desktop?.page}`;
            acciones.push(`Auto-corregido: ${f.q} -> ${title}`);
          }
        }
      }catch{}
    }
    fallos=[];
    global._bf_fallos=fallos;
  }

  try{
    const temas=["diabetes tipo 2","hipertension arterial","ley federal trabajo vacaciones","concreto f'c 250","raiz cuadrada"];
    const tema=temas[Math.floor(Math.random()*temas.length)];
    const wiki=await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(tema)}&format=json&origin=*`);
    if(wiki?.query?.search?.[0]){
      const title=wiki.query.search[0].title;
      const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract){
        cache[tema]=`🧬 [Evolucion BOOT ${ahora}]\n${sum.title}: ${sum.extract.slice(0,400)}`;
        acciones.push(`Evolucion: ${tema} -> ${title}`);
      }
    }
  }catch{}

  const totalCache=Object.keys(cache).length;
  return res.status(200).json({
    boot:"IA BF BOOT v33.1 FIX",
    estado:"Activo",
    acciones,
    memoria: totalCache,
    timestamp: ahora
  });
}
