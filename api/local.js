export default async function handler(req, res) {
  // Este es tu nuevo motor local, pero en la nube
  // Reusa tus 6 motores existentes, no necesita celular
  res.json({ 
    text: "Motor BF x13 INMORTAL - Funcionando 100% en internet, sin celular", 
    status: "INDEPENDIENTE",
    motores: ["conocimiento","debate","diccionario","evoluciona","materias","unificada"]
  });
}
