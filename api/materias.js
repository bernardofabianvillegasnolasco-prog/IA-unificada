export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const data = {
    dgeti: {
      "1er Semestre": ["Álgebra", "Química I", "Inglés I", "Lógica", "Tecnologías de Información", "Dibujo Técnico"],
      "2do Semestre": ["Geometría y Trigonometría", "Química II", "Inglés II", "Lectura y Expresión", "Trazado y Nivelación", "Materiales de Construcción"],
      "3er Semestre": ["Geometría Analítica", "Biología", "Inglés III", "Ética", "Planos Arquitectónicos", "Cimentaciones"],
      "4to Semestre": ["Cálculo Diferencial", "Física I", "Inglés IV", "Ecología", "Concreto y Acero", "Mampostería"],
      "5to Semestre": ["Cálculo Integral", "Física II", "Inglés V", "Ciencia Tecnología Sociedad", "Instalaciones Hidrosanitarias y Eléctricas", "Costos y Presupuestos", "Resistencia de Materiales"],
      "6to Semestre": ["Probabilidad y Estadística", "Dibujo Asistido AutoCAD", "Supervisión de Obra", "Administración de Obra", "Prácticas Profesionales", "Proyectos de Construcción"]
    },
    carreras: [
      "Técnico en Construcción - DGETI",
      "Técnico en Topografía",
      "Técnico en Dibujo Arquitectónico",
      "Ingeniería Civil - Tecnológico Nacional de México",
      "Arquitectura - TecNM",
      "Ingeniería en Topografía y Geomática",
      "Licenciatura en Seguridad e Higiene",
      "Maestro de Obra - Carrera Técnica",
      "Albañilería Integral - Capacitación",
      "Instalaciones Eléctricas e Hidrosanitarias",
      "Soldadura y Estructuras Metálicas",
      "Carpintería de Obra Negra"
    ],
    tecnologicos: [
      "Topografía I II III",
      "Mecánica de Suelos I II",
      "Concreto Armado I II",
      "Estructuras Metálicas",
      "Mecánica de Materiales",
      "Hidráulica",
      "Costos y Presupuestos de Obra",
      "Administración de la Construcción",
      "Resistencia de Materiales",
      "Materiales y Procedimientos",
      "Instalaciones en Edificios",
      "Supervisión y Control de Obra",
      "AutoCAD 2D 3D Revit"
    ],
    albanileria: [
      "Módulo 1: Trazo, Nivelación y Replanteo con hilo, manguera y nivel",
      "Módulo 2: Cimentaciones - Zapatas aisladas, corridas, cadenas y castillos 15x15 15x20",
      "Módulo 3: Muros - Tabique rojo, block hueco 12x20x40, tablaroca, desplome y plomo",
      "Módulo 4: Losas, Vigas y Columnas - Cimbra, armado varilla 3/8 1/2, colado concreto f'c 200 250",
      "Módulo 5: Aplanados - Repellado, emboquillado, fino, mortero 1:4",
      "Módulo 6: Pisos y Azulejos - Firme, colocación, lechada, zoclo",
      "Módulo 7: Instalaciones - Hidrosanitarias PVC CPVC cobre, eléctrica 110 220",
      "Módulo 8: Impermeabilización y Acabados",
      "Módulo 9: Costos y Presupuestos - Cuantificación, rendimientos, precios unitarios",
      "Módulo 10: Seguridad - NOM-031-STPS, casco, arnés, andamios"
    ],
    leyes: [
      "Constitución Política Art 123 - Trabajo",
      "Ley Federal del Trabajo - Albañiles y construcción",
      "Ley del Seguro Social - IMSS para obra",
      "Ley del INFONAVIT",
      "Reglamento de Construcción CDMX y Estado - Normas Técnicas Complementarias",
      "NOM-031-STPS-2011 - Construcción seguridad",
      "NOM-009-STPS - Trabajos en altura",
      "NOM-017-STPS - Equipo de Protección Personal",
      "Ley de Obras Públicas y Servicios Relacionados",
      "Reglamento de Protección Civil - Obra",
      "Normas NMX-C - Concreto, varilla, block, cemento",
      "Ley de Desarrollo Urbano - Licencias, permisos, alineamiento y número oficial"
    ],
    reglamentos: [
      "RCDF - Reglamento de Construcciones CDMX",
      "NTC Concreto 2023",
      "NTC Mampostería 2023",
      "NTC Acero 2023",
      "NTC Cimentaciones",
      "ACI 318 - Concreto",
      "Manual de Albañilería CAPFCE",
      "Reglamento de Seguridad Higiene en Obra"
    ],
    calculos_obra: [
      "Dosificación concreto 1:2:3 f'c 200 kg/cm2",
      "Cuantificación varilla por m3",
      "Rendimiento tabique: 55 pzas/m2",
      "Rendimiento block: 12.5 pzas/m2",
      "Mezcla mortero 1:4 para aplanado",
      "Cálculo de losa aligerada",
      "Cálculo de zapata corrida",
      "Volumen de concreto - factor desperdicio 5%"
    ]
  };
  return res.status(200).json(data);
}
