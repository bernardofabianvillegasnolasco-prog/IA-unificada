export const MIS_BOTS = { "BF-LIDER": { nombre:"LIDER BF" }, "BF-SUPREMO": { nombre:"SUPREMO BF-9" } };

function calcular(t){
  const l=t.toLowerCase();
  let m=l.match(/(?:raiz cuadrada de|raíz cuadrada de|raiz de|raíz de|sqrt|√)\s*\(?(-?\d+(\.\d+)?)\)?/i);
  if(m){
    const n=parseFloat(m[1]);
    if(n<0){ const r=Math.sqrt(Math.abs(n)); return {expr:`√${n}`, res:`${r}i (número imaginario, porque √-1 = i)`, fluido:`La raíz cuadrada de ${n} es ${r}i. Es un número imaginario porque no existe un número real que al multiplicarse por sí mismo dé negativo.`};}
    const r=Math.sqrt(n);
    const res = Number.isInteger(r)? r : r.toFixed(4);
    return {expr:`√${n}`, res, fluido:`La raíz cuadrada de ${n} es ${res}. Esto significa que ${res} × ${res} = ${n} aproximadamente. Es el número que multiplicado por sí mismo te da ${n}.`};
  }
  const mt=t.match(/(\d+(\.\d+)?\s*[\+\-\*\/\%\^x]\s*\d+(\.\d+)?)+/i);
  if(mt){try{let e=mt[0].replace(/x/gi,'*').replace(/\^/g,'**').replace(/[^0-9+\-*/().% *]/g,''); if(/^[0-9+\-*/().% *]+$/.test(e)){const r=Function(`"use strict"; return (${e})`)(); if(isFinite(r)) return {expr:mt[0], res:r, fluido:`El resultado de ${mt[0]} es ${r}.`};}}catch{}}
  return null;
}
function algebra(t){const l=t.toLowerCase().replace(/\s+/g,''); try{let m=l.match(/^(-?\d*\.?\d*)x([\+\-]\d+\.?\d*)?=(-?\d+\.?\d*)$/); if(m){let a=m[1]; if(a===''||a==='+')a=1;else if(a==='-')a=-1;else a=parseFloat(a); let b=m[2]?parseFloat(m[2]):0; let c=parseFloat(m[3]); const res=(c-b)/a; return `Para ${t}, despejamos x: x = (${c} - ${b}) / ${a} = ${res}. Entonces x vale ${res}.`;}}catch{} return null;}

