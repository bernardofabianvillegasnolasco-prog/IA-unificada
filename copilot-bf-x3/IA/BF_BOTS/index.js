export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcular(t){
  const l=t.toLowerCase();
  let m=l.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){const n=parseFloat(m[1]); if(n<0) return {expr:`√${n}`, res:`${Math.sqrt(Math.abs(n))}i`}; const r=Math.sqrt(n); return {expr:`√${n}`, res: Number.isInteger(r)?r: r.toFixed(4)};}
  m=l.match(/(?:raiz cuadrada|raíz cuadrada)\s+(-?\d+(\.\d+)?)/i); if(m){const n=parseFloat(m[1]); const r=Math.sqrt(n); return {expr:`√${n}`, res: Number.isInteger(r)?r:r.toFixed(4)};}
  const mt=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(mt){try{let e=mt[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:mt[0], res:r};}}catch{}} return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;}}catch{} return null;}

// DICCIONARIO TODOS LOS IDIOMAS
const DICCIONARIO_GLOBAL = {
  "hola": { en:"hello", fr:"bonjour", de:"hallo", it:"ciao", pt:"olá", ja:"こんにちは", zh:"你好", ru:"привет", ar:"مرحبا", ko:"안녕하세요", tr:"merhaba", nl:"hallo", pl:"cześć" },
  "adios": { en:"goodbye", fr:"au revoir", de:"tschüss", it:"addio", pt:"adeus", ja:"さようなら", zh:"再见", ru:"до свидания", ar:"وداعا", ko:"안녕", tr:"güle güle" },
  "ladrillo": { en:"brick", fr:"brique", de:"Ziegel", it:"mattone", pt:"tijolo", ja:"レンガ", zh:"砖", ru:"кирпич", ar:"طوب" },
  "tabique": { en:"partition wall / brick", fr:"cloison", de:"Trennwand", it:"tramezzo", pt:"tabique", ja:"間仕切り", zh:"隔墙" },
  "cemento": { en:"cement", fr:"ciment", de:"Zement", it:"cemento", pt:"cimento", ja:"セメント", zh:"水泥", ru:"цемент" },
  "gracias": { en:"thank you", fr:"merci", de:"danke", it:"grazie", pt:"obrigado", ja:"ありがとう", zh:"谢谢", ru:"спасибо", ar:"شكرا" },
  "agua": { en:"water", fr:"eau", de:"Wasser", it:"acqua", pt:"água", ja:"水", zh:"水", ru:"вода" },
  "casa": { en:"house", fr:"maison", de:"Haus", it:"casa", pt:"casa", ja:"家", zh:"房子", ru:"дом" }
};

async function traducirDiccionario(texto){
  const l=texto.toLowerCase();
  // Detecta: traduce hola a ingles, diccionario ladrillo, como se dice casa en japones
  let m=l.match(/(?:traduce|traducir|como se dice|diccionario|dictionary|translate)\s+["']?([a-záéíóúñ]+)["']?\s*(?:a|en|to|in)?\s*(ingles|english|frances|french|aleman|german|italiano|italian|portugues|portuguese|japones|japanese|chino|chinese|ruso|russian|arabe|arabic|coreano|korean|todos|all)?/i);
  if(!m) return null;
  const palabra=m[1].replace(/["']/g,"").trim();
  const idioma=m[2]||"todos";
  const entry=DICCIONARIO_GLOBAL[palabra];
  if(entry){
    if(idioma==="todos"||idioma==="all"){
      let res=`${palabra} = ` + Object.entries(entry).map(([k,v])=>`${k.toUpperCase()}:${v}`).join(" | ");
      return res.slice(0,600);
    } else {
      const mapLang={ingles:"en", english:"en", frances:"fr", french:"fr", aleman:"de", german:"de", italiano:"it", italian:"it", portugues:"pt", portuguese:"pt", japones:"ja", japanese:"ja", chino:"zh", chinese:"zh", ruso:"ru", russian:"ru", arabe:"ar", arabic:"ar", coreano:"ko", korean:"ko"};
      const code=mapLang[idioma]||idioma;
      return `${palabra} en ${idioma.toUpperCase()} = ${entry[code]||"traducción no directa, usa MyMemory mas arriba"}`;
    }
  }
  // Si no está en diccionario local, usa API MyMemory gratis
  try{
    const langTo={ingles:"en", frances:"fr", aleman:"de", italiano:"it", portugues:"pt", japones:"ja", chino:"zh", ruso:"ru", arabe:"ar", coreano:"ko"};
    const target=langTo[idioma]||"en";
    const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(palabra)}&langpair=es|${target}`, {signal:AbortSignal.timeout(3000)});
    if(r.ok){const j=await r.json(); if(j?.responseData?.translatedText) return `${palabra} en ${idioma} = ${j.responseData.translatedText}`;}
  }catch{}
  return null;
}

const OMNI = {
  albanileria: { kws:["albañileria","albañil","ladrillo","tabique","pegar ladrillo","como pegar","muro","block","mortero"], resp:"ALBAÑILERÍA:\n1. Traza hilo+plomada 3-4-5\n2. Mortero 1:4 (1 cemento+4 arena)\n3. Moja tabique 10min\n4. Cama 1.5cm, junta 1-1.5cm, cuatrapea\n5. 1m²=25 tabiques 7x14x28, 0.04m³ mezcla" },
  agricultura: { kws:["agricultura","agronomia","cultivo"], resp:"Agricultura: pH 6-7, NPK, riego goteo, maíz 8t/ha" },
  ganaderia: { kws:["ganaderia","ganado","bovino"], resp:"Ganadería: Bovino 450kg, Angus, leche 25L/día" },
  balistica: { kws:["balistica","bala","proyectil"], resp:"Balística: y=x tanθ - gx²/2v²cos²θ, 9mm 350m/s" },
  astrologia: { kws:["astrologia","zodiaco","aries"], resp:"Astrología: 12 signos, Aries fuego 21mar-19abr" },
  diccionario: { kws:["diccionario","traduce","translate","idioma","como se dice"], resp:"Diccionario BF: Todos los idiomas ES-EN-FR-DE-IT-PT-JA-ZH-RU-AR-KO-TR. Ej: traduce hola a ingles = hello" }
};

function detectar(t){const l=t.toLowerCase().replace(/[()]/g," "); for(const c in OMNI) for(const k of OMNI[c].kws) if(l.includes(k)) return OMNI[c].resp; return null;}

export async function buscarInternetReal(q){
  try{
    const kw=q.toLowerCase().replace(/como|que es|diccionario|traduce|traducir/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    if(!kw) return "";
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v8"}, signal:AbortSignal.timeout(3000)});
    if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,550);}
  }catch{} return "";
}

export async function responderConBotPropio(botId, prompt){
  const calc=calcular(prompt); if(calc) return `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;
  const trad=await traducirDiccionario(prompt); if(trad) return trad;
  const det=detectar(prompt); if(det) return det.slice(0,650);
  const web=await buscarInternetReal(prompt); if(web) return web.slice(0,600);
  return `${prompt.slice(0,100)}: BF Omni Universal mas arriba.`;
}
