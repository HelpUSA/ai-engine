import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { webSearch, formatPerplexityPrompt } from './services/perplexity_engine.js';
import { generatePresentationHTML } from './services/gamma_engine.js';
import { generateHelpUSResponseAsync } from './services/helpus_knowledge.js';

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

import { botState, startWhatsAppBot } from './whatsapp_bot.js';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'online', service: 'AI Engine Hub', version: '1.0.0', botStatus: botState.status });
});

// HTML Web Page for Scanning WhatsApp QR Code
app.get(['/', '/qr'], (req, res) => {
  if (botState.status === 'connected') {
    return res.send(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HelpUS WhatsApp Bot - Conectado</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✅
          </div>
          <h1 class="text-2xl font-extrabold text-white">WhatsApp Conectado!</h1>
          <p class="text-slate-400 text-sm">O robô de atendimento HelpUS com Voz Neural está 100% ativo e respondendo aos seus clientes.</p>
          <div class="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 border border-slate-800">
            Status: ONLINE 🟢
          </div>
        </div>
      </body>
      </html>
    `);
  }

  if (botState.qrCodeDataUrl) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="10">
        <title>Escanear QR Code - HelpUS WhatsApp Bot</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800">
              Conexão WhatsApp
            </span>
            <h1 class="text-2xl font-extrabold text-white mt-3">Escanear QR Code</h1>
            <p class="text-slate-400 text-xs mt-1">Abra o WhatsApp no seu iPhone ➔ Configurações ➔ Aparelhos Conectados ➔ Conectar um Aparelho</p>
          </div>

          <div class="p-4 bg-white rounded-2xl shadow-xl inline-block border-4 border-cyan-500/50">
            <img src="${botState.qrCodeDataUrl}" alt="WhatsApp QR Code" class="w-64 h-64 mx-auto block" />
          </div>

          <p class="text-[11px] text-slate-500 animate-pulse">
            Esta página atualiza automaticamente a cada 10 segundos.
          </p>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="5">
      <title>Gerando QR Code...</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4 text-center">
      <div class="space-y-4">
        <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 class="text-lg font-bold">Iniciando motor WhatsApp...</h2>
        <p class="text-xs text-slate-500">Aguarde alguns segundos enquanto o QR Code é gerado.</p>
      </div>
    </body>
    </html>
  `);
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
 * 2. Perplexity & AI Search Endpoint
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
 * 2.1. Unified HelpUS Ecosystem Search API
 */
app.all('/api/search', async (req, res) => {
  const query = req.query.q || req.body?.q || req.body?.query || '';
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const aiResponse = await generateHelpUSResponseAsync(query);
    res.json({
      success: true,
      query,
      synthesis: aiResponse.text,
      voice: aiResponse.voice,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process AI search request' });
  }
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

/**
 * 4. Widget Chat & AI Knowledge Base Endpoint
 */
app.post('/api/widget/chat', async (req, res) => {
  const { message, generateAudio = true } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message field is required' });
  }

  try {
    const aiResponse = await generateHelpUSResponseAsync(message);

    let audioUrl = null;
    if (generateAudio && aiResponse.ttsText) {
      const filename = `audio_widget_${Date.now()}.mp3`;
      const outputPath = path.join(publicDir, filename);
      const scriptPath = path.join(__dirname, 'tts_engine.py');
      const voice = aiResponse.voice || 'pt-BR-AntonioNeural';

      const cmd = `python "${scriptPath}" --text "${aiResponse.ttsText.replace(/"/g, '\\"')}" --out "${outputPath}" --voice "${voice}"`;
      
      await new Promise((resolve) => {
        exec(cmd, (error) => {
          if (!error) {
            audioUrl = `/public/${filename}`;
          }
          resolve();
        });
      });
    }

    res.json({
      success: true,
      text: aiResponse.text,
      voice: aiResponse.voice,
      audioUrl
    });
  } catch (err) {
    console.error('Widget Chat error:', err);
    res.status(500).json({ error: 'Failed to process widget request' });
  }
});

// In-memory lead store & webhook trigger
const leadsDatabase = [];

/**
 * 5. Lead Capture & Appointment Booking Endpoint
 */
app.post('/api/widget/lead', (req, res) => {
  const { name, phone, email, intent, clientSite } = req.body;
  if (!name || (!phone && !email)) {
    return res.status(400).json({ error: 'Nome e telefone ou email são obrigatórios.' });
  }

  const newLead = {
    id: `LEAD-${Date.now()}`,
    name,
    phone: phone || '',
    email: email || '',
    intent: intent || 'Agendamento / Atendimento',
    clientSite: clientSite || 'widget.helpusbr.com',
    createdAt: new Date().toISOString(),
    status: 'NOVO'
  };

  leadsDatabase.push(newLead);
  console.log('⚡ Novo Lead Capturado pelo Widget:', newLead);

  res.json({
    success: true,
    message: 'Lead capturado e agendamento registrado com sucesso!',
    lead: newLead
  });
});

app.get('/api/widget/leads', (req, res) => {
  res.json({
    success: true,
    total: leadsDatabase.length,
    leads: leadsDatabase
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Engine Hub rodando em http://localhost:${PORT}`);
  startWhatsAppBot().catch(err => console.error('Error starting WhatsApp bot:', err));
});
