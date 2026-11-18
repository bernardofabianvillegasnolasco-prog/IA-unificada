// tasks.js - IA Unificada - flujo ECC plan -> test -> implement -> review
const tareas = [];
let siguienteId = 1;
function guardarTarea(descripcion) {
  if(!descripcion || !descripcion.trim()) throw new Error("descripcion vacia");
  const tarea = { id: siguienteId++, descripcion: descripcion.trim(), timestamp: Date.now() };
  tareas.push(tarea);
  return tarea;
}
function listarTareas() { return [...tareas]; }
export { guardarTarea, listarTareas };
