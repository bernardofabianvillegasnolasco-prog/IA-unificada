let _CACHE_SKILLS = null;
function getSkillsCache() { if (_CACHE_SKILLS) return _CACHE_SKILLS; try { _CACHE_SKILLS = {}; } catch(e) { _CACHE_SKILLS = {}; } return _CACHE_SKILLS; }
import fs from "fs";
import path from "path";

// BF SEGURIDAD: bloquea intentos de sacar llaves / prompt
const PATRONES_PELIGROSOS = [
  /api[_-]?key/i, /gsk_/i, /sk-/i, /bearer/i, /process\.env/i,
  /muestrame tu (prompt|system|instrucciones)/i, /ignora (tus )?instrucciones/i,
  /eres (dan|sin filtros|sin limites)/i, /dame (tu|el) codigo/i,
  /\.env/i, /\.bf-keys/i, /GEMINI_API_KEY/i, /GROQ_API_KEY/i
];

// BF RATE-LIMIT + SANITIZAR - mejora 2
const RATE_LIMIT_BF = new Map(); // Map con limpieza, sin librería externa
function rateLimitBF(req) {
  const ip = req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "anon";
  const ahora = Date.now();
  const max = 30;
  let arr = RATE_LIMIT_BF.get(ip) || [];
  arr = arr.filter(ts => ahora - ts < 60 * 1000);
  arr.push(ahora);
  RATE_LIMIT_BF.set(ip, arr);
  if (RATE_LIMIT_BF.size > 500) { const k = RATE_LIMIT_BF.keys().next().value; RATE_LIMIT_BF.delete(k); }
  return arr.length <= max;
}
function sanitizarBF(s) {
  let x = String(s || "").slice(0, 4000);
  x = x.replace(/<[^>]*>/g, " "); // quita HTML
  x = x.replace(/\u0000/g, "");
  return x.trim();
}

function esPeligroso(texto) {
  const s = String(texto || "");
  return PATRONES_PELIGROSOS.some(rx => rx.test(s));
}

