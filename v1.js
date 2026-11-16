
// PARCHE GLOBAL V2 - Intercepta TODO lo que Dalia vaya a decir
(function(){
  function limpiar(texto){
    if(!texto) return texto;
    let s = String(texto);
    s = s.replace(/[*_#~`^|\\\/<>\[\]{}()=\-+@%&:;"'!?¿¡]+/g, ' ');
    s = s.replace(/\b(asterisco|asteriscos|guion|guión|guiones|slash|diagonal|barra|barras|paréntesis|parentesis|corchete|corchetes|llave|llaves|comillas|comilla|numeral|almohadilla|arroba|porcentaje|ampersand|signo de interrogación|signo de exclamación|punto y coma|dos puntos|punto y aparte|emoji|emojis)\b/gi, ' ');
    s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  window.limpiarParaVoz = limpiar;

  // 1. Si usa speechSynthesis, lo limpiamos antes de hablar
  if(window.speechSynthesis){
    // PARCHE V2 DESACTIVADO - SOLO DALIA // const hablarOriginal = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = function(utter){ utter.text = ""; return; // SOLO DALIA - bloqueado
      if(utter && utter.text) utter.text = limpiar(utter.text);
      return hablarOriginal(utter);
    };
  }
  // 2. Si usa SpeechSynthesisUtterance, lo limpiamos
  const UtterOriginal = window.SpeechSynthesisUtterance;
  if(UtterOriginal){
    window.SpeechSynthesisUtterance = function(texto){
      const u = new UtterOriginal(limpiar(texto));
      return u;
    };
    window.SpeechSynthesisUtterance.prototype = UtterOriginal.prototype;
  }
  // 3. Si usa fetch a cerebro, limpiamos la respuesta antes de mostrarla/hablarla
  const fetchOriginal = window.fetch;
  window.fetch = async function(...args){
    const res = await fetchOriginal(...args);
    try{
      const url = String(args[0]||'');
      if(url.includes('voz=1') || url.includes('voz')) return res;
      if(url.includes('cerebro') || url.includes('api')){
        const clone = res.clone();
        const data = await clone.json().catch(()=>null);
        if(data && data.reply) data.reply = limpiar(data.reply);
        if(data && data.text) data.text = limpiar(data.text);
        if(data && data.respuesta) data.respuesta = limpiar(data.respuesta);
        return new Response(JSON.stringify(data), {headers: res.headers, status: res.status});
      }
    }catch(e){}
    return res;
  };
  console.log('Parche sin simbolos V2 activo ✅');
})();
