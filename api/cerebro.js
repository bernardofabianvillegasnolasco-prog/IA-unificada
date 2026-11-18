import fs from "fs";
import path from "path";
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
 try{
  const dir = path.join(process.cwd(), "ecc-agents");
  const lista = fs.readdirSync(dir);
  for(const f of lista){
   const nombre = f.replace(".md","");
   if(x.includes("agente " + nombre.toLowerCase()) || x.includes("agent " + nombre.toLowerCase())) return nombre;
  }
 }catch(e){}
 return "";
}
export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS") return res.status(200).end();
 const {prompt, historial=[], skill, agent} = req.body||{};
 if(!prompt) return res.status(200).json({text:"Escribe algo", cerebro:"BF x13"});
 const key = (process.env.GROQ_API_KEY||"").trim();
 if(!key) return res.status(200).json({cerebro:"SIN KEY", text:"No hay GROQ_API_KEY en Vercel"});
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
 let sysTxt = "Eres BF v31 DIOS SUPREMO. Sigues flujo ECC: plan -> test -> implement -> review -> verify -> remember -> improve. Responde en espanol claro. Primero planifica, luego ejecutas.";
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
    return res.status(200).json({cerebro:`BF x13 - ${model} (Groq) + MEMORIA + ECC:${skillUsar||"auto"} + AGENTE:${agenteUsar||"ninguno"}`, text:j.choices[0].message.content});
   }
  }catch(e){ continue; }
 }
 return res.status(200).json({cerebro:"BF x13 Fallback", text:"Groq no respondio. Revisa tu key"});
}
