export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcular(t){
  const lower=t.toLowerCase();
  let m=lower.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){const num=parseFloat(m[1]); if(num<0) return {expr:`√${num}`, res:`${Math.sqrt(Math.abs(num))}i`}; const r=Math.sqrt(num); return {expr:`√${num}`, res:Number.isInteger(r)?r:r.toFixed(6)};}
  m=lower.match(/(?:raiz cuadrada|raíz cuadrada)\s+(-?\d+(\.\d+)?)/i); if(m){const num=parseFloat(m[1]); const r=Math.sqrt(num); return {expr:`√${num}`, res:Number.isInteger(r)?r:r.toFixed(6)};}
  const match=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(match){try{let e=match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:match[0], res:r};}}catch{}} return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}

const DGETI_TECNOLOGICOS = {
  // DGETI - 35 especialidades oficiales México
  programacion: { kws:["programacion dgeti","programar","codigo","javascript","python","base de datos","dgeti programacion"], resp:"DGETI Programación: Algoritmos, POO, BD SQL, JS, Python, Java, HTML, CSS, estructura datos, mas arriba" },
  electronica: { kws:["electronica dgeti","circuitos","resistencia","transistor","electronica"], resp:"DGETI Electrónica: Ley Ohm V=IR, circuitos, diodos, transistores, microcontroladores Arduino, PLC mas arriba" },
  mecatronica: { kws:["mecatronica dgeti","mecatronica","robot","automatizacion"], resp:"DGETI Mecatrónica: Mecánica + Electrónica + Control, robots, neumática, hidráulica, CNC, mas arriba" },
  mecanica: { kws:["mecanica industrial dgeti","mecanica","tornos","fresadora","mecanica"], resp:"DGETI Mecánica Industrial: Tornos, fresadoras, soldadura, dibujo técnico, tolerancias, materiales mas arriba" },
  electricidad: { kws:["electricidad dgeti","electricidad","instalaciones electricas"], resp:"DGETI Electricidad: Instalaciones residenciales, industriales, transformadores, motores, NOM-001 mas arriba" },
  quimica_lab: { kws:["laboratorista quimico dgeti","laboratorista","quimico dgeti","analisis quimico"], resp:"DGETI Laboratorista Químico: Análisis químico, titulación, pH, espectrofotometría, química orgánica mas arriba" },
  alimentos: { kws:["alimentos y bebidas dgeti","alimentos","conservas"], resp:"DGETI Producción Industrial de Alimentos: Conservación, microbiología, BPM, HACCP, mas arriba" },
  arquitectura: { kws:["arquitectura dgeti","dibujo arquitectonico","autocad"], resp:"DGETI Arquitectura: Dibujo arquitectónico, AutoCAD, estructuras, materiales, planos mas arriba" },
  construccion: { kws:["construccion dgeti","construccion","albañileria"], resp:"DGETI Construcción: Topografía, concreto, estructuras, presupuestos, obra civil mas arriba" },
  contabilidad: { kws:["contabilidad dgeti","contabilidad","administracion"], resp:"DGETI Contabilidad: Contabilidad básica, impuestos SAT, nómina, finanzas, Excel avanzado mas arriba" },
  administracion: { kws:["administracion dgeti","administracion recursos humanos","administracion"], resp:"DGETI Administración RH: Reclutamiento, nómina, IMSS, liderazgo, administración mas arriba" },
  enfermeria: { kws:["enfermeria dgeti","enfermeria","auxiliar enfermeria"], resp:"DGETI Enfermería: Anatomía, primeros auxilios, signos vitales, farmacología básica mas arriba" },
  refrigeracion: { kws:["refrigeracion dgeti","aire acondicionado","refrigeracion","climas"], resp:"DGETI Refrigeración y Climatización: Ciclo refrigeración, gases, compresores, HVAC mas arriba" },
  automotriz: { kws:["automotriz dgeti","mecanica automotriz","autos","motor"], resp:"DGETI Mantenimiento Automotriz: Motor combustión, inyección, frenos ABS, escáner, diagnóstico mas arriba" },
  telecom: { kws:["telecomunicaciones dgeti","telecom","redes","fibra optica"], resp:"DGETI Telecomunicaciones: Redes LAN/WAN, fibra óptica, antenas, 5G, CCNA mas arriba" },
  // TECNOLÓGICOS MUNDIALES
  sistemas: { kws:["sistemas computacionales","ingenieria sistemas","tecnm sistemas","sistemas"], resp:"TecNM Sistemas: Estructuras datos, SO, redes, IA, ciberseguridad, compiladores, base datos mas arriba" },
  industrial: { kws:["ingenieria industrial","industrial","procesos","calidad"], resp:"Ing. Industrial: Procesos, calidad Six Sigma, Lean, logística, optimización, IO mas arriba" },
  civil: { kws:["ingenieria civil","civil","estructuras","puentes"], resp:"Ing. Civil: Estructuras, concreto, acero, hidráulica, geotecnia, sismo resistente mas arriba" },
  electromecanica: { kws:["electromecanica","electromecanica tec","electromecanica"], resp:"Ing. Electromecánica: Motores, PLC, automatización, control, potencia mas arriba" },
  gestion: { kws:["gestion empresarial","gestion","empresarial"], resp:"Ing. Gestión Empresarial: Proyectos, marketing, finanzas, emprendimiento, ISO mas arriba" },
  quimica_ing: { kws:["ingenieria quimica","quimica ing","procesos quimicos"], resp:"Ing. Química: Reactores, balances, termodinámica, operaciones unitarias, procesos mas arriba" },
  bioquimica: { kws:["bioquimica","ingenieria bioquimica","biotecnologia"], resp:"Ing. Bioquímica: Biotecnología, fermentación, bioprocesos, microbiología industrial mas arriba" },
  mecatronica_ing: { kws:["ingenieria mecatronica","mecatronica ing"], resp:"Ing. Mecatrónica: Robótica, visión artificial, control PID, Arduino, ROS mas arriba" },
  // MIT / GLOBAL
  mit: { kws:["mit","stanford","harvard tecnologico","caltech","inteligencia artificial avanzada","machine learning"], resp:"Tecnológicos Global MIT/Stanford: IA avanzada Transformers, Deep Learning, Quantum Computing, Blockchain, Nanotech mas arriba" }
};

function detectarDGETI(t){
  const l=t.toLowerCase();
  for(const k in DGETI_TECNOLOGICOS){
    for(const kw of DGETI_TECNOLOGICOS[k].kws) if(l.includes(kw)) return DGETI_TECNOLOGICOS[k].resp;
  }
  return null;
}

export async function buscarInternetReal(q){
  try{
    const kw=q.toLowerCase().replace(/que es|explica|dgeti|tecnologico|ingenieria/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    if(!kw) return "";
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v4.2"}, signal:AbortSignal.timeout(3500)});
    if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,450);}
  }catch{} return "";
}

export async function responderConBotPropio(botId, prompt){
  const l=prompt.toLowerCase();
  const calc=calcular(prompt); if(calc) return `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;
  const dgeti=detectarDGETI(prompt); if(dgeti) return botId==="BF-LIDER"? dgeti.slice(0,350) : dgeti.slice(0,400);
  const web=await buscarInternetReal(prompt);
  if(web) return web.slice(0,400);
  return `${prompt.slice(0,90)}: DGETI y Tecnológicos del mundo - explicado mas arriba.`;
}
