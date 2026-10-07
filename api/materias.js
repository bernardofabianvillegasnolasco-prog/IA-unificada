export default function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const data = {
    general: "IA BF UNIVERSAL v29 - TODO EN GENERAL - DGETI + TecNM + Leyes + Medicina + Lógica",
    leyes_generales: {
      constitucion_mx: [
        "Art 1° - Derechos Humanos y garantías",
        "Art 3° - Derecho a la Educación",
        "Art 4° - Salud, vivienda, alimentación",
        "Art 5° - Libertad de trabajo y profesión",
        "Art 14° y 16° - Legalidad y debido proceso",
        "Art 27° - Propiedad de tierras y aguas",
        "Art 123° - Trabajo y seguridad social - Jornada 8h, salario mínimo, aguinaldo, vacaciones, IMSS, INFONAVIT",
        "Art 130° - Separación Iglesia-Estado"
      ],
      leyes_federales: [
        "Ley Federal del Trabajo - 2024: Contrato, jornada, despido, finiquito, vacaciones 12 días mínimo, aguinaldo 15 días, utilidades",
        "Código Penal Federal - Delitos, penas, homicidio, robo, fraude, lesiones",
        "Código Civil Federal - Contratos, propiedad, herencia, matrimonio, divorcio, actas",
        "Ley del Seguro Social - IMSS: Enfermedad, maternidad, invalidez, vejez, guarderías",
        "Ley del INFONAVIT - Vivienda, crédito, puntos, subcuenta",
        "Ley del ISR e IVA - Impuestos 2024",
        "Ley de Amparo - Protección contra actos de autoridad",
        "Ley Federal de Protección al Consumidor - PROFECO",
        "Ley de Tránsito y Vialidad - Reglamento general",
        "Ley General de Salud - Derechos del paciente, consentimiento, recetas",
        "Ley de Protección de Datos Personales",
        "Ley General de Educación"
      ],
      leyes_estatales_hidalgo: [
        "Reglamento de Construcción Hidalgo",
        "Código Civil Hidalgo",
        "Ley de Salud Hidalgo"
      ],
      noms: [
        "NOM-004-SSA3-2012 - Expediente clínico",
        "NOM-019-STPS - Seguridad en obra",
        "NOM-031-STPS - Construcción",
        "NOM-035-STPS - Riesgo psicosocial",
        "NOM-017-STPS - EPP casco, lentes, guantes",
        "NOM-026-STPS - Colores de seguridad"
      ]
    },
    medicina_general: {
      primeros_auxilios: [
        "RCP - Reanimación: 30 compresiones + 2 ventilaciones, 100-120 por minuto, en centro del pecho",
        "Hemorragia: Presión directa 10 min, elevar, torniquete 5-7 cm arriba herida solo si no para, anotar hora",
        "Atragantamiento - Maniobra Heimlich: abrazo por detrás, puño arriba ombligo, compresiones en J",
        "Quemadura: Enfriar con agua 20 min, no pasta, no hielo, cubrir con gasa limpia, NO reventar ampollas",
        "Fractura: No mover, inmovilizar con tabla, hielo indirecto, hospital",
        "Convulsión: Proteger cabeza, NO meter nada en boca, lateral al terminar, tiempo",
        "Desmayo: Acostar, piernas elevadas 30cm, aire",
        "Botiquín: Gasas, vendas, curitas, alcohol, isodine, paracetamol, guantes, tijeras, termómetro"
      ],
      anatomia_basica: ["Cabeza y cuello", "Tórax - corazón, pulmones", "Abdomen - estómago, hígado, intestinos", "Extremidades - huesos, músculos, articulaciones", "Signos vitales: FC 60-100, FR 12-20, TA 120/80, Temp 36.5-37.5, Glucosa 70-110"],
      medicamentos_comunes: ["Paracetamol 500mg - fiebre dolor - cada 6-8h", "Ibuprofeno 400mg - inflamación - con comida", "Omeprazol - gastritis", "Loratadina - alergia", "Suero oral - deshidratación"],
      enfermedades_comunes: ["Diabetes - azúcar alta - sed, orina frecuente", "Hipertensión - presión alta >140/90", "Gripe vs COVID - fiebre tos", "Gastroenteritis - vómito diarrea"]
    },
    logica_filosofia: [
      "Lógica proposicional: Y (∧), O (∨), NO (¬), Si...entonces (→)",
      "Silogismo: Premisa mayor + menor = conclusión - Ej: Todos los albañiles trabajan, Juan es albañil, entonces trabaja",
      "Falacias: Ad hominem (ataca persona), generalización apresurada, falsa causa",
      "Método científico: Observación, hipótesis, experimento, conclusión",
      "Ética: Deontología (deber), utilitarismo (mayor bien), virtudes",
      "Lógica matemática: Tablas de verdad, conjuntos, diagramas de Venn"
    ],
    matematicas_generales: [
      "Aritmética: suma, resta, multiplicación, división, %, raíz cuadrada, potencia",
      "Álgebra: ecuaciones x+5=10, factorización, productos notables (a+b)²",
      "Geometría: áreas - cuadrado L², rectángulo b×h, círculo πr², triángulo b×h/2, volumen cubo, cilindro",
      "Trigonometría: seno=op/hip, cos=ady/hip, tan=op/ady - Teorema Pitágoras a²+b²=c²",
      "Cálculo: derivada velocidad, integral área bajo curva",
      "Estadística: media, mediana, moda, probabilidad"
    ],
    dgeti_general: {
      "1er Semestre": ["Álgebra", "Química I", "Inglés I", "Lógica", "Tecnologías Información", "Lectura"],
      "2do": ["Geometría Trigonometría", "Química II", "Inglés II", "Trazado", "Materiales"],
      "3er": ["Geometría Analítica", "Biología", "Inglés III", "Ética", "Cimentaciones"],
      "4to": ["Cálculo Diferencial", "Física I", "Inglés IV", "Ecología", "Mampostería"],
      "5to": ["Cálculo Integral", "Física II", "Inglés V", "Costos", "Instalaciones"],
      "6to": ["Probabilidad Estadística", "AutoCAD", "Supervisión Obra", "Proyectos"]
    },
    carreras_generales: [
      "DGETI: Construcción, Topografía, Dibujo Arquitectónico, Programación, Enfermería, Administración, Contabilidad, Mecatrónica, Electrónica",
      "TecNM: Ing Civil, Arquitectura, Sistemas Computacionales, Industrial, Electromecánica, Gestión Empresarial, Logística",
      "Universidades: Medicina, Derecho, Psicología, Enfermería, Derecho, Pedagogía, Contaduría",
      "Oficios: Albañilería, Electricidad, Plomería, Soldadura, Carpintería, Herrería, Mecánica"
    ],
    fisica_quimica_biologia: [
      "Física: Fuerza F=m×a, Energía, Trabajo, Potencia, Leyes Newton, gravedad 9.81 m/s², electricidad V=I×R",
      "Química: Tabla periódica, pH ácido-base, mezcla, reacción, balanceo, concentración",
      "Biología: Célula, ADN, mitosis, fotosíntesis, ecosistemas, cuerpo humano sistemas"
    ],
    construccion_resumen: [
      "Trazo y nivelación con manguera nivel",
      "Cimentación zapata 60×60 f'c 200",
      "Muro tabique 55 pzas/m2 plomo",
      "Concreto dosificación 1:2:3",
      "Aplanado mortero 1:4",
      "Instalación hidráulica PVC, eléctrica 110V",
      "NOM-031 seguridad"
    ]
  };
  return res.status(200).json(data);
}
