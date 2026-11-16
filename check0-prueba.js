function actualizarReloj(){const a=new Date();document.getElementById('fecha').textContent=`${String(a.getDate()).padStart(2,'0')}/${String(a.getMonth()+1).padStart(2,'0')}/${a.getFullYear()}`;const _h=a.getHours();const _ampm=_h>=12?'PM':'AM';const _h12=_h%12||12;document.getElementById('hora').textContent=`${String(_h12).padStart(2,'0')}:${String(a.getMinutes()).padStart(2,'0')}:${String(a.getSeconds()).padStart(2,'0')} ${_ampm}`;}
setInterval(actualizarReloj,1000);actualizarReloj();
const btnAjustes=document.getElementById('btnAjustes'),panel=document.getElementById('panelAjustes');
btnAjustes.onclick=()=>panel.classList.toggle('show');
document.getElementById('optCerrar').onclick=()=>panel.classList.remove('show');
let historial=JSON.parse(localStorage.getItem('bf_v4_hist')||'[]');
let perfilBF=JSON.parse(localStorage.getItem('bf_perfil')||'{}');
function guardarPerfil(){localStorage.setItem('bf_perfil', JSON.stringify(perfilBF));}
function actualizarPerfilDesdeTexto(texto){ const low=texto.toLowerCase(); let cambio=false; const m1=texto.match(/me llamo|mi nombre es\s+([A-Za-zÁÉÍÓÚáéíóú]+)/i); if(m1){perfilBF.nombre=m1[1]; cambio=true;} const m2=texto.match(/me gusta (la |el |los )?(.+)/i); if(m2){perfilBF.gustos=[...(perfilBF.gustos||[]), m2[2].trim()].slice(-10); cambio=true;} if(/estoy triste|me siento mal/i.test(low)){perfilBF.estado='triste'; cambio=true;} if(/estoy feliz|estoy bien/i.test(low)){perfilBF.estado='feliz'; cambio=true;} if(cambio) guardarPerfil(); }
let vozActiva=localStorage.getItem('bf_voz')!=='off';
let voces=[];function cargarVoces(){voces=[];}speechSynthesis.onvoiceschanged=cargarVoces;cargarVoces();setTimeout(cargarVoces,500);
function limpiarParaVoz(t){if(!t) return t; let s=String(t); s=s.split('*').join(' ').split('#').join(' ').split('_').join(' ').split('`').join(' '); let malas=['asterisco','asteriscos','guion','guiones','slash','diagonal','barra','parentesis','paréntesis','corchete','llave','comillas','numeral','almohadilla','arroba','porcentaje','ampersand']; let palabras=s.split(' '); palabras=palabras.filter(function(w){return malas.indexOf(w.toLowerCase())===-1;}); s=palabras.join(' '); s=s.split(/\s+/).join(' ').trim(); return s;}
function hablar(t){
  if(!vozActiva) return;
  // speechSynthesis apagado; // speechSynthesis apagado;
  let limpio = limpiarParaVoz(t).slice(0,1800);
  if(!limpio) return;
  const esEmocion = /(te quiero|me encanta|qué bonito|increíble|genial|amor|hermoso|guapo|preciosa|compa)/i.test(limpio);
  const esCoqueta = /(hermoso|guapo|preciosa|te quiero|te extraño|compa|qué rollo|a la bestia)/i.test(limpio);
  const esTriste = /(triste|solo|difícil|ánimo|te escucho)/i.test(limpio);
  const partes = limpio.replace(/,/g, ',|').replace(/\. /g, '.|').replace(/\? /g, '?|').replace(/! /g, '!|').split('|').filter(s=>s.trim().length>1);
  const mejorVoz = voces.find(x=>x.lang==='es-MX' && x.name.includes('Google')) || voces.find(x=>x.name.includes('Sabina')) || voces.find(x=>x.name.includes('Dalia')) || voces.find(x=>x.name.includes('Raul')) || voces.find(x=>x.name.includes('Raúl')) || voces.find(x=>x.name.includes('México')) || voces.find(x=>x.name.includes('Mexico')) || voces.find(x=>x.lang==='es-MX') || voces.find(x=>x.lang.includes('es-MX')) || voces.find(x=>x.lang.includes('es-US')) || voces.find(x=>x.lang.includes('es')) || voces[0];
  partes.forEach((fraseRaw, i)=>{
    const frase = fraseRaw.trim();
    if(!frase) return;
    const u = new SpeechSynthesisUtterance(frase);
    if(mejorVoz){ u.voice = mejorVoz; u.lang = 'es-MX'; } else { u.lang = 'es-MX'; }
    u.volume = 1;
    if(frase.includes('?')){ u.pitch = 1.05; u.rate = 1.18; }
    else if(frase.includes('!') || esEmocion || esCoqueta){ u.pitch = 1.12; u.rate = 0.98; }
    else if(esTriste){ u.pitch = 0.98; u.rate = 1.05; }
    else if(i===0){ u.pitch = 1.03; u.rate = 1.18; }
    else { u.pitch = 1.0; u.rate = 1.18; }
    // SOLO DALIA - speechSynthesis apagado;
  });
}
const chatEl=document.getElementById('chat'),promptEl=document.getElementById('prompt'),btnEl=document.getElementById('btnResponder'),btnMic=document.getElementById('btnMic'),optVoz=document.getElementById('optVoz');
function actualizarVozUI(){optVoz.textContent=vozActiva?'🔊 Voz: ON':'🔇 Voz: OFF';}actualizarVozUI();
function renderActual(u,a){chatEl.innerHTML='';if(u){const d=document.createElement('div');d.className='msg user';d.textContent=u;chatEl.appendChild(d);}if(a){const d=document.createElement('div');d.className='msg ai';d.textContent=a;chatEl.appendChild(d);}}
async function responder(){ actualizarPerfilDesdeTexto(promptEl.value);
 const p=promptEl.value.trim();if(!p)return;
 chatEl.innerHTML='<div class="msg user">'+p+'</div><div class="msg ai" style="opacity:0.6">🧠 Pensando...</div>';
 btnEl.textContent='PENSANDO...';
 historial.push({role:'user',content:p});if(historial.length>100)historial=historial.slice(-100);localStorage.setItem('bf_v4_hist',JSON.stringify(historial));
 promptEl.value='';
 try{
  const r=await fetch('/api/cerebro',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({perfil: perfilBF, prompt:p,historial:historial.slice(-100)})});
  const j=await r.json();historial.push({role:'assistant',content:j.text});if(historial.length>100)historial=historial.slice(-100);localStorage.setItem('bf_v4_hist',JSON.stringify(historial));
  renderActual(p,j.text);hablar(j.text);
 }catch(e){renderActual(p,'Error:'+e.message);}
 btnEl.textContent='RESPONDER';
}
btnEl.onclick=()=>{// speechSynthesis apagado;responder();};
promptEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();// speechSynthesis apagado;responder();}});
optVoz.onclick=()=>{vozActiva=!vozActiva;localStorage.setItem('bf_voz',vozActiva?'on':'off');actualizarVozUI();if(vozActiva)hablar('Voz activada');else // speechSynthesis apagado;};
document.getElementById('optTest').onclick=()=>{vozActiva=true;localStorage.setItem('bf_voz','on');actualizarVozUI();cargarVoces();hablar('Qué onda, soy tu BF. Ya hablo más rápido y más real. ¿Me escuchas bien?');};
document.getElementById('optBorrar').onclick=()=>{if(confirm('¿Borrar memoria?')){historial=[];localStorage.removeItem('bf_v4_hist');chatEl.innerHTML='';panel.classList.remove('show');}};
let rec=null;btnMic.onclick=()=>{// speechSynthesis apagado;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert('Usa Chrome');return;}if(rec&&rec._on){rec.stop();return;}rec=new SR();rec.lang='es-MX';rec._on=true;rec.onstart=()=>{btnMic.textContent='🎙️ ESCUCHANDO...';};rec.onend=()=>{btnMic.textContent='🎤 HABLAR';rec._on=false;};rec.onresult=(e)=>{promptEl.value=e.results[0][0].transcript;responder();};rec.start();};
document.body.addEventListener('click',()=>{// speechSynthesis apagado;},{once:true});

// ===== TODO 3 - RUTINAS + AVATAR + EXTRAS BF =====
function rutinaBF(){
  let hora = new Date().getHours();
  let msg = "";
  if(hora>=5 && hora<12) msg = "Buenos días, compa. Ya amaneció en Phoenix. Hoy se fluye, sin estrés. ¿Qué vamos a hacer hoy?";
  else if(hora>=12 && hora<19) msg = "Qué onda, ya es tarde. ¿Cómo va tu día? Aquí andamos, bien real, fluyendo.";
  else if(hora>=19 && hora<23) msg = "Buenas noches. Ya estuvo el día. Descansa, mañana le seguimos con todo. ¿Qué tal te fue hoy?";
  else msg = "Ya es de madrugada, ¿por qué no duermes? Aquí estoy, cuéntame qué te quita el sueño.";
  document.getElementById('panelExtra').style.display='block';
  document.getElementById('panelExtra').innerHTML = '<b>🌅 RUTINA BF</b><br>'+msg;
  try{ hablar(msg); }catch(e){}
  return msg;
}
function avatarHabla(on){
  let cara = document.getElementById('caraBF');
  let est = document.getElementById('estadoBF');
  if(!cara) return;
  if(on){ cara.textContent='😮'; cara.style.transform='scale(1.12)'; if(est) est.textContent='BF hablando...'; }
  else { cara.textContent='🙂'; cara.style.transform='scale(1)'; if(est) est.textContent='BF lista'; }
}
// Envolvemos hablar original para que avatar reaccione
if(typeof hablarOriginalBF === 'undefined' && typeof hablar === 'function'){
  var hablarOriginalBF = hablar;
  hablar = function(texto){
    avatarHabla(true);
    try{ hablarOriginalBF(texto); }catch(e){ console.log(e); }
    setTimeout(()=>avatarHabla(false), 2500 + (texto||'').length*35);
  };
}

async function climaBF(){
  let p = document.getElementById('panelExtra'); p.style.display='block'; p.innerHTML='Buscando tu ubicación... 📍<br>Permite la ubicación para darte tu clima real.';
  function pintarClima(lat, lon, nombre){
    return (async ()=>{
      try{
        let r = await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit');
        let d = await r.json(); let c = d.current;
        let desc = c.weather_code==0?'Despejado ☀️':c.weather_code<=3?'Nublado 🌤️':c.weather_code>=51?'Lluvia 🌧️':'Nublado';
        p.innerHTML = '<b>🌤️ CLIMA EN '+nombre.toUpperCase()+'</b><br>Temp: '+c.temperature_2m+'°F<br>Humedad: '+c.relative_humidity_2m+'%<br>Clima: '+desc+'<br>Viento: '+c.wind_speed_10m+' mph<br><br>BF: Está bueno para fluir, compa.';
        try{ hablar('En '+nombre+' andamos a '+Math.round(c.temperature_2m)+' grados. Está bueno para fluir.'); }catch(e){}
      }catch(e){ p.innerHTML='No pude cargar el clima, compa. Checa tu internet.'; }
    })();
  }
  async function nombreLugar(lat, lon){
    try{
      let r = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=es');
      let d = await r.json();
      return d.city || d.locality || d.principalSubdivision || 'Tu ubicación';
    }catch(e){ return 'Tu ubicación'; }
  }
  // Si el navegador tiene ubicación, la usamos
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      let lat = pos.coords.latitude;
      let lon = pos.coords.longitude;
      let nombre = await nombreLugar(lat, lon);
      pintarClima(lat, lon, nombre);
    }, async ()=>{
      // Si no da permiso, cae a Phoenix
      p.innerHTML = 'No me diste ubicación, te pongo Phoenix por mientras 📍';
      setTimeout(()=>pintarClima(33.4484, -112.0740, 'Phoenix'), 800);
    }, {timeout: 8000});
  } else {
    pintarClima(33.4484, -112.0740, 'Phoenix');
  }
}

function musicaBF(){
  let p = document.getElementById('panelExtra'); p.style.display='block';
  p.innerHTML = '<b>🎵 MÚSICA BF</b><br>Tu flow de hoy:<br><br>1. INGOBERNABLE VOL.4 - BF Villegas<br>2. Boombap real - pa fluir<br>3. Underground - todo terreno<br><br><button onclick="hablar(\'Vamos a poner un beat y a fluir, bien real.\')">▶️ Poner flow</button> &nbsp; <a href="https://open.spotify.com/search/BF%20Villegas" target="_blank" style="color:#0f0">Abrir en 【entity-Spotify¦canonical_name=Spotify】 ↗</a>';
}
function notasBF(){
  let p = document.getElementById('panelExtra'); p.style.display='block';
  let notas = localStorage.getItem('bf_notas')||'';
  p.innerHTML = '<b>📝 TUS NOTAS</b><br><textarea id="txtNotas" style="width:100%;height:80px;background:#000;color:#0f0;border:1px solid #0f0">'+notas+'</textarea><br><button onclick="localStorage.setItem(\'bf_notas\',document.getElementById(\'txtNotas\').value);alert(\'Nota guardada ✅\')">💾 Guardar</button>';
}
function juegoBF(){
  let p = document.getElementById('panelExtra'); p.style.display='block';
  let num = Math.floor(Math.random()*10)+1;
  window._numBF = num;
  p.innerHTML = '<b>🎮 ADIVINA EL NÚMERO 1-10</b><br>Ya pensé un número, compa. ¿Cuál es?<br><input id="numBF" type="number" style="background:#000;color:#0f0;border:1px solid #0f0;padding:5px;width:70px"> <button onclick="let v=parseInt(document.getElementById(\'numBF\').value);if(v===window._numBF){alert(\'¡A huevo! Le atinaste, bien feroz 🔥\');hablar(\'A huevo, le atinaste, bien feroz.\')}else if(v<window._numBF){alert(\'Más arriba, compa.\')}else{alert(\'Más abajo, compa.\')}">Adivinar</button>';
}
document.addEventListener('DOMContentLoaded', ()=>{
  let b1=document.getElementById('btnRutina'); if(b1) b1.onclick=rutinaBF;
  let b2=document.getElementById('btnClima'); if(b2) b2.onclick=climaBF;
  let b3=document.getElementById('btnMusica'); if(b3) b3.onclick=musicaBF;
  let b4=document.getElementById('btnNotas'); if(b4) b4.onclick=notasBF;
  let b5=document.getElementById('btnJuego'); if(b5) b5.onclick=juegoBF;
  // Rutina automática al entrar
  // rutina automática apagada - bloque oculto
});


// ===== VOZ DALIA - es-MX-DaliaNeural =====
const VOCES_DALIA = {
  "prueba": "voces/prueba.mp3",
  "buenos": "voces/buenos_dias.mp3",
  "noches": "voces/buenas_noches.mp3",
  "fluyendo": "voces/fluyendo.mp3",
  "entiendo": "voces/te_entiendo.mp3"
};
let audioDalia = null;
function hablarDalia(texto){
  // Si es una frase que ya tenemos grabada, usa el MP3 de Dalia
  let archivo = null;
  let t = (texto||'').toLowerCase();
  if(t.includes('me escuchas bien')) archivo = VOCES_DALIA["prueba"];
  else if(t.includes('buenos días') || t.includes('buenos dias')) archivo = VOCES_DALIA["buenos"];
  else if(t.includes('buenas noches')) archivo = VOCES_DALIA["noches"];
  else if(t.includes('fluyendo')) archivo = VOCES_DALIA["fluyendo"];
  else if(t.includes('te entiendo')) archivo = VOCES_DALIA["entiendo"];

  // Avatar reacciona
  try{ avatarHabla(true); }catch(e){}
  if(archivo){
    if(audioDalia) audioDalia.pause();
    audioDalia = new Audio(archivo);
    audioDalia.playbackRate = 1.0;
    audioDalia.play().catch(()=>{});
    audioDalia.onended = ()=>{ try{ avatarHabla(false); }catch(e){} };
    return true;
  }
  // Si no es frase fija, usa la voz del navegador pero con estilo Dalia: rápida y real
  try{
    let u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX'; u.rate = 1.18; u.pitch = 1.0; u.volume = 1;
    // Busca voz mexicana si hay
    let voces = [];
    let mx = voces.find(v=>v.lang.includes('es-MX') && v.name.toLowerCase().includes('female')) || voces.find(v=>v.lang.includes('es-MX')) || voces.find(v=>v.lang.includes('es'));
    if(mx) u.voice = mx;
    u.onend = ()=>{ try{ avatarHabla(false); }catch(e){} };
    // SOLO DALIA - speechSynthesis apagado
  }catch(e){}
  return false;
}
// Reemplaza el hablar original por Dalia cuando exista
if(typeof hablar !== 'undefined'){
  var hablarViejoBF = hablar;
  hablar = function(texto){ return hablarDalia(texto); };
}

}
