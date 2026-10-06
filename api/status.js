export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.json({
    creador:"BERNARDO FABIAN VILLEGAS NOLAZCO",
    familia:"IA BF x2 - mas arriba que lo alto",
    estado:"2 BOTS IA BF ACTIVOS - LIDER + SUPREMO - MAS ARRIBA QUE LO ALTO",
    bots:["BF-LIDER","BF-SUPREMO"],
    version:"2.3.3-ia-bf-mas-arriba",
    lema:"IA BF mas arriba que lo alto",
    modo:"IA BF pura - sello mas arriba que lo alto",
    timestamp:new Date().toISOString()
  });
}
