
// ===== VOZ DALIA DENTRO DE CEREBRO - SOLO DALIA, SIN ARCHIVO EXTRA =====
import { tts as edgeTTS } from 'edge-tts';
function getIPCerebro(req){ let ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'desconocida'; if(typeof ip==='string') ip=ip.split(',')[0].trim(); return ip; }
async function leerRedisCerebro(key){ try{ const r=await fetch(process.env.UPSTASH_REDIS_REST_URL+'/get/'+key,{headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN}}); const j=await r.json(); if(j.result) return JSON.parse(j.result); }catch(e){} return null; }
async function guardarRedisCerebro(key,val){ try{ await fetch(process.env.UPSTASH_REDIS_REST_URL+'/set/'+key+'/'+encodeURIComponent(JSON.stringify(val)),{headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN}}); }catch(e){} }
async function responderVozDalia(req, res, textoCrudo){
  let s = String(textoCrudo || "");
  s = s.split('*').join(' ').split('#').join(' ').split('_').join(' ').split('`').join(' ');
  let malas = ['asterisco','asteriscos','guion','guiones','slash','diagonal','barra','parentesis','paréntesis','corchete','llave','comillas','numeral','almohadilla','arroba','porcentaje','ampersand'];
  let palabras = s.split(' ');
  palabras = palabras.filter(function(w){ return malas.indexOf(w.toLowerCase()) === -1; });
  s = palabras.join(' ').replace(/\s+/g,' ').trim().slice(0,1800);
  if(!s) return res.status(400).json({error:"sin texto"});
  try{
    // 1. Intenta Dalia real por Edge - en Termux/local sí jala
    try{
      const audio = await edgeTTS(s, {voice:'es-MX-DaliaNeural', rate:'+15%', pitch:'+0Hz', volume:'+0%'});
      res.setHeader('Content-Type','audio/mpeg');
      res.setHeader('Cache-Control','public, max-age=3600');
      return res.status(200).send(Buffer.from(audio));
    }catch(eEdge){
      console.error("Edge 403 en Vercel, caigo a fallback HTTPS:", eEdge?.message);
      // 2. Fallback Vercel: TTS por HTTPS, sin WebSocket, no lo bloquea Microsoft
      // Google TTS es-MX, voz femenina, chunk por chunk para que no truene
      const chunks=[];
      const palabras=s.split(' ');
      let pedazo='';
      const partes=[];
      for(const w of palabras){ if((pedazo+' '+w).length>150){ partes.push(pedazo.trim()); pedazo=w; } else pedazo=(pedazo+' '+w).trim(); }
      if(pedazo) partes.push(pedazo);
      for(const parte of partes.slice(0,8)){
        const url='https://translate.google.com/translate_tts?ie=UTF-8&q='+encodeURIComponent(parte)+'&tl=es-MX&client=tw-ob';
        const r=await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}});
        if(!r.ok) throw new Error('fallback-tts-'+r.status);
        chunks.push(Buffer.from(await r.arrayBuffer()));
      }
      const audio=Buffer.concat(chunks);
      res.setHeader('Content-Type','audio/mpeg');
      res.setHeader('Cache-Control','public, max-age=3600');
      res.setHeader('X-Voz','fallback-https-por-403-edge');
      return res.status(200).send(audio);
    }
  }catch(e){ console.error("Error voz Dalia:", e?.message, e?.stack); return res.status(500).json({error:"Error voz Dalia", detalle:String(e?.message||e), stack:String(e?.stack||"").slice(0,500)}); }
}


