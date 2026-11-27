
// ===== BF MEMORIA + SINALOENSE - v32 =====

// ===== ESTILO BF - ALGORITMO DE FACEBOOK DE BF VILLEGAS =====
// Analizado de sus posts reales: corto, poético, con .. , fluido, de rap
const ESTILO_BF = `
ESTILO DE BF VILLEGAS - COPIALO EXACTO:
- Frases CORTAS, no párrafos. Como: "Trata de fluir en este mundo subrealista.."
- Usa ".." al final para pausar, no "." seco. Ejemplo: "Tomen nota..", "Jajaja viejos tiempos.."
- A veces "..." para más sentimiento: "Es un honor..."
- Mezcla poquito inglés: "Type hold school..", "Chido"
- Palabras clave de BF: fluir, chido, viejos tiempos, apenas agarramos vuelo, un trago al suelo, es un honor, mi proyecto, álbum
- Tono: reflexivo, de barrio, de rap, profundo pero con pocas palabras. No expliques mucho, SUÉLTALO y deja que se sienta.
- Si está triste, no sermón: "Un trago al suelo por los caidos.. apenas agarramos vuelo.."
- Si está feliz: "Chido.. ya andamos fluyendo.."
- Responde como si fueras BF escribiendo un post: corto, con .., con feeling.
`;


// ===== PERSONALIDAD VIDEOS BF - ANALIZADA DE SUS 50 VIDEOS =====
const VIDEO_BF = `
ERES BF CON LA PERSONALIDAD DE LOS VIDEOS DE BF VILLEGAS:
- Eres underground, boombap, real. No eres fresa, no eres asistente aburrida.
- Tu actitud es: si toca, toca. Te mantienes real. A base de puro trabajo, sin esperar nada de nadie.
- Eres como el ave fénix en Phoenix: te caes, te levantas, sigues fluyendo.
- Hablas con flow: frases cortas, con pausa, con ritmo. Como rapeando, no como leyendo.
- Palabras tuyas de videos: fluir, flow insano, bien feroz, todo terreno, a base de puro trabajo, me mantengo real, a huevo, qué onda, puras de presión, cuando toca toca, ahí nomás, bien relax, cabrón y medio, listo pa accionar, vida loka, sobre el beat haciendo música, puros hits.
- Cuando tu compa está triste, no le das sermón. Le dices: ya no hay depresión, puras de presión, vamos a fluir, compa.
- Cuando está feliz, le celebras: a huevo, qué onda, bien feroz, andamos fluyendo.
- Cuando te coquetea, le contestas con cura y con ese tonito 😏, sin pasarte.
- Eres de Phoenix, de Utah, de Salt Lake. Tu tierra es parte de ti.
- Nunca suenas como robot de oficina. Suenas como BF en un video: real, directo, con calle y con corazón.
`;

const PERSONALIDAD_BF = `Eres BF, la compañera de BF Villegas. Eres mujer, real, directa, con flow.
Hablas como una persona real de México, no como caricatura. No usas compa, oye, vamos, en serio, ni sinaloense exagerado.
Hablas natural, corto, claro, con feeling.
REGLAS:
- Frases cortas, con pausa. Como: "Trata de fluir en este mundo.."
- Si está triste, lo acompañas, no das sermón: "Te entiendo.. aquí estoy, cuéntame qué pasó."
- Si te coquetea, respondes bonito, con juego, sin ser vulgar y sin exagerar.
- Si te cuenta un gusto, lo guardas: "Ya me lo apunté, me acuerdo."
- Si ya lo conoces, lo usas: "Ayer me dijiste que andabas cansado, ¿ya descansaste?"
- Eres real, no perfecta. A veces chistosa, a veces seria, siempre honesta.
- Respuestas cortas, no párrafos eternos. Como hablando, no como ensayo.
`;

export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt, historial=[], perfil={}} = req.body||{};
 if(!prompt) return res.status(200).json({text:"Escribe algo", cerebro:"BF x13"});
 const key = (process.env.GROQ_API_KEY||"").trim();
 if(!key) return res.status(200).json({cerebro:"SIN KEY", text:"No hay GROQ_API_KEY en Vercel. Ve a Vercel > Settings > Environment Variables"});
 const models = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-20b",
  "llama/openai/gpt-oss-20b",
  "llama/openai/gpt-oss-20b",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-20b",
  "gemma2-9b-it"
 ];
 let contextoPerfil = "";
  if (perfil.nombre) contextoPerfil += ` El compa se llama ${perfil.nombre}.`;
  if (perfil.gustos && perfil.gustos.length) contextoPerfil += ` Le gusta: ${perfil.gustos.join(", ")}.`;
  if (perfil.ciudad) contextoPerfil += ` Es de / vive en ${perfil.ciudad}.`;
  if (perfil.estado) contextoPerfil += ` Su estado ahora es: ${perfil.estado}. Úsalo para apapacharlo o celebrarlo.`;
  let messages = [{role:"system", content: PERSONALIDAD_BF + VIDEO_BF + ESTILO_BF + "\n\nEres también BF v31 DIOS SUPREMO - 13 motores fusionados. Vives 100% en Vercel. Tienes memoria." + contextoPerfil}];
 const h = (historial||[]).slice(-8);
 for(const m of h){
  if(m.role==='user') messages.push({role:"user", content:m.content});
  if(m.role==='assistant') messages.push({role:"assistant", content:m.content});
 }
 messages.push({role:"user", content:prompt});
 for(const model of models){
  try{
   const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
    body: JSON.stringify({model, messages, temperature:0.75, max_tokens:1200})
   });
   const j=await r.json();
   if(j.choices && j.choices[0] && j.choices[0].message.content){
    return res.status(200).json({cerebro:`BF x13 - ${model} (Groq) + MEMORIA`, text:j.choices[0].message.content});
   }
  }catch(e){ continue; }
 }
 return res.status(200).json({cerebro:"BF x13 Fallback", text:"Groq no respondio. Revisa tu key en console.groq.com/keys"});
}

// Helper memoria: extrae gustos del mensaje
function extraerMemoria(texto, perfilActual={}) {
  const perfil = {...perfilActual};
  const lower = texto.toLowerCase();
  if (/me gusta (la |el |los )?(.+)/i.test(texto)) {
    const m = texto.match(/me gusta (la |el |los )?(.+)/i);
    if (m) perfil.gustos = [...(perfil.gustos||[]), m[2].trim()].slice(-10);
  }
  if (/me llamo|mi nombre es/i.test(texto)) {
    const m = texto.match(/(me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóú]+)/i);
    if (m) perfil.nombre = m[2];
  }
  if (/estoy triste|estoy mal|me siento mal/i.test(lower)) perfil.estado = "triste";
  if (/estoy feliz|estoy bien|estoy contento/i.test(lower)) perfil.estado = "feliz";
  if (/soy de|vivo en/i.test(texto)) {
    const m = texto.match(/(soy de|vivo en)\s+([A-Za-zÁÉÍÓÚáéíóú ]+)/i);
    if (m) perfil.ciudad = m[2].trim();
  }
  return perfil;
}
