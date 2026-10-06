export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  try{
    const {textoExtraido} = req.body || {};
    if(!textoExtraido) return res.json({ error:"Envía textoExtraido del OCR" });
    // Reutiliza tu cerebro para resolver lo que ve en la foto
    const prompt = textoExtraido;
    const r = await fetch(`${process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'https://ia-unificada-bf.vercel.app'}/api/debate`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt})
    });
    const data = await r.json().catch(()=>({x2:[{respuesta:`Veo: ${textoExtraido} -> Calculando...`}]}));
    return res.json({ vision:"BF VISION", textoVisto: textoExtraido, respuesta: data });
  }catch(e){ return res.status(500).json({error:e.message}); }
}
