import express from 'express';
const app = express();
const PORT = 3000;

app.get('/api/status', (req, res) => {
  res.json({
    creador: 'BF Villegas',
    familia: 'Llama',
    estado: 'Copilot Activo x3',
    cerebros: ['GROQ1','GROQ2','GROQ3'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/bf', (req, res) => {
  res.json({ creador: 'BF Villegas', familia: 'Llama' });
});

app.listen(PORT, () => console.log(`✅ API BF en http://localhost:${PORT}/api/status`));
