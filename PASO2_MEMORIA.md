PASO2 - Memoria que recuerda
- En index.html, actualizarPerfilDesdeTexto debe guardar:
    * si dice 'me llamo X' -> perfilBF.nombre = X
    * si dice 'me gusta X' -> perfilBF.gustos.push(X)
    * si dice 'estoy trabajando en X' / 'estoy en X' -> perfilBF.proyecto_actual = X
    * si dice 'háblame coqueta / háblame normal' -> perfilBF.estilo_voz = X
- Eso ya se guarda en /api/memoria con guardarMemoriaBF()
- En cerebro, el prompt ya recibe perfilBF, así que ya lo usa sin cambiar cerebro.js
