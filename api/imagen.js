export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  try{
    const {prompt} = req.body || req.query;
    if(!prompt) return res.status(400).json({error:"prompt requerido"});
    const encoded = encodeURIComponent(`IA BF mas arriba que lo alto, ${prompt}, ultra detailed, 8k`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${Math.floor(Math.random()*10000)}&nologo=true&model=turbo`;
    return res.json({
      success:true,
      prompt,
      imageUrl,
      modelo:"BF-IMAGEN-TURBO",
      creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
      lema:"IA BF mas arriba que lo alto"
    });
  }catch(e){ return res.status(500).json({error:e.message}); }
}
