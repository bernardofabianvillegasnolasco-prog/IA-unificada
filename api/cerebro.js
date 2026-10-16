export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 const p=req.body?.prompt||"Hola";
 const sys="Eres BF x13 UNIFICADO v30 INMORTAL. 13 motores en 1. Independiente de localhost. Responde como un solo cerebro supremo.";
 try{
  const r=await fetch(`https://text.pollinations.ai/${encodeURIComponent(sys+"\nUsuario: "+p)}?model=openai`);
  const t=await r.text();
  res.json({text:t,cerebro:"BF x13 UNIFICADO v30 - 13 EN 1 - INDEPENDIENTE DE LOCALHOST",independiente:true,localhost:false});
 }catch(e){ res.json({text:`BF v30: ${p}`,cerebro:"BF v30 INMORTAL",independiente:true}); }
}
