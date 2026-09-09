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

import { humanHandoffs, toggleHandoff, botState, startWhatsAppBot } from './whatsapp_bot.js';
import { addRAGDocument, getRAGDocuments, deleteRAGDocument } from './services/rag_engine.js';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'online', service: 'AI Engine Hub', version: '1.0.0', botStatus: botState.status });
});

// Full AI Agent Control Center Dashboard
app.get(['/', '/dashboard'], (req, res) => {
  const dashPath = path.join(publicDir, 'dashboard.html');
  if (fs.existsSync(dashPath)) {
    return res.sendFile(dashPath);
  }
  res.redirect('/health');
});

// Status API
app.get('/api/status', (req, res) => {
  res.json({
    status: botState.status,
    qrCodeDataUrl: botState.qrCodeDataUrl,
    connectedUser: botState.connectedUser,
    activeHandoffs: humanHandoffs.size,
    ragDocumentsCount: getRAGDocuments().length
  });
});

// RAG Endpoints
app.post('/api/rag/upload', (req, res) => {
  const { title, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Conteúdo é obrigatório.' });
  }
  const newDoc = addRAGDocument(title, content);
  res.json({ success: true, document: newDoc });
});

app.get('/api/rag/documents', (req, res) => {
  res.json({ success: true, documents: getRAGDocuments() });
});

app.delete('/api/rag/documents/:id', (req, res) => {
  const deleted = deleteRAGDocument(req.params.id);
  res.json({ success: deleted });
});

// Human Handoff API
app.post('/api/handoff', (req, res) => {
  const { remoteJid, status } = req.body;
  if (!remoteJid) {
    return res.status(400).json({ error: 'remoteJid é obrigatório.' });
  }
  const newStatus = toggleHandoff(remoteJid, status);
  res.json({ success: true, remoteJid, active: newStatus });
});

// n8n Webhook Endpoint
app.post('/api/webhook/n8n', (req, res) => {
  const { event = 'custom_event', payload = {} } = req.body;
  console.log(`⚡ Webhook n8n Recebido [${event}]:`, payload);
  res.json({
    success: true,
    status: 'processed',
    event,
    receivedAt: new Date().toISOString()
  });
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
  const { message, generateAudio = true, clientSite = '', siteTitle = '' } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message field is required' });
  }

  try {
    const aiResponse = await generateHelpUSResponseAsync(message, { clientSite, siteTitle });

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

  // Auto notification via WhatsApp Bot if connected
  if (botState.status === 'connected' && botState.sock) {
    const notifyMsg = `🔔 *NOVO LEAD CAPTURADO (Widget HelpUS)*\n\n👤 *Nome:* ${newLead.name}\n📞 *Contato:* ${newLead.phone || newLead.email}\n🎯 *Intenção:* ${newLead.intent}\n🌐 *Origem:* ${newLead.clientSite}\n⏰ *Data:* ${newLead.createdAt}`;
    botState.sock.sendMessage('5583999999999@s.whatsapp.net', { text: notifyMsg }).catch(() => {});
  }

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
