export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  // En Vercel gratis usamos memoria en cliente + KV si existe
  // Por ahora responde OK, el guardado real está en localStorage del frontend
  return res.json({ status:"memoria BF activa", modo:"localStorage + Vercel KV si configuras", masArriba:true });
}
