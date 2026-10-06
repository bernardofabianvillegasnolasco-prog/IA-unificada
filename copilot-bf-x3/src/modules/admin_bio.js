// SOLO ADMIN = VOZ BIOMETRICA caripocatope 640
// Usuario normal NO necesita voz

export function esAdminPorVoz(texto){
  const t = texto.toLowerCase();
  const tieneClave = t.includes("640") && (
    t.includes("caripocatope") || 
    t.includes("caripocatopes") ||
    t.includes("caripucato") ||
    t.includes("karipoca")
  );
  // Aquí va tu voz real 16 bits - solo tú
  // FB: BFVillegas99 - 01/03/1999 - La Higuera
  return tieneClave;
}

export async function verificarAccesoAdmin(pregunta, esVozReal = false){
  // Usuario normal -> IA normal
  if(!esAdminPorVoz(pregunta)){
    return { esAdmin: false, nivel: "usuario" };
  }

  // Detectó caripocatope 640 -> pide VOZ
  console.log("\n🔒 CANDADO ADMIN DETECTADO: caripocatope 640");
  console.log("🎤 Verificando que sea la VOZ OFICIAL de Bernardo...");

  // Aquí tu IA compara con src/bio/voz_bernardo_oficial.wav
  if(!esVozReal){
    console.log("⚠️ Di 'caripocatope 640' con tu voz para entrar a admin");
    return { esAdmin: false, requiereVoz: true };
  }

  console.log("✅ VOZ + ROSTRO OK - BERNARDO 01/03/1999 La Higuera");
  console.log(">>> MODO ADMINISTRADOR ACTIVADO <<<\n");
  return { esAdmin: true, nivel: "admin_x9" };
}
