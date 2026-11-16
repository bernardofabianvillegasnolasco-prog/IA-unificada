export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  const body = req.method==='POST' ? (typeof req.body==='string' ? JSON.parse(req.body||'{}') : (req.body||{})) : (req.query||{});
  const prompt = body.prompt || body.texto || body.descripcion || '';
  if(!prompt) return res.status(400).json({error:'falta prompt'});
  const limpio = String(prompt).slice(0,500);
  const seed = Math.floor(Math.random()*1000000);
  const width = body.width || 1024;
  const height = body.height || 1024;
  const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(limpio) + '?width=' + width + '&height=' + height + '&seed=' + seed + '&model=flux&nologo=true&private=true&enhance=false';
  return res.status(200).json({ok:true, prompt: limpio, url, seed, texto: 'Listo, ya te genere la imagen..'});
}