const FLUIDO = {
  albanileria: (q) => `🧱 Cómo pegar un ladrillo (tabique) - Paso a paso fácil:

1. **Prepara todo:** Hilo, plomada, nivel, cuchara de albañil, botes, cemento y arena.

2. **Traza derecho:** Pon dos estacas, amarra hilo bien tenso. Usa la escuadra 3-4-5: marca 60cm de un lado, 80cm del otro, la diagonal debe medir 100cm. Así queda a 90°.

3. **Haz la mezcla:** 1 bote de cemento por 4 de arena. Mezcla en seco primero, luego agrega agua poco a poco hasta que quede pastosa, no aguada. Si la volteas, no debe escurrir.

4. **Moja el tabique:** Sumerge los tabiques en agua 10 minutos. Si está seco, chupa el agua del mortero y no pega.

5. **Pega:**
   - Pon una cama de mezcla de 1.5cm sobre la base.
   - Asienta el tabique y dale golpecitos con el mango de la cuchara hasta nivelarlo.
   - Deja 1cm de junta vertical entre tabiques.

6. **Amarra:** Cada hilada (fila) va cuatrapeada, o sea, el tabique de arriba queda a la mitad del de abajo. Así el muro no se cae. Cada 3 metros pon un castillo (4 varillas de 3/8).

7. **Cuánto necesitas:** Para 1 metro cuadrado necesitas 25 tabiques de 7x14x28, medio bote de cemento y 2 botes de arena.

¿Quieres que te calcule cuántos tabiques para tu muro? Dime los metros.`,

  diccionario: async (palabra, idioma) => {
    const dicc = {
      "hola": { en:"hello", fr:"bonjour", de:"hallo", it:"ciao", pt:"olá", ja:"こんにちは", zh:"你好" },
      "ladrillo": { en:"brick", fr:"brique", de:"Ziegel", it:"mattone", pt:"tijolo", ja:"レンガ", zh:"砖" },
      "tabique": { en:"brick / partition wall", fr:"cloison", de:"Ziegelwand", it:"tramezzo", pt:"tabique", ja:"レンガ" },
      "gracias": { en:"thank you", fr:"merci", de:"danke", it:"grazie", pt:"obrigado", ja:"ありがとう" }
    };
    const p = palabra.toLowerCase();
    if(dicc[p]){
      const todos = Object.entries(dicc[p]).map(([k,v])=> `• En ${k.toUpperCase()}: ${v}`).join("\n");
      return `📚 La palabra "${palabra}" se dice así en otros idiomas:\n${todos}\n\nEjemplo: Si quieres decir "${palabra}" en inglés, dices "${dicc[p].en}".`;
    }
    try{
      const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(p)}&langpair=es|en`, {signal:AbortSignal.timeout(2500)});
      if(r.ok){ const j=await r.json(); if(j?.responseData?.translatedText) return `📚 "${palabra}" en inglés se dice "${j.responseData.translatedText}". ¿En qué otro idioma lo quieres?`; }
    }catch{}
    return `📚 "${palabra}" - No la tengo en mi diccionario local, pero puedo traducirla. ¿A qué idioma?`;
  }
};

function detectarFluido(t){
  const l=t.toLowerCase().replace(/[()]/g," ");
  if(l.includes("ladrillo")||l.includes("tabique")||l.includes("pegar")||l.includes("albañil")||l.includes("muro")) return FLUIDO.albanileria(t);
  if(l.includes("agricultura")||l.includes("cultivo")||l.includes("siembra")) return "🌾 Agricultura explicada fácil:\nLa agricultura es cultivar la tierra. Necesitas: suelo con pH entre 6 y 7 (ni ácido ni básico), abono NPK (Nitrógeno para hojas, Fósforo para raíz, Potasio para fruto), agua 5 litros por metro cuadrado al día con riego por goteo para no desperdiciar. Ejemplo: el maíz produce 8 toneladas por hectárea si lo cuidas bien.";
  if(l.includes("ganaderia")||l.includes("ganado")) return "🐄 Ganadería fácil:\nEs criar animales para leche o carne. Una vaca pesa 450kg, razas como Angus dan buena carne. Come 2.5% de su peso al día (unos 11kg). Si es lechera, da 25 litros diarios. Se usa inseminación artificial y pastoreo rotacional para que el pasto se recupere.";
  if(l.includes("balistica")) return "🔫 Balística fácil:\nEs el estudio de cómo viaja una bala. Tiene 3 partes: interior (dentro del arma), exterior (en el aire) y efecto (cuando pega). La bala cae por gravedad, por eso la trayectoria es curva: y = x·tanθ - g·x²/(2·v²·cos²θ). Una 9mm va a 350 m/s, una 7.62 a 800 m/s.";
  if(l.includes("astrologia")||l.includes("zodiaco")) return "♈ Astrología fácil:\nSon 12 signos según tu fecha de nacimiento. Cada uno tiene elemento: Aries (21 mar - 19 abr) es fuego y es líder, Tauro es tierra y es tranquilo, Géminis es aire y es curioso, Cáncer es agua y es emocional. Tu carta astral usa planetas y casas para decir tu personalidad.";
  return null;
}

export async function buscarInternetReal(q){
  try{
    const kw=q.toLowerCase().replace(/como|que es|explica|como pegar/g,"").trim().split(" ").filter(w=>w.length>2).slice(0,3).join(" ");
    if(!kw) return "";
    const r=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, {headers:{"User-Agent":"BF-v9-FLUIDO"}, signal:AbortSignal.timeout(3000)});
    if(r.ok){const j=await r.json(); if(j?.extract) return j.extract.slice(0,600);}
  }catch{} return "";
}

export async function responderConBotPropio(botId, prompt){
  const calc=calcular(prompt); if(calc) return calc.fluido || `${calc.expr} = ${calc.res}`;
  const alg=algebra(prompt); if(alg) return alg;

  if(prompt.toLowerCase().match(/traduce|diccionario|como se dice/)){
    let m=prompt.toLowerCase().match(/(?:traduce|diccionario|como se dice)\s+["']?([a-záéíóúñ]+)/i);
    if(m){ const res=await FLUIDO.diccionario(m[1]); if(res) return res; }
  }

  const det=detectarFluido(prompt); if(det) return det;

  const web=await buscarInternetReal(prompt);
  if(web) return `Te explico de forma sencilla:\n${web}\n\n¿Quieres que lo explique más simple o más técnico?`;

  return `Entiendo que preguntas por "${prompt}". Te explico de forma clara y directa, paso a paso, sin tecnicismos complicados. ¿Me dices un poco más para explicártelo mejor?`;
}
