import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { webSearch, formatPerplexityPrompt } from './services/perplexity_engine.js';
import { generatePresentationHTML } from './services/gamma_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Public static folder for audio/presentations generated
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use('/public', express.static(publicDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'online', service: 'AI Engine Hub', version: '1.0.0' });
});

/**
 * 1. Audio TTS Endpoint (ElevenLabs Alternative)
 */
app.post('/api/tts', (req, res) => {
  const { text, voice = 'pt-BR-AntonioNeural', rate = '+0%' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const filename = `audio_${Date.now()}.mp3`;
  const outputPath = path.join(publicDir, filename);
  const scriptPath = path.join(__dirname, 'tts_engine.py');

  const cmd = `python "${scriptPath}" --text "${text.replace(/"/g, '\\"')}" --out "${outputPath}" --voice "${voice}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('TTS execution error:', stderr || error.message);
      return res.status(500).json({ error: 'Failed to generate audio' });
    }
    const audioUrl = `/public/${filename}`;
    res.json({ success: true, audioUrl, filename });
  });
});

/**
 * 2. Perplexity Search Endpoint
 */
app.get('/api/perplexity', async (req, res) => {
  const query = req.query.q || req.body.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const searchResults = await webSearch(query);
  const promptData = formatPerplexityPrompt(query, searchResults);

  res.json({
    query,
    sourcesCount: searchResults.length,
    sources: searchResults,
    prompt: promptData
  });
});

/**
 * 3. Gamma Presentation Generator Endpoint
 */
app.post('/api/gamma', (req, res) => {
  const { title = 'Apresentação Executiva', subtitle = 'Gerado via AI Engine Hub', slides = [] } = req.body;

  const defaultSlides = slides.length > 0 ? slides : [
    { title: 'Introdução ao Projeto', content: 'Visão geral das soluções e benefícios estratégicos.' },
    { title: 'Principais Recursos', bullets: ['Automação 24/7', 'Integração Nativa com WhatsApp', 'Redução de Custos'] },
    { title: 'Diferencial Competitivo', highlight: { label: 'Economia Operacional', value: 'Até 90% em licenças de software SaaS' } }
  ];

  const html = generatePresentationHTML(title, subtitle, defaultSlides);
  const filename = `presentation_${Date.now()}.html`;
  const outputPath = path.join(publicDir, filename);

  fs.writeFileSync(outputPath, html, 'utf-8');

  res.json({
    success: true,
    presentationUrl: `/public/${filename}`,
    filename
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Engine Hub rodando em http://localhost:${PORT}`);
});
