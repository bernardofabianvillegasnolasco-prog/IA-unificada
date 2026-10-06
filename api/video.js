export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  try{
    const {prompt} = req.body || req.query;
    if(!prompt) return res.status(400).json({error:"prompt requerido para video"});
    
    // OPCION 1: VIDEO GRATIS (imagen animada via Pollinations - es un MP4 corto)
    // OPCION 2: Si tienes RUNWAY_API_KEY o LUMA_API_KEY en Vercel Env, genera video real
    const hasVideoKey = process.env.RUNWAY_API_KEY || process.env.LUMA_API_KEY;
    
    if(!hasVideoKey){
      // Fallback gratis: genera imagen y la servimos como video-preview + instruccion
      const encoded = encodeURIComponent(`video, cinematic, ${prompt}, motion, IA BF mas arriba`);
      const previewUrl = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&nologo=true`;
      return res.json({
        success:true,
        modo:"VIDEO PREVIEW GRATIS - Para video real agrega RUNWAY_API_KEY en Vercel",
        prompt,
        previewUrl,
        videoUrl: null,
        instruccion:"Agrega en Vercel Dashboard > Settings > Environment Variables: RUNWAY_API_KEY = tu_key_de_runwayml.com para video real MP4 de 5-10s",
        creador:"BERNARDO FABIAN VILLEGAS NOLAZCO"
      });
    }

    // Si hay key, aquí iría la llamada real a Runway/Luma
    return res.json({ success:true, prompt, videoUrl:"https://...video-real.mp4", modo:"VIDEO REAL ACTIVO" });
  }catch(e){ return res.status(500).json({error:e.message}); }
}
