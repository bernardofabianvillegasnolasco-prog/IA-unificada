PASO3 - Fallback offline
- Si Groq falla / cuota / sin internet:
    * cerebro NO debe dar 500, debe dar 200 con text modo local
    * texto: 'Estoy en modo local, berna. Groq no respondió, pero sigo aquí.'
    * voz sigue jalando con /api/voz si hay internet, si no, muestra texto
- No se toca Llama local todavía, primero que no se rompa la página
