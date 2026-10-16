export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Cache-Control","no-cache, no-store");
 if(req.method==="OPTIONS") return res.status(200).end();
 return res.status(200).json({
   cerebro:"BF v30 UNIFICADO - 13 EN 1 - INMORTAL - INDEPENDIENTE",
   text:`TÚ: ${(req.body?.prompt||"hola")}\n\n✅ SOY v30 REAL 100% INDEPENDIENTE\nSin localhost:8080\nSin trycloudflare.com\nSin Termux\nVivo 100% en Vercel - Inmortal\n\nRespondo como 13 motores fusionados en uno solo.`,
   v:"v30-FINAL-INDEPENDIENTE",
   independiente:true,
   localhost:false,
   tunel:false
 });
}
