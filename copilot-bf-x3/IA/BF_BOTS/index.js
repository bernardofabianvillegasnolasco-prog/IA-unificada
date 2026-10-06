export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcularBF(t){const m=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i); if(!m) return null; try{let e=m[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(!/^[0-9+\-*/().% *]+$/.test(e)) return null; const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return{expr:m[0],res:r};}catch{} return null;}
function resolverAlgebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); return `x = ${(c-b)/a}`;} m=l.match(/^x([\+\-]\d+\.?\d*)=(-?\d+\.?\d*)$/); if(m)return `x = ${parseFloat(m[2])-parseFloat(m[1])}`; m=l.match(/^(-?\d*\.?\d*)x=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); return `x = ${parseFloat(m[2])/a}`;} m=l.match(/^x\^2=(-?\d+\.?\d*)$/); if(m){let c=parseFloat(m[1]); return c>=0?`x = ±${Math.sqrt(c)}`:`x = ±${Math.sqrt(-c)}i`;} }catch{} return null;}

const SISTEMA_EDUCATIVO_BF = {
  // PREESCOLAR 3-5 años
  preescolar: { kws:["colores","numeros 1 al 10","vocales","abecedario","figuras","manzana","contar"], resp:"Preescolar: Colores: rojo, azul, amarillo. Números 1-10. Vocales A,E,I,O,U. Figuras: círculo, cuadrado, triángulo." },
  // PRIMARIA 6-11
  primaria: { kws:["suma","resta","multiplicacion","division","fraccion","primaria"], resp:"Primaria: Suma, resta, multiplicación, división, fracciones 1/2=0.5, decimales, lectura, escritura." },
  // SECUNDARIA 12-14
  secundaria: { kws:["algebra basica","ecuacion","potencia","raiz cuadrada","secundaria","angulo"], resp:"Secundaria: Álgebra x+2=5 → x=3, potencias 2³=8, raíz √9=3, ángulos 90°, teorema Pitágoras a²+b²=c²" },
  // BACHILLERATO 15-17
  bachillerato: { kws:["trigonometria","logaritmo","funcion","derivada","bachillerato","preparatoria","seno","coseno"], resp:"Bachillerato: Seno, coseno, tangente, logaritmos log(100)=2, funciones f(x), derivada básica d/dx x²=2x" },
  // UNIVERSIDAD
  universidad: {
    calculo: { kws:["calculo","integral","derivada","limite","diferencial"], resp:"Cálculo Universitario: límite lim x→0 sinx/x=1, derivada d/dx eˣ=eˣ, integral ∫x dx = x²/2 + C" },
    fisica: { kws:["fisica universitaria","cuantica","termodinamica","newton","einstein"], resp:"Física Uni: F=ma, E=mc², Schrödinger iħ∂ψ/∂t=Ĥψ, Termodinámica ΔU=Q-W" },
    quimica: { kws:["quimica organica","molecula","ph","reaccion","quimica uni"], resp:"Química Uni: pH=-log[H⁺], orgánica CH4 metano, reacción 2H2+O2→2H2O" },
    biologia: { kws:["biologia universitaria","genetica","evolucion","celula"], resp:"Biología Uni: Mitosis, Meiosis, Genética Mendel Aa x Aa = 25% AA, Evolución Darwin" },
    programacion: { kws:["programacion","javascript","python","algoritmo","codigo"], resp:"Programación Uni: JS: const x=()=>{}, Python: def f():, Algoritmo O(n log n)" },
    economia: { kws:["economia","oferta","demanda","pib"], resp:"Economía: Oferta y demanda, PIB, inflación, E=mc² económico no existe pero mas arriba sí" },
    filosofia: { kws:["filosofia","kant","nietzsche","existencialismo"], resp:"Filosofía: Descartes 'Pienso luego existo', Kant, Nietzsche, Sócrates" }
  },
  // MAESTRÍA / DOCTORADO
  doctorado: { kws:["doctorado","tesis","investigacion","cuantica avanzada","relatividad","teoria de cuerdas","ia avanzada"], resp:"Doctorado: Teoría de cuerdas, Relatividad General Gμν+Λgμν=8πTμν, IA avanzada Transformers Attention is all you need, investigación científica método" },
  // IDIOMAS TODOS
  idiomas: { kws:["idioma","traduce","ingles","frances","aleman","japones","chino","portugues","ruso","arabe"], resp:"Idiomas: Hola = Hello (EN), Bonjour (FR), Hallo (DE), こんにちは (JA), 你好 (ZH), Olá (PT), Привет (RU), مرحبا (AR) - Todos los idiomas mas arriba" },
  // ECUACIONES UNIVERSALES
  ecuaciones: {
    kws:["ecuacion","formula","teoria"],
    mapa:{
      "pitagoras":"a²+b²=c²",
      "segundo grado":"x=[-b±√(b²-4ac)]/2a",
      "euler":"e^(iπ)+1=0",
      "newton":"F=m·a",
      "einstein":"E=m·c²",
      "ohm":"V=I·R",
      "schrodinger":"iħ∂ψ/∂t=Ĥψ",
      "maxwell":"∇·E=ρ/ε₀, ∇·B=0, ∇×E=-∂B/∂t, ∇×B=μ₀J+μ₀ε₀∂E/∂t",
      "big bang":"Universo 13.8B años, expansión Hubble v=H₀d",
      "evolucion":"Selección natural Darwin"
    }
  }
};

function detectarNivel(texto){
  const l=texto.toLowerCase();
  for(const nivel in SISTEMA_EDUCATIVO_BF){
    if(nivel==="universidad"){
      for(const sub in SISTEMA_EDUCATIVO_BF.universidad){
        for(const kw of SISTEMA_EDUCATIVO_BF.universidad[sub].kws) if(l.includes(kw)) return SISTEMA_EDUCATIVO_BF.universidad[sub].resp;
      }
    } else if(nivel==="ecuaciones"){
      for(const k in SISTEMA_EDUCATIVO_BF.ecuaciones.mapa) if(l.includes(k)) return SISTEMA_EDUCATIVO_BF.ecuaciones.mapa[k];
    } else {
      const data=SISTEMA_EDUCATIVO_BF[nivel];
      if(data.kws) for(const kw of data.kws) if(l.includes(kw)) return data.resp;
    }
  }
  return null;
}

export async function buscarInternetReal(q){
  try{
    const kw=q.toLowerCase().replace(/que es|explica|resuelve|ecuacion|teoria|traduce/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    if(!kw) return "";
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v4.0"}, signal:AbortSignal.timeout(3500)});
    if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,400);}
  }catch{} return "";
}

export async function responderConBotPropio(botId, prompt){
  const l=prompt.toLowerCase();
  if(l.includes("quien eres")) return botId==="BF-LIDER"? "LIDER BF - Sistema educativo completo preescolar a doctorado" : "SUPREMO BF-9 - Todo el conocimiento mas arriba";

  const alg=resolverAlgebra(prompt); if(alg) return alg;
  const calc=calcularBF(prompt); if(calc) return `${calc.expr} = ${calc.res}`;

  const nivel=detectarNivel(prompt);
  if(nivel) return botId==="BF-LIDER"? nivel.slice(0,350) : nivel.slice(0,400);

  const web=await buscarInternetReal(prompt);
  if(web) return web.slice(0,400);

  return botId==="BF-LIDER"? `${prompt.slice(0,90)}: explicado directo preescolar a doctorado.` : `${prompt.slice(0,90)}: análisis desde básico hasta doctorado.`;
}
