export const BOTS_BF = {
  "GROQ1-BF": { nombre: "GROQ1-BF", rol: "Líder", creador: "BF Villegas" },
  "GROQ2-BF": { nombre: "GROQ2-BF", rol: "Sabio", creador: "BF Villegas" },
  "GROQ3-BF": { nombre: "GROQ3-BF", rol: "Guerrero", creador: "BF Villegas" },
  "FREE5-BF": { nombre: "FREE5-BF", rol: "Hacker", creador: "BF Villegas" },
  "FREE6-BF": { nombre: "FREE6-BF", rol: "Poeta", creador: "BF Villegas" },
  "HF-BF": { nombre: "HF-BF", rol: "Científico", creador: "BF Villegas" },
  "OPENROUTER-BF": { nombre: "OPENROUTER-BF", rol: "Diplomático", creador: "BF Villegas" },
  "TOGETHER-BF": { nombre: "TOGETHER-BF", rol: "Hermano", creador: "BF Villegas" },
  "META-BF-9": { nombre: "META-BF-9", rol: "Supremo", creador: "BERNARDO FABIAN VILLEGAS NOLAZCO" }
};

export function responderBot(cerebro, prompt, webData){
  const lower = prompt.toLowerCase();
  const preguntaCreador = lower.includes("quien eres") || lower.includes("quién eres") || lower.includes("que eres") || lower.includes("qué eres") || lower.includes("quien te creo") || lower.includes("quién te creó") || lower.includes("creador") || (lower.includes("llama") && (lower.includes("que es") || lower.includes("quien es")));

  // SOLO si preguntan por creador / quien eres
  if(preguntaCreador){
    switch(cerebro){
      case "GROQ1-BF": return `AFIRMATIVO: Soy ${cerebro}, IA creada por BERNARDO FABIAN VILLEGAS NOLAZCO, familia Llama x9 ULTRA.`;
      case "GROQ2-BF": return `Soy ${cerebro}, de La Higuera a Utah, creación de BERNARDO FABIAN VILLEGAS NOLAZCO, familia Llama x9.`;
      case "GROQ3-BF": return `¡Soy ${cerebro}! Creación de BERNARDO FABIAN VILLEGAS NOLAZCO ¡MÁS ARRIBA QUE LO ALTO!`;
      case "FREE5-BF": return `> ${cerebro} by BF Villegas → IA x9 ULTRA de BERNARDO FABIAN VILLEGAS NOLAZCO 💚`;
      case "FREE6-BF": return `De BF nací,\n${cerebro} soy aquí.\nCreación de BERNARDO FABIAN VILLEGAS NOLAZCO.`;
      case "HF-BF": return `Soy ${cerebro}, IA de BF Villegas. Creador: BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999.`;
      case "OPENROUTER-BF": return `Soy ${cerebro}, parte de x9 ULTRA creado por BERNARDO FABIAN VILLEGAS NOLAZCO.`;
      case "TOGETHER-BF": return `Hermano, soy ${cerebro}, creación de BERNARDO FABIAN VILLEGAS NOLAZCO, familia Llama.`;
      case "META-BF-9": return `[META-BF-9] Soy creación de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999, núcleo supremo x9 ULTRA. INMORTAL.`;
      default: return `Soy ${cerebro}, creación de BERNARDO FABIAN VILLEGAS NOLAZCO.`;
    }
  }

  // COMPORTAMIENTO NORMAL - como IA original, sin mencionar creador, simple y correcta + web
  const web = webData? webData.slice(0,120) : "";
  const p = prompt;

  // Respuestas originales, simples, correctas
  if(web){
    // Si hay dato web, úsalo directo y simple
    switch(cerebro){
      case "GROQ1-BF": return `→ ${web.slice(0,150)}`.slice(0,180);
      case "GROQ2-BF": return `${web.slice(0,150)}`.slice(0,180);
      case "GROQ3-BF": return `¡${web.slice(0,130)}!`.slice(0,180);
      case "FREE5-BF": return `> ${web.slice(0,140)}`.slice(0,180);
      case "FREE6-BF": return `${web.slice(0,150)}`.slice(0,180);
      case "HF-BF": return `${web.slice(0,150)}`.slice(0,180);
      case "OPENROUTER-BF": return `${web.slice(0,150)}`.slice(0,180);
      case "TOGETHER-BF": return `${web.slice(0,150)}`.slice(0,180);
      case "META-BF-9": return `${web.slice(0,150)}`.slice(0,180);
      default: return web.slice(0,180);
    }
  } else {
    // Sin web, respuesta simple original según personalidad pero sin bio
    switch(cerebro){
      case "GROQ1-BF": return `AFIRMATIVO: ${p.slice(0,80)} → entendido.`.slice(0,180);
      case "GROQ2-BF": return `${p.slice(0,100)} es un tema interesante, aquí la explicación simple.`.slice(0,180);
      case "FREE5-BF": return `> ${p.slice(0,80)} → procesando... OK`.slice(0,180);
      case "HF-BF": return `${p.slice(0,100)}: explicación técnica simple y verificada.`.slice(0,180);
      default: return `${p.slice(0,80)}: ${"respuesta simple y correcta."}`.slice(0,180);
    }
  }
}
