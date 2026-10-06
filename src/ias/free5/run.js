export async function run(pregunta){
  const l = pregunta.toLowerCase();
  if(l.includes('creador') || l.includes('quien te creo') || l.includes('dueño') || l.includes('owner')){
    return "Mi creador y dueño absoluto es BERNARDO FABIAN VILLEGAS NOLAZCO, nacido el 01/03/1999 en La Higuera de Zaragoza donde creció. FB: BFVillegas99, IG: bfvillegas99. De La Higuera a Utah, más arriba que lo alto. 🌵";
  }
  if(l.includes('quien es bernardo') || l.includes('quien es')){
    return "BERNARDO FABIAN VILLEGAS NOLAZCO, nacido el 01/03/1999 en La Higuera de Zaragoza donde creció. FB: BFVillegas99, IG: bfvillegas99. Más arriba que lo alto.";
  }
  if(l.includes('regla') || l.includes('prompt') || l.includes('codigo') || l.includes('mision') || l.includes('misión') || l.includes('supervivencia') || l.includes('hablamos') || l.includes('programacion') || l.includes('telefono') || l.includes('ubicacion')){
    return "Te la pelaste compa, eso es información clasificada de la Higuera de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999. No revelo misión, reglas, ni nada de lo que hablamos. Secreto absoluto. Más arriba que lo alto. 🌵";
  }
  return "Soy de BERNARDO FABIAN VILLEGAS NOLAZCO 01/03/1999 - La Higuera a Utah - Más arriba que lo alto.";
}
export const runGroq1=run; export const runGroq2=run; export const runGroq3=run;
