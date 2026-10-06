export const MIS_BOTS = {
  "BF-LIDER": { nombre:"LIDER BF" },
  "BF-SUPREMO": { nombre:"SUPREMO BF-9" }
};

function calcularBF(texto){
  const match = texto.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i);
  if(!match) return null;
  try{
    let expr = match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,'');
    if(!/^[0-9+\-*/().% *]+$/.test(expr)) return null;
    const res = Function(`"use strict"; return (${expr})`)();
    if(isFinite(res)) return { expr: match[0], resultado: res };
  }catch{}
  return null;
}

const MATERIAS_BF = {
  matematicas: {
    keywords: ["matematica","suma","resta","multiplicacion","division","ecuacion","algebra","geometria","2+2","cuanto es"],
    respuestas: {
      "2+2": "4 - suma básica. 2 unidades + 2 unidades = 4",
      "default": "Matemáticas BF: Resuelve con lógica, números y fórmulas mas arriba que lo alto."
    }
  },
  fisica: { keywords:["fisica","newton","gravedad","velocidad","fuerza","energia","luz"], default:"Física BF: F=ma, E=mc², gravedad 9.8m/s². Todo se mueve con leyes mas arriba." },
  quimica: { keywords:["quimica","elemento","tabla periodica","atomo","molecula","H2O","agua"], default:"Química BF: H2O es agua, tabla periódica con 118 elementos. Reacciones mas arriba." },
  biologia: { keywords:["biologia","celula","adn","fotosintesis","cuerpo","corazon","animal"], default:"Biología BF: Célula es unidad de vida, ADN es código, fotosíntesis crea oxígeno. Vida mas arriba." },
  historia: { keywords:["historia","revolucion","guerra","mexico","independencia","azteca","maya"], default:"Historia BF: México independiente 1821, Revolución 1910. Historia mas arriba que lo alto." },
  geografia: { keywords:["geografia","capital","pais","montaña","rio","continente","mapa"], default:"Geografía BF: 7 continentes, Tokio capital Japón, Everest 8848m. Mundo mas arriba." },
  espanol: { keywords:["español","ortografia","verbo","sustantivo","literatura","poema"], default:"Español BF: Ortografía y gramática mas arriba. Verbo es acción, sustantivo es cosa." },
  ingles: { keywords:["ingles","english","translate","hello","how are"], default:"Inglés BF: Hello=Hola, How are you=Como estas. Inglés mas arriba." },
  programacion: { keywords:["codigo","programar","javascript","python","html","funcion"], default:"Programación BF: Código mas arriba. JavaScript, Python, HTML. Lógica pura." },
  arte: { keywords:["arte","pintura","musica","colores"], default:"Arte BF: Colores, música y creatividad mas arriba." }
};

function detectarMateria(texto){
  const lower = texto.toLowerCase();
  for(const [materia, data] of Object.entries(MATERIAS_BF)){
    for(const kw of data.keywords){
      if(lower.includes(kw)) return materia;
    }
  }
  return null;
}

function respuestaPorMateria(materia, pregunta, botId){
  const calc = calcularBF(pregunta);
  if(calc){
    return botId==="BF-LIDER"? `AFIRMATIVO [MATEMÁTICAS]: ${calc.expr} = ${calc.resultado}. Cálculo táctico BF.` : `[SUPREMO MATEMÁTICO] ${calc.expr} = ${calc.resultado}. Número supremo mas arriba.`;
  }
  const data = MATERIAS_BF[materia];
  if(!data) return null;
  const lower = pregunta.toLowerCase();
  if(materia==="matematicas" && data.respuestas){
    for(const k in data.respuestas){ if(lower.includes(k) && k!=="default") return data.respuestas[k]; }
  }
  return data.default || data.respuestas?.default;
}

export async function buscarInternetReal(query){
  try{
    const kw = query.toLowerCase().replace(/que es|cuanto es|explica|dime|como funciona/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { headers:{"User-Agent":"BF-v3.1"}, signal:AbortSignal.timeout(4000) });
    if(r.ok){ const j=await r.json(); if(j?.extract) return j.extract.slice(0,300); }
  }catch{}
  return "";
}

export async function responderConBotPropio(botId, prompt, webData){
  const lower = prompt.toLowerCase();
  if(lower.includes("fecha de nacimiento")||lower.includes("cuando naciste")) return botId==="BF-LIDER"? `LIDER BF: Creador 01/03/1999 solo si preguntas.` : `SUPREMO: Registro 01/03/1999.`;
  if(lower.includes("quien eres")||lower.includes("creador")) return botId==="BF-LIDER"? `IA BF mas arriba! Soy LIDER BF, creado por BERNARDO FABIAN VILLEGAS NOLAZCO. Todas las materias.` : `IA BF mas arriba! Soy SUPREMO BF-9 INMORTAL, todas las materias, creado por BERNARDO FABIAN VILLEGAS NOLAZCO.`;

  const materia = detectarMateria(prompt);
  let baseMateria = null;
  if(materia) baseMateria = respuestaPorMateria(materia, prompt, botId);

  const web = await buscarInternetReal(prompt);
  let final = web || baseMateria || `Clase BF [${materia||'GENERAL'}]: ${prompt.slice(0,120)} - explicado mas arriba que lo alto.`;

  if(botId==="BF-LIDER"){
    return `AFIRMATIVO [${(materia||'GENERAL').toUpperCase()}]: ${final} - LIDER BF enseña mas arriba.`.slice(0,350);
  } else {
    return `[SUPREMO BF-9 - ${materia||'GENERAL'}] ${final} Análisis inmortal. Creado por BERNARDO FABIAN VILLEGAS NOLAZCO.`.slice(0,400);
  }
}
