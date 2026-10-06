import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
export default app;