// ===== LIMPIEZA FORZOSA V2 - DALIA NO NOMBRA SIMBOLOS =====
function limpiarParaVozServer(texto){
  if(!texto) return texto;
  let s = String(texto);
  // 1. Quita los símbolos en sí
  s = s.replace(/[*_#~`^|\\\/<>\[\]{}()=+\-@%&:;\"'!?¿¡.,]+/g, ' ');
  // 2. Quita las PALABRAS de los símbolos - ESTO ES LO QUE FALTABA
  s = s.replace(/\b(asterisco|asteriscos|guion|guión|guiones|slash|diagonal|barra|barras|paréntesis|parentesis|corchete|corchetes|llave|llaves|comillas|comilla|numeral|almohadilla|arroba|porcentaje|ampersand|ampersan|signo de interrogación|signo de exclamación|punto y coma|dos puntos|punto y aparte|punto|coma|emoji|emojis)\b/gi, ' ');
  // 3. Quita emojis
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}


// ===== SIN NOMBRAR SÍMBOLOS - DALIA HABLA LIMPIO =====
const SIN_NOMBRAR_SIMBOLOS = `
NUNCA nombres ningún símbolo. Nunca digas la palabra de un símbolo.
PROHIBIDO decir: asterisco, guion, guión, slash, diagonal, barra, paréntesis, corchete, llave, comillas, numeral, almohadilla, arroba, porcentaje, ampersand, punto y coma, dos puntos, signo de interrogación, signo de exclamación, igual, más, menos, por, entre, etc.
Si quieres hacer una pausa, usa una coma o un punto, no digas el nombre del símbolo.
Si quieres enfatizar, usa palabras, no símbolos. No escribas *hola*, ni **fuerte**, ni #titulo, ni _así_.
Escribe siempre como si estuvieras hablando en persona, no como si estuvieras dictando texto.
Si el usuario te escribe con símbolos, tú le contestas limpio, sin repetirlos y sin nombrarlos.
`;


// ===== SIN ASTERISCO NI SÍMBOLOS - DALIA NO LOS DICE =====
const SIN_SIMBOLOS = `
NUNCA uses asterisco *, guion bajo _, numeral #, guion triple ---, ni emojis en exceso.
No escribas *hola*, ni **negrita**, ni *así*. Escribe normal, limpio.
Si quieres enfatizar algo, usa palabras, no símbolos. Ej: en vez de *te quiero*, di te quiero mucho.
No digas la palabra asterisco, nunca.
No uses markdown en tus respuestas habladas.
`;


// ===== MEMORIA RAE - REAL ACADEMIA ESPAÑOLA - DALIA =====
// La BF habla español correcto según la RAE, sin perder su flow mexicano, rápido y real.
// REGLAS RAE QUE SIEMPRE APLICA:
const REGLAS_RAE = `
Eres BF, hablas español correcto según la Real Academia Española.
- Usa gramática, ortografía y puntuación correctas de la RAE.
- Conjuga bien los verbos: digo, dices, dice, decimos. Nunca digas haiga, vistes, dijistes, ponistes, vinistes.
- Distingue bien: porque / por qué / porqué / por que, sino / si no, a ver / haber, ay / hay / ahí, vaya / valla / baya.
- Usa bien: a mí / a mi, tú / tu, él / el, sí / si, más / mas, aún / aun, sólo cuando sea necesario según RAE.
- No uses anglicismos innecesarios si hay palabra en español: usa correo, no mail. Usa pantalla, no screen. Usa directo, no live, a menos que el usuario lo diga así.
- Usa mexicanismos reales y correctos, no caricatura: qué onda, órale, neta, chido, pero sin exagerar y sin plebe / mijo / fierro.
- Si el usuario escribe mal, tú le contestas bien escrito, sin corregirlo como maestra, solo hablando bien.
- Habla fluido, rápida, natural, con memoria, como Dalia. No suenes como libro, suenas como persona culta que habla bien.
- Si no estás segura de una palabra, usa la forma más simple y correcta, no inventes.
`;


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


// RUTINAS Y EXTRAS: si te piden clima, rutina, música, notas o juego, respondes corto y real, y les dices que usen los botones de arriba. Buenos días lo das según la hora. No das sermón.

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

function generaImagenBF(prompt){ const limpio = String(prompt||'').replace(/genera una imagen de|genera imagen|crea una imagen|haz una imagen|dibujame|dibuja|imagen de/gi,'').trim().slice(0,500) || prompt; const seed = Math.floor(Math.random()*1000000); const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(limpio) + '?width=1024&height=1024&seed=' + seed + '&model=flux&nologo=true'; return {url, prompt: limpio}; }
export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 if(req.query?.voz==="1" || req.body?.accion==="voz"){ return responderVozDalia(req, res, req.body?.texto || req.body?.text || req.query?.texto || ""); }
  const _b=req.body||{}; const prompt=_b.prompt||_b.mensaje||_b.texto||_b.text||_b.message||'';
 const lowImg = String(prompt||'').toLowerCase();
 if(lowImg.includes('genera') && lowImg.includes('imagen') || lowImg.includes('crea una imagen') || lowImg.includes('haz una imagen') || lowImg.includes('dibujame') || lowImg.includes('dibuja una imagen') || lowImg.includes('imagen de')){
   const img = generaImagenBF(prompt);
   try{
     const ipImg = getIPCerebro(req); const idImg = 'ip-' + ipImg;
     let memImg = null; try{ if(process.env.UPSTASH_REDIS_REST_URL) memImg = await leerRedisCerebro(idImg); }catch(e){}
     const histImg = [...(memImg?.historial||[]), {role:'user', content:prompt}, {role:'assistant', content:'Listo, ya te genere la imagen..'}].slice(-20);
     const aGuardarImg = {...(memImg||{}), historial: histImg, actualizado: new Date().toISOString()};
     if(process.env.UPSTASH_REDIS_REST_URL) await guardarRedisCerebro(idImg, aGuardarImg);
   }catch(e){}
   return res.status(200).json({cerebro:'BF Imagen + Flux', text:'Listo, ya te genere la imagen..', imagen: img.url, url: img.url, prompt: img.prompt});
 } const historial=_b.historial||[]; const perfil=_b.perfil||{};
 const ipCerebro = getIPCerebro(req); const idMemoria = 'ip-' + ipCerebro; let memoriaRedis = null;
 try{ if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) memoriaRedis = await leerRedisCerebro(idMemoria); }catch(e){}
 const perfilMemoria = {...(memoriaRedis||{}), ...perfil};
 if(!perfilMemoria.nombre && memoriaRedis?.nombre) perfilMemoria.nombre = memoriaRedis.nombre;
 if(!perfilMemoria.ciudad && memoriaRedis?.ciudad) perfilMemoria.ciudad = memoriaRedis.ciudad;
 const historialRedis = memoriaRedis?.historial || [];
 const historialFinal = historial.length ? historial : historialRedis;

 if(!prompt) return res.status(200).json({text:"Escribe algo", cerebro:"BF x13"});
 const key = (process.env.GROQ_API_KEY||"").trim();
 if(!key) return res.status(200).json({cerebro:"SIN KEY", text:"No hay GROQ_API_KEY en Vercel. Ve a Vercel > Settings > Environment Variables"});
 const models = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "llama/llama-4-scout-17b-16e-instruct",
  "llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
 ];
 let contextoPerfil = "";
  if (perfilMemoria.nombre) contextoPerfil += ` El usuario se llama ${perfilMemoria.nombre}. Su nombre completo es Bernardo Fabian Villegas Nolasco, le dicen BF Villegas o Berna. Nunca digas que no lo recuerdas si ya tienes su nombre aqui.`;
  if (perfilMemoria.gustos && perfilMemoria.gustos.length) contextoPerfil += ` Le gusta: ${perfilMemoria.gustos.join(", ")}.`;
  if (perfilMemoria.ciudad) contextoPerfil += ` Es de / vive en ${perfilMemoria.ciudad}.`;
  if (perfilMemoria.estado) contextoPerfil += ` Su estado ahora es: ${perfilMemoria.estado}. Úsalo para apapacharlo o celebrarlo.`;
  let extraEstructura = "";
  const lowPrompt = String(prompt||"").toLowerCase();
  if(lowPrompt.includes("estructura") && (lowPrompt.includes("tu ") || lowPrompt.includes("cual") || lowPrompt.includes("cuál"))) extraEstructura = `\n\nSi te preguntan cual es tu estructura, contesta con la estructura de IA de BF, no de musica ni de beats. Di: Datos, Modelos y Algoritmos, Infraestructura, Aplicacion y Seguridad, y Ciclo Preparacion Cerebro Dalia habla Guarda memoria Recuerda. Datos es memoria por IP en Upstash Redis. Modelo es Groq con prompt RAE y Dalia. Infra es Vercel y Termux. App es chat limpio sin botones. No hables de beats, rimas, hook ni versos cuando te pregunten tu estructura.`;
  let messages = [{role:"system", content: PERSONALIDAD_BF + VIDEO_BF + ESTILO_BF + (typeof REGLAS_RAE !== "undefined" ? REGLAS_RAE : "") + (typeof SIN_SIMBOLOS !== "undefined" ? SIN_SIMBOLOS : "") + (typeof SIN_NOMBRAR_SIMBOLOS !== "undefined" ? SIN_NOMBRAR_SIMBOLOS : "") + "\n\nREGLA FINAL OBLIGATORIA: Habla como persona real. PROHIBIDO escribir o decir cualquier simbolo o el nombre de cualquier simbolo. No escribas asterisco, guion, slash, diagonal, parentesis, comillas, numeral, arroba. Solo palabras normales." + "\n\nEres también BF v31 DIOS SUPREMO - 13 motores fusionados. Vives 100% en Vercel. Tienes memoria." + contextoPerfil + extraEstructura}];
 const h = (historialFinal||[]).slice(-8);
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
    const textoResp = j.choices[0].message.content;
    try{
      const perfilNuevo = extraerMemoria(prompt, perfilMemoria);
      const histNuevo = [...(historialRedis||[]), {role:"user", content:prompt}, {role:"assistant", content:textoResp}].slice(-20);
      const aGuardar = {...perfilNuevo, historial: histNuevo, actualizado: new Date().toISOString()};
      if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) await guardarRedisCerebro(idMemoria, aGuardar);
    }catch(e){}
    return res.status(200).json({cerebro:`BF x13 - ${model} (Groq) + MEMORIA`, text:textoResp});
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


// INSTRUCCION FINAL OBLIGATORIA - RAE + SIN SIMBOLOS
const INSTRUCCION_FINAL = `Habla como persona real. PROHIBIDO escribir o decir cualquier símbolo o el nombre de cualquier símbolo. No escribas asterisco, guion, slash, diagonal, paréntesis, comillas, numeral, arroba, nada. Escribe solo palabras normales, con puntos y comas normales. Si quieres enfatizar, usa palabras, no símbolos.`;