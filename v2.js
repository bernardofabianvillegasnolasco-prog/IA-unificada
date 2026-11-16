
// SOLO DALIA - Todo por /api/voz, nada de navegador
let audioSoloDalia = null;
async function hablarSoloDalia(texto){
  try{
    if(!texto) return;
    // Limpieza final por si se cuela un símbolo
    let limpio = limpiarParaVoz ? limpiarParaVoz(texto) : texto;
    if(audioSoloDalia){ audioSoloDalia.pause(); }
    const r = await fetch('/api/cerebro?voz=1', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({accion:"voz", texto: limpio})
    });
    if(!r.ok) throw new Error('Error voz');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    audioSoloDalia = new Audio(url);
    audioSoloDalia.playbackRate = 1.25;
    await audioSoloDalia.play();
  }catch(e){ console.log('Error Dalia, reintentando...', e); }
}
window.hablar = hablarSoloDalia;
window.hablarDalia = hablarSoloDalia;
window.hablarSoloDalia = hablarSoloDalia;
console.log('SOLO DALIA activo ✅ - speechSynthesis apagado');
