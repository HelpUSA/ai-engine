import makeWASocket, { useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { generateHelpUSResponseAsync, transcribeAudioWithWhisper, sendManagerAlertNotification } from './services/helpus_knowledge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authDir = path.join(__dirname, '..', 'auth_info_baileys');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

export const humanHandoffs = new Map();

export const botState = {
  qrCodeDataUrl: null,
  status: 'initializing',
  connectedUser: null
};

export function toggleHandoff(remoteJid, status) {
  if (status === undefined) {
    const current = humanHandoffs.get(remoteJid) || false;
    humanHandoffs.set(remoteJid, !current);
    return !current;
  }
  humanHandoffs.set(remoteJid, !!status);
  return !!status;
}

/**
 * Generate MP3 audio using local tts_engine.py
 */
function generateSpeechAudio(text, voice = 'pt-BR-FranciscaNeural') {
  return new Promise((resolve, reject) => {
    const filename = `bot_voice_${Date.now()}.mp3`;
    const outputPath = path.join(publicDir, filename);
    const scriptPath = path.join(__dirname, 'tts_engine.py');

    const cmd = `python "${scriptPath}" --text "${text.replace(/"/g, '\\"')}" --out "${outputPath}" --voice "${voice}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('TTS Generation error:', stderr || error.message);
        return resolve(null);
      }
      resolve(outputPath);
    });
  });
}

export async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  console.log('🤖 Iniciando Bot WhatsApp HelpUS com Suporte a Voz Neural...');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      botState.status = 'qr_ready';
      try {
        botState.qrCodeDataUrl = await QRCode.toDataURL(qr);
      } catch (err) {
        console.error('Erro ao gerar QR Code Data URL:', err);
      }

      console.log('\n======================================================');
      console.log('📱 ESCANEE O QR CODE NO TERMINAL OU NO NAVEGADOR (/qr):');
      console.log('======================================================\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('\n======================================================\n');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('⚠️ Conexão encerrada. Reconectando...', shouldReconnect);
      botState.status = 'disconnected';
      botState.qrCodeDataUrl = null;
      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 5000);
      }
    } else if (connection === 'open') {
      botState.status = 'connected';
      botState.qrCodeDataUrl = null;
      botState.connectedUser = sock.user?.id || 'Conectado';

      console.log('✅ Bot WhatsApp HelpUS Conectado com Sucesso!');
      console.log('🎙️ O robô está pronto para responder com Texto + Voz Neural!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue;

      const remoteJid = msg.key.remoteJid;
      let textMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || '';
      let incomingImageBase64 = null;

      if (!textMessage.trim() && msg.message?.audioMessage) {
        try {
          console.log(`🎙️ Áudio recebido de [${remoteJid}], iniciando transcrição Whisper...`);
          const audioBuffer = await downloadMediaMessage(msg, 'buffer', {});
          const transcribed = await transcribeAudioWithWhisper(audioBuffer);
          if (transcribed) {
            console.log(`📝 Transcrição Whisper [${remoteJid}]: ${transcribed}`);
            textMessage = transcribed;
          }
        } catch (audioErr) {
          console.error('Erro ao baixar/transcrever áudio:', audioErr);
        }
      }

      if (msg.message?.imageMessage) {
        try {
          console.log(`📷 Imagem recebida de [${remoteJid}], baixando buffer para visão multimodal...`);
          const imgBuffer = await downloadMediaMessage(msg, 'buffer', {});
          if (imgBuffer) {
            incomingImageBase64 = imgBuffer.toString('base64');
            if (!textMessage.trim()) {
              textMessage = 'Analise a imagem enviada por favor.';
            }
          }
        } catch (imgErr) {
          console.error('Erro ao baixar imagem:', imgErr);
        }
      }

      if (!textMessage.trim() && !incomingImageBase64) continue;

      console.log(`📩 Mensagem recebida de [${remoteJid}]: ${textMessage}${incomingImageBase64 ? ' (com imagem anexa)' : ''}`);

      // Check if Human Handoff is requested or already active
      const lowerText = textMessage.toLowerCase();
      const isHandoffKeyword = lowerText.includes('humano') || lowerText.includes('atendente') || lowerText.includes('falar com pessoa');
      const isHighValueKeyword = lowerText.includes('orcamento') || lowerText.includes('proposta') || lowerText.includes('agendar') || lowerText.includes('comprar');

      if (isHighValueKeyword || isHandoffKeyword) {
        await sendManagerAlertNotification(remoteJid, textMessage, isHandoffKeyword ? 'HUMAN_HANDOFF' : 'HIGH_VALUE_LEAD');
      }

      if (isHandoffKeyword || humanHandoffs.get(remoteJid)) {
        if (isHandoffKeyword) {
          humanHandoffs.set(remoteJid, true);
          await sock.sendMessage(remoteJid, { 
            text: '👨‍💻 *Transbordo Humano Ativado!* Um de nossos atendentes humanos foi notificado e dará continuidade ao seu atendimento em instantes.' 
          });
          console.log(`👨‍💻 Transbordo humano ativado para [${remoteJid}]`);
        } else {
          console.log(`⏸️ Resposta automática pausada para [${remoteJid}] (Modo Atendente Humano Ativo)`);
        }
        continue;
      }

      // 1. Generate intelligent HelpUS response via ai.helpusbr.com / Knowledge Engine
      const botResponse = await generateHelpUSResponseAsync(textMessage, {}, incomingImageBase64);

      // 2. Send Text Response
      await sock.sendMessage(remoteJid, { text: botResponse.text });

      // 3. Generate and Send Audio Voice Message (Male Voice + Phonetic English Pronunciation)
      try {
        const textToSpeak = botResponse.ttsText || botResponse.text;
        const audioPath = await generateSpeechAudio(textToSpeak, botResponse.voice || 'pt-BR-AntonioNeural');
        if (audioPath && fs.existsSync(audioPath)) {
          const audioBuffer = fs.readFileSync(audioPath);
          await sock.sendMessage(remoteJid, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: true
          });
          console.log(`🎙️ Mensagem de voz enviada para [${remoteJid}]`);
        }
      } catch (err) {
        console.error('Erro ao enviar áudio no WhatsApp:', err);
      }
    }
  });
}
