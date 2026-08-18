import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configura limite maior de payload para suportar upload de PDFs e Imagens codificados em base64
app.use(express.json({ limit: '50mb' }));

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve apenas as pastas públicas necessárias — nunca a raiz do projeto inteira, para não
// expor server.js, package.json, node_modules, .env (se existir) ou outros arquivos sensíveis.
const PUBLIC_DIRS = ['css', 'js', 'pages', 'icons', 'assets', 'components'];
PUBLIC_DIRS.forEach((dir) => {
  app.use(`/${dir}`, express.static(path.join(__dirname, dir)));
});

// Arquivos estáticos que precisam ficar na raiz (referenciados por caminho absoluto)
const ROOT_STATIC_FILES = ['manifest.json', 'sw.js'];
ROOT_STATIC_FILES.forEach((file) => {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
});

// Serve index.html para a rota raiz e demais rotas de navegação (evita 404 em refresh de página)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
