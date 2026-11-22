// Busca docs frescas y se las pasa al bot-mejora
// Uso: node bot-buscar.js "vercel serverless edge tts 2026"
import fs from "fs";
const tema = process.argv.slice(2).join(" ") || "Vercel serverless Node EdgeTTS best practices";
const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(tema)}`;
console.log("Buscando:", tema);
console.log("Abre esto para ver fuentes frescas:", url);
console.log("Luego corre: node bot-mejora.js");