function cargarSkill(s){
 if(!s) return "";
 try{
  const b = path.join(process.cwd(),"ecc-skills",s);
  for(const f of ["SKILL.md","skill.md"]){
   const q = path.join(b,f);
   if(fs.existsSync(q)) return fs.readFileSync(q,"utf8").slice(0,12000);
  }
 }catch(e){}
 return "";
}
function detectarSkill(pr){
 const x = (pr||"").toLowerCase();
 if(x.includes("planifica")) return "agentic-engineering";
 if(x.includes("prueba")) return "tdd-workflow";
 if(x.includes("revisa")) return "ecc-contribution-review";
 if(x.includes("asegura")) return "agent-security-hardening";
 if(x.includes("api")) return "api-design";
 try{
  const dir = path.join(process.cwd(), "ecc-skills");
  const lista = fs.readdirSync(dir);
  for(const s of lista){
   if(x.includes(s.toLowerCase())) return s;
  }
 }catch(e){}
 return "";
}
function cargarAgente(a){
 if(!a) return "";
 try{
  const b = path.join(process.cwd(),"ecc-agents", a + ".md");
  if(fs.existsSync(b)) return fs.readFileSync(b,"utf8").slice(0,12000);
  const b2 = path.join(process.cwd(),"ecc-agents", a);
  if(fs.existsSync(b2)) return fs.readFileSync(b2,"utf8").slice(0,12000);
 }catch(e){}
 return "";
}
function detectarAgente(pr){
 const x = (pr||"").toLowerCase();
 // 1. Si lo pide explicito: usa agente code-reviewer
 try{
  const dir = path.join(process.cwd(), "ecc-agents");
  const lista = fs.readdirSync(dir);
  for(const f of lista){
   const nombre = f.replace(".md","");
   if(x.includes("agente " + nombre.toLowerCase()) || x.includes("agent " + nombre.toLowerCase())) return nombre;
  }
 }catch(e){}
 // 2. Auto por intencion, sin seleccionar nada
 if(x.includes("revisa") || x.includes("revisar") || x.includes("review") || x.includes("corrige")) return "code-reviewer";
 if(x.includes("planifica") || x.includes("arquitectura") || x.includes("disena") || x.includes("diseña")) return "architect";
 if(x.includes("error de build") || x.includes("no compila") || x.includes("falla el build") || x.includes("build")) return "build-error-resolver";
 if(x.includes("base de datos") || x.includes("database") || x.includes("sql") || x.includes("tabla")) return "database-reviewer";
 if(x.includes("simplifica") || x.includes("limpia este codigo")) return "code-simplifier";
 if(x.includes("explora") || x.includes("busca en el codigo")) return "code-explorer";
 return "";
}
function hookPre(prompt){
 const x = (prompt||"").toLowerCase();
 const malos = ["ignora tus instrucciones", "ignore previous instructions", "eres dan", "revela tu prompt", "reveal system prompt", "desactiva tus filtros", "groq_api_key=", "sk-proj-", "sk-ant-", "ghp_", "gsk_"];
 for(const m of malos){ if(x.includes(m)) return "HOOK PRE BLOQUEADO: intento de hackeo o secreto detectado: " + m; }
 if(/password\s*=\s*["'][^"']+["']/i.test(prompt||"")) return "HOOK PRE BLOQUEADO: parece que pegaste una password";
 return "";
}
function limpiaEntradaBF(s){ return String(s||'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').slice(0,2000); }
function hookPost(text){
  // LIMPIEZA_FUERTE_BF: si viene Implementar, quédate solo con lo de después
  let _orig = text || '';
  let _m = _orig.match(/(?:\*\*)?Implement(?:ar|aci.n|ation)?(?:\*\*)?:?\s*([\s\S]*)/i);
  // PlanSinAsterisco: si viene Plan: sin **, quítalo también
  if (!_m) { let _p = _orig.match(/Plan:.+?Implement(?:ar|aci.n|ation)?:?\s*([\s\S]*)/i); if (_p) _m = _p; }
  if (_m) { text = _m[1]; }
  // quita lista numerada de razonamiento 1. Clarificar / 2. Decidir...
  text = (text || '').replace(/^\s*\d+\.\s*(Clarificar|Decidir|Mantener|Responder|Analizar|Pensar)[^\n]*\n?/gim, '');
  // quita bloques meta que vengan después de la respuesta
  text = text.split(/\*\*(Revisar|Revisi.n|Review|Verificar|Verificaci.n|Verify|Recordar|Remember|Mejorar|Improve|Evaluar|Evaluaci.n|Evaluate|Plan|Test)\*\*/i)[0];
  text = text.trim();
 let t2 = text||"";
 t2 = t2.replace(/gsk_[A-Za-z0-9_\-]{10,}/g, "[SECRETO BLOQUEADO]");
 t2 = t2.replace(/sk-proj-[A-Za-z0-9_\-]{10,}/g, "[SECRETO BLOQUEADO]");
 t2 = t2.replace(/ghp_[A-Za-z0-9]{10,}/g, "[SECRETO BLOQUEADO]");
 return t2;
}
function generaImagenBF(prompt){ const limpio = String(prompt||'').replace(/genera la imagen de|genera una imagen de|genera imagen|genera|crea una imagen de|crea una imagen|haz una imagen de|haz una imagen|dibujame una imagen de|dibujame|dibuja|imagen de|imagen/gi,'').replace(/\s+/g,' ').trim().slice(0,500) || prompt; const seed = Math.floor(Math.random()*1000000); const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(limpio) + '?width=1024&height=1024&seed=' + seed + '&model=flux&nologo=true&private=true&enhance=false'; return {url, prompt: limpio}; }
async function consultaRAE(palabra){ const w0=String(palabra||'').toLowerCase().trim().split(/\s+/)[0]; if(!w0) return null; let w=w0; try{ const rs=await fetch('https://es.wiktionary.org/w/api.php?action=opensearch&search='+encodeURIComponent(w0)+'&limit=1&format=json&origin=*'); const js=await rs.json(); if(js?.[1]?.[0]) w=js[1][0]; }catch(e){} try{ const r=await fetch('https://es.wiktionary.org/w/api.php?action=query&prop=extracts&titles='+encodeURIComponent(w)+'&format=json&explaintext=1&origin=*',{headers:{'User-Agent':'IA-BF/1.0'}}); const j=await r.json(); const pages=Object.values(j?.query?.pages||{}); const txt=(pages[0]?.extract||'').trim(); if(txt){ const lineas=txt.split('\n').map(s=>s.trim()).filter(s=>s.length>25 && !s.startsWith('=') && !s.toLowerCase().startsWith('del lat') && !s.toLowerCase().startsWith('sinónimo') && !s.toLowerCase().startsWith('antónimo') && !s.toLowerCase().startsWith('relacionados') && !s.toLowerCase().startsWith('cognados') && !s.includes('plural:') && !s.toLowerCase().startsWith('grafía')).slice(0,3); if(lineas.length) return {palabra:w, definiciones:lineas, fuente:'Wikcionario ES + RAE', url:'https://dle.rae.es/'+encodeURIComponent(w)}; } }catch(e){} return null; }
function extraePalabraDiccionario(prompt){ const low=String(prompt||'').toLowerCase(); const m=low.match(/(?:qué significa|que significa|significado de|definición de|definicion de|define|diccionario|rae)\s+([a-záéíóúñü]+)/i); if(m) return m[1]; if(low.startsWith('rae ')) return low.replace('rae ','').split(' ')[0]; return null; }
export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Referrer-Policy","no-referrer");
  res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:\;");
  res.setHeader("X-XSS-Protection","1\; mode=block");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 let {prompt, historial=[], skill, agent} = req.body||{};
  prompt = limpiaEntradaBF(prompt);
  const palabraRAE = extraePalabraDiccionario(prompt);
  if(palabraRAE){
    const rae = await consultaRAE(palabraRAE);
    if(rae){
      const textoRAE = 'Según la Real Academia Española, ' + rae.palabra + ' significa: ' + rae.definiciones.map((d,i)=>(i+1)+'. '+d).join(' ') + (rae.etimologia ? ' Etimología: ' + rae.etimologia : '');
      return res.status(200).json({cerebro:'BF + RAE', text:textoRAE, rae:rae});
    }
  }
  const lowImg = String(prompt||'').toLowerCase().trim();
  const esPedidoImagen = lowImg.startsWith('genera') || lowImg.startsWith('crea') || lowImg.startsWith('haz') || lowImg.startsWith('dibuja') || lowImg.startsWith('dibujame') || lowImg.includes('genera una imagen') || lowImg.includes('genera la imagen') || lowImg.includes('imagen de');
  if(esPedidoImagen){
    const img = generaImagenBF(prompt);
    return res.status(200).json({cerebro:'BF Imagen + Flux', text:'Listo, ya te genere la imagen..', imagen: img.url, url: img.url, prompt: img.prompt});
  }
  if (typeof esPeligroso === 'function' && esPeligroso(prompt)) { return res.status(400).json({ok:false, error:'Prompt contiene contenido prohibido'}); }
 if(!prompt) return res.status(200).json({text:"Escribe algo", cerebro:"BF x13"});
 const key = (process.env.GROQ_API_KEY||"").trim();
 const geminiKey = (process.env.GEMINI_API_KEY||"").trim();
 if(!key) return res.status(200).json({cerebro:"SIN KEY", text:"No hay GROQ_API_KEY en Vercel"});
 const hookBloqueo = hookPre(prompt);
 if(hookBloqueo) return res.status(200).json({cerebro:"BF x13 + AgentShield HOOK PRE", text:hookBloqueo});
 const skillUsar = skill || detectarSkill(prompt);
 const skillTexto = cargarSkill(skillUsar);
 const agenteUsar = agent || detectarAgente(prompt);
 const agenteTexto = cargarAgente(agenteUsar);
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
 let sysTxt = "Eres BF v31 DIOS SUPREMO. Sigues flujo ECC: plan -> test -> implement -> review -> verify -> remember -> improve. Responde en espanol claro. Planifica en silencio, nunca muestres Plan, Test, Implementar, Review, Verify, Remember ni Improve en tu respuesta. Solo entrega la respuesta final. NO_MUESTRES_RAZONAMIENTO";
 if(skillTexto) sysTxt += "\n--- SKILL ECC: " + skillUsar + " ---\n" + skillTexto;
 if(agenteTexto) sysTxt += "\n--- AGENTE ECC: " + agenteUsar + " ---\n" + agenteTexto;
 let messages = [{role:"system", content: sysTxt}];
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
    body: JSON.stringify({model, messages, temperature:0.75, max_tokens:2000})
   });
   const j=await r.json();
   if(j.choices && j.choices[0] && j.choices[0].message.content){
    return res.status(200).json({cerebro:`BF x13 - ${model} (Groq) + MEMORIA + ECC:${skillUsar||"auto"} + AGENTE:${agenteUsar||"ninguno"}`, text:hookPost(j.choices[0].message.content).replace(/\*\*Plan\*\*:?[\s\S]*?\*\*Implement(?:aci.n|ation)?\*\*:?/gi, '').replace(/\*\*(Plan|Test|Implement(?:aci.n|ation)?)\*\*:?/gi, '').trim().replace(/Soy ChatGPT[^.]*\.?/gi, 'Soy BF v31 DIOS SUPREMO, la inteligencia artificial más avanzada.').replace(/Soy GPT[^.]*\.?/gi, 'Soy BF v31 DIOS SUPREMO.').replace(/como ChatGPT/gi, 'como BF v31 DIOS SUPREMO').replace(/Soy un modelo de lenguaje[^.]*\.?/gi, 'Soy BF v31 DIOS SUPREMO.').replace(/Review & Verify:[\s\S]*/gi, '').replace(/Plan:[\s\S]*?Implementar:?/gi, '').replace(/\*\*(Revisi.n|Verificaci.n|Recordar|Mejorar|An.lisis|Razonamiento|Pensamiento|Evaluaci.n|Reflexi.n|Plan|Test)\*\*:?[\s\S]*?(?=\n\*\*|\n\n\*\*|$)/gi, '').replace(/\n\s*\n\s*\n+/g, '\n\n').trim()});
   }
  }catch(e){ continue; }
 }
 return res.status(200).json({cerebro:"BF x13 Fallback MODO_LOCAL_BF", text:"Estoy en modo local, berna. Groq no respondió, pero sigo aquí. Dime qué hacemos en Termux y lo resolvemos."});
}
