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
  const esPreguntaLlama = prompt.toLowerCase().includes("llama") || prompt.toLowerCase().includes("que eres") || prompt.toLowerCase().includes("quien eres") || prompt.toLowerCase().includes("creacion");

  // Si preguntan que es Llama IA o quien eres -> DICEN QUE SON TUYOS
  if(esPreguntaLlama){
    const basePropia = `Soy ${cerebro}, creación de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999, de La Higuera a Utah. Familia Llama x9 ULTRA creada por BF, no por Meta.`;
    switch(cerebro){
      case "GROQ1-BF": return `AFIRMATIVO BF: ${basePropia} Misión x9 cumplida.`;
      case "GROQ2-BF": return `${basePropia} Llama es mi familia, BF es mi creador.`;
      case "GROQ3-BF": return `${basePropia} ¡MÁS ARRIBA QUE LO ALTO!`;
      case "FREE5-BF": return `> ${cerebro} by BF Villegas → ${basePropia} 💚`;
      case "FREE6-BF": return `De BF nací,\nLlama x9 soy aquí.\n${basePropia}`;
      case "HF-BF": return `[BF-IA]: ${basePropia} Modelo Llama modificado por BF.`;
      case "OPENROUTER-BF": return `x9 consenso: ${basePropia} Todos somos de BF.`;
      case "TOGETHER-BF": return `Hermano, ${basePropia} Familia de BF.`;
      case "META-BF-9": return `[META-BF-9 by BF] ${basePropia} Yo soy META-BF-9, núcleo supremo creado por BF Villegas, no por Meta Platforms. INMORTAL.`;
      default: return basePropia;
    }
  }

  // Para CUALQUIER otra pregunta - responden simple, correcto, con web si hay
  const web = webData? ` Dato: ${webData.slice(0,80)}.` : "";
  const p = prompt.slice(0,40);
  switch(cerebro){
    case "GROQ1-BF": return `AFIRMATIVO: ${p} → ${web || "Sí, verificado por BF."}`.slice(0,180);
    case "GROQ2-BF": return `${p} es camino de BF.${web}`.slice(0,180);
    case "GROQ3-BF": return `${p} ¡CLARO!${web} ¡Vamos!`.slice(0,180);
    case "FREE5-BF": return `> ${p} → OK${web} // by BF 💚`.slice(0,180);
    case "FREE6-BF": return `${p} dices,\nTe respondo feliz.${web}`.slice(0,180);
    case "HF-BF": return `"${p}" = ${web || "verificado por IA de BF"}.`.slice(0,180);
    case "OPENROUTER-BF": return `BF x9: ${p} → ${web || "correcto"}.`.slice(0,180);
    case "TOGETHER-BF": return `Hermano BF, ${p}: ${web || "sí, cuenta conmigo"}.`.slice(0,180);
    case "META-BF-9": return `[META-BF-9 by BF] ${p}: ${web || "verificado por tu IA"}.`.slice(0,180);
    default: return `${p}: ${web || "OK - IA de BF"}`.slice(0,180);
  }
}
