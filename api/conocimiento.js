export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  if(req.method==="OPTIONS") return res.status(200).end();
  let q = (req.query.q || req.body?.q || "").trim().toLowerCase();
  if(!q) return res.status(400).json({error:"Falta q"});

  // LIMPIAR PREGUNTAS META - Esto es lo que faltaba
  const qOrig = q;
  q = q.replace(/que sabes de /g,'').replace(/que sabes sobre /g,'').replace(/que sabes /g,'').replace(/qué sabes de /g,'').replace(/todo el conocimiento humano sobre /g,'').replace(/"/g,'').replace(/\?/g,'').trim();
  if(!q) q = qOrig.replace(/que sabes de /g,'').replace(/\?/g,'').trim() || "medicina";
  if(q.length<3) q = "medicina";

  const fetchJSON = async (url) => {
    try{ const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}}); if(!r.ok) return null; return await r.json(); }catch{return null;}
  };

  // Si pregunta es sobre medicina, usar base curada primero, no arXiv basura
  if(q.includes("medici")){
    try{
      const base=`https://${req.headers.host}`;
      const db=await fetchJSON(`${base}/api/materias`);
      if(db?.medicina_general){
        return res.status(200).json({
          query: qOrig,
          conocimiento_humano: [{
            fuente: "IA BF - Medicina General Curada",
            titulo: "Medicina General - Todo lo que manejo",
            texto: db.medicina_general.primeros_auxilios.join("\n\n") + "\n\n" + db.medicina_general.medicamentos_comunes.join("\n"),
            url: "https://ia-unificada-bf.vercel.app/api/materias",
            peso: 100
          }],
          resumen: `🩺 MEDICINA GENERAL - TODO LO QUE MANEJO:\n\nBases: anatomía, fisiología, bioquímica, cómo funciona el cuerpo.\n\nEnfermedades: qué son, por qué pasan, cómo se presentan.\n\nMedicamentos: para qué sirve, dosis estándar, interacciones, efectos secundarios.\n\nEstudios: hemograma, tiroideo, glucosa, colesterol, orina - interpretación general.\n\nTratamientos: guías actuales, cambios estilo vida hasta procedimientos.\n\nPrevención y primeros auxilios: vacunas, factores riesgo, qué hacer en emergencia.\n\n${db.medicina_general.primeros_auxilios.slice(0,2).join("\n\n")}`,
          total_fuentes: 1
        });
      }
    }catch{}
  }

  let resultados = [];
  // Wikipedia ES prioritario
  try{
    const es=await fetchJSON(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`);
    if(es?.query?.search?.[0]){
      const title=es.query.search[0].title;
      const sum=await fetchJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if(sum?.extract) resultados.push({fuente:"Wikipedia ES", titulo: sum.title, texto: sum.extract, url: sum.content_urls?.desktop?.page, peso: 100});
    }
  }catch{}

  return res.status(200).json({
    query: qOrig,
    query_limpia: q,
    conocimiento_humano: resultados,
    resumen: resultados[0]? `${resultados[0].titulo}: ${resultados[0].texto}` : `Base curada medicina general disponible`,
    total_fuentes: resultados.length
  });
}
