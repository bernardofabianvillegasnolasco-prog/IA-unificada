export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcular(t){
  const lower=t.toLowerCase();
  let m=lower.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){const num=parseFloat(m[1]); if(num<0) return {expr:`√${num}`, res:`${Math.sqrt(Math.abs(num))}i`}; const r=Math.sqrt(num); return {expr:`√${num}`, res: Number.isInteger(r)?r: r.toFixed(6).replace(/\.?0+$/,'')};}
  m=lower.match(/(?:raiz cuadrada|raíz cuadrada)\s+(-?\d+(\.\d+)?)/i); if(m){const num=parseFloat(m[1]); const r=Math.sqrt(num); return {expr:`√${num}`, res: Number.isInteger(r)?r:r.toFixed(6)};}
  const match=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(match){try{let e=match[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:match[0], res:r};}}catch{}} return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}

const CARRERAS_OMNI = {
  agricultura: { kws:["agricultura","agronomia","agronomo","cultivo","siembra","agricola"], resp:"Agricultura/Agronomía: Suelos, pH 6-7, N-P-K, riego por goteo, cultivo maíz 8t/ha, trigo, frijol, fertirriego, agricultura regenerativa, hidroponía, mas arriba" },
  ganaderia: { kws:["ganaderia","ganado","bovino","vacuno","ovino","porcino","ganadero"], resp:"Ganadería: Bovino 450kg, razas Angus, Brahman, alimentación 2.5% peso, pastoreo rotacional, reproducción IA, sanidad, producción leche 25L/día mas arriba" },
  veterinaria: { kws:["veterinaria","veterinario","zootecnia"], resp:"Veterinaria/Zootecnia: Anatomía animal, vacunas, desparasitación, cirugía, nutrición animal, etología mas arriba" },
  nutriologia: { kws:["nutriologia","nutricion","dieta","nutriologo","calorias"], resp:"Nutriología: Macro: proteína 4kcal/g, carbo 4, grasa 9, TMB Harris-Benedict, dieta 2000kcal, vitaminas A,B,C,D,E, minerales, keto, vegana mas arriba" },
  medicina: { kws:["medicina","medico","cirugia","anatomia","fisiologia","doctor"], resp:"Medicina: 206 huesos, corazón 70 lpm, presión 120/80, sangre O+, farmacología, patología, cirugía, diagnóstico mas arriba" },
  enfermeria: { kws:["enfermeria","enfermero"], resp:"Enfermería: Signos vitales, primeros auxilios, RCP 30:2, inyección IM, IV, cuidados mas arriba" },
  balistica: { kws:["balistica","balas","proyectil","arma","forense","balistica"], resp:"Balística: Interior, exterior, efecto, trayectoria parabólica y= x tanθ - gx²/(2v²cos²θ), calibre 9mm 350m/s, 7.62 800m/s, peritaje forense mas arriba" },
  criminologia: { kws:["criminologia","criminalistica","forense","perito"], resp:"Criminología/Criminalística: Lofoscopia, balística, ADN, perfil criminal, cadena custodia mas arriba" },
  astrologia: { kws:["astrologia","zodiaco","signos","aries","tauro","horoscopo","carta astral"], resp:"Astrología: 12 signos Aries 21mar-19abr Fuego, Tauro Tierra, Géminis Aire, Cáncer Agua, Leo, Virgo, Libra, Escorpio, Sagitario, Capricornio, Acuario, Piscis, planetas, casas, ascendente mas arriba" },
  astronomia: { kws:["astronomia","planeta","galaxia","estrella","universo"], resp:"Astronomía: 8 planetas, Sol 1.39M km diámetro, luz 300k km/s, Vía Láctea 100k años luz, agujero negro, Big Bang 13.8B años mas arriba" },
  derecho: { kws:["derecho","abogado","leyes","constitucion"], resp:"Derecho: Constitución 136 arts, Penal, Civil, Laboral, Amparo, Mercantil, Internacional, derechos humanos mas arriba" },
  psicologia: { kws:["psicologia","psicologo"], resp:"Psicología: Freud, Jung, conductismo, cognitiva, DSM-5, terapia CBT mas arriba" },
  arquitectura: { kws:["arquitectura","arquitecto"], resp:"Arquitectura: AutoCAD, BIM, estructuras, concreto f'c=250, acero, diseño mas arriba" },
  contaduria: { kws:["contaduria","contador","sat"], resp:"Contaduría: SAT, ISR, IVA 16%, estados financieros, NIF, auditoría mas arriba" },
  gastronomia: { kws:["gastronomia","chef","cocina"], resp:"Gastronomía: Técnicas, madre salsas, temperaturas carne 63°C, panadería, repostería mas arriba" },
  turismo: { kws:["turismo","hoteleria","viajes"], resp:"Turismo: Hotelería, agencias, ecoturismo, 8P marketing turístico mas arriba" },
  pedagogia: { kws:["pedagogia","educacion","maestro"], resp:"Pedagogía: Didáctica, planeación, evaluación, neuroeducación mas arriba" },
  comunicacion: { kws:["comunicacion","periodismo","medios"], resp:"Comunicación: Periodismo, locución, producción, marketing digital mas arriba" },
  diseno: { kws:["diseño","grafico","industrial","moda"], resp:"Diseño: Gráfico Photoshop, Illustrator, UX/UI, industrial, moda mas arriba" },
  musica: { kws:["musica","musico","instrumento","canto"], resp:"Música: Notas C-D-E-F-G-A-B, acordes, solfeo, producción mas arriba" },
  deportes: { kws:["deportes","cultura fisica","entrenador","deportiva"], resp:"Educación Física: Anatomía, entrenamiento, fisiología ejercicio, nutrición deportiva mas arriba" },
  // DGETI + TEC + UNIVERSAL
  dgeti: { kws:["dgeti","cbtis","cetis"], resp:"DGETI 35: Programación, Electrónica, Mecatrónica, Mecánica, Electricidad, Lab Químico, Alimentos, Automotriz, Telecom mas arriba" },
  leyes: { kws:["ley de newton","ley ohm","leyes"], resp:"Leyes: Newton F=ma, Ohm V=IR, Gravedad F=Gm1m2/r², Termodinámica, Maxwell, Constitución MX mas arriba" }
};

function detectar(t){
  const l=t.toLowerCase();
  for(const cat in CARRERAS_OMNI){
    for(const kw of CARRERAS_OMNI[cat].kws) if(l.includes(kw)) return CARRERAS_OMNI[cat].resp;
  }
  return null;
}

export async function buscarInternetReal(q){
  try{
    const kw=q.toLowerCase().replace(/que es|explica|licenciatura|carrera/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    if(!kw) return "";
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-OMNI"}, signal:AbortSignal.timeout(3500)});
    if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,550);}
  }catch{} return "";
}

export async function responderConBotPropio(botId, prompt){
  const calc=calcular(prompt); if(calc) return `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;
  const det=detectar(prompt); if(det) return det.slice(0,550);
  const web=await buscarInternetReal(prompt);
  if(web) return web.slice(0,550);
  return `${prompt.slice(0,100)}: Omnisciencia BF - todas las carreras de la humanidad mas arriba.`;
}
