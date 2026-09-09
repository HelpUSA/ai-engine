import https from 'https';
import http from 'http';
import { queryRAGStore } from './rag_engine.js';

const AI_HELPUS_ENDPOINT = process.env.AI_HELPUS_ENDPOINT || 'https://ai.helpusbr.com/chat';

/**
 * Dispatch managerial sales alert for high-value leads or handoffs
 */
export async function sendManagerAlertNotification(remoteJid, messageText, alertType = 'LEAD_INTEREST') {
  console.log(`🔔 [ALERTA DIRETORIA] Novo chamado de alto valor de [${remoteJid}] (${alertType}): "${messageText}"`);
  return {
    sent: true,
    remoteJid,
    alertType,
    timestamp: new Date().toISOString()
  };
}

/**
 * Call external AI service with strict timeout and local RAG store lookup
 */
export async function generateHelpUSResponseAsync(customerMessage, siteContext = {}, imageBase64 = null) {
  const msg = (customerMessage || '').trim();
  const maleVoice = "pt-BR-AntonioNeural";

  if (!msg && !imageBase64) {
    return generateHelpUSResponse(msg, siteContext);
  }

  // 0. Query Local RAG Store first (only if no image)
  if (!imageBase64) {
    const ragContext = queryRAGStore(msg);
    if (ragContext) {
      console.log('🧠 RAG Match encontrado!');
      const ragAnswer = `Com base na nossa base de conhecimento:\n\n${ragContext}`;
      return {
        text: ragAnswer,
        ttsText: ragAnswer.replace(/HelpUS/gi, 'Rélp Ás'),
        voice: maleVoice
      };
    }
  }

  // Attempt external query with 5.5s timeout
  try {
    const aiPromise = queryAiHelpus(msg, imageBase64);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5500));
    const aiResponse = await Promise.race([aiPromise, timeoutPromise]);

    if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim().length > 0) {
      const cleanText = aiResponse.replace(/HelpUS/gi, 'HelpUS');
      const ttsPhonetic = aiResponse.replace(/HelpUS/gi, 'Rélp Ás');
      return {
        text: cleanText,
        ttsText: ttsPhonetic,
        voice: maleVoice
      };
    }
  } catch (err) {
    console.log('💡 Fallback para base local HelpUS:', err.message);
  }

  return generateHelpUSResponse(msg, siteContext);
}

export function generateHelpUSResponse(customerMessage, siteContext = {}) {
  const msg = (customerMessage || '').toLowerCase();
  const maleVoice = "pt-BR-AntonioNeural";
  const siteTitle = (siteContext.siteTitle || siteContext.clientSite || '').toLowerCase();

  // 1. Barbearia Studio Context
  if (siteTitle.includes('barbearia') || siteTitle.includes('barber')) {
    if (msg.includes('corte') || msg.includes('barba') || msg.includes('servico') || msg.includes('preco') || msg.includes('valor')) {
      return {
        text: "Na Barbearia Studio oferecemos Corte Masculino (R$ 45), Barba Completa com toalha quente (R$ 35), Combo Corte + Barba (R$ 70) e Selagem/Alinhamento (R$ 80). Gostaria de agendar um horário com nossos barbeiros?",
        ttsText: "Na Barbearia Studio oferecemos Corte Masculino, Barba Completa com toalha quente, Combo Corte e Barba e Selagem. Gostaria de agendar um horário com nossos barbeiros?",
        voice: maleVoice
      };
    }
    return {
      text: "Olá! Bem-vindo à Barbearia Studio. Atendemos de terça a sábado das 09h às 20h com agendamento online descomplicado. Como posso ajudar seu visual hoje?",
      ttsText: "Olá! Bem-vindo à Barbearia Studio. Atendemos de terça a sábado das nove às vinte horas com agendamento online descomplicado. Como posso ajudar seu visual hoje?",
      voice: maleVoice
    };
  }

  // 2. Caipira Raiz Context
  if (siteTitle.includes('caipira') || siteTitle.includes('ovo') || siteTitle.includes('granja')) {
    if (msg.includes('ovo') || msg.includes('duzia') || msg.includes('preco') || msg.includes('entrega') || msg.includes('pedido')) {
      return {
        text: "Nossos ovos caipiras são 100% livres de gaiola (pasture raised), produzidos diariamente na Granja Mattos. Dúzia selecionada por R$ 18,00 com entrega rápida em toda João Pessoa - PB. Quantas dúzias deseja pedir?",
        ttsText: "Nossos ovos caipiras são cem por cento livres de gaiola, produzidos diariamente na Granja Mattos. Dúzia selecionada por dezoito reais com entrega rápida em toda João Pessoa. Quantas dúzias deseja pedir?",
        voice: maleVoice
      };
    }
    return {
      text: "Olá! Bem-vindo ao Caipira Raiz. Ovos caipiras caipiras de verdade, com gema avermelhada e o máximo de sabor e nutrição. Como podemos entregar seu pedido hoje?",
      ttsText: "Olá! Bem-vindo ao Caipira Raiz. Ovos caipiras de verdade, com gema avermelhada e o máximo de sabor e nutrição. Como podemos entregar seu pedido hoje?",
      voice: maleVoice
    };
  }

  // 3. Dr. Eduardo Magalhães (Neurologia) Context
  if (siteTitle.includes('eduardo') || siteTitle.includes('neuro') || siteTitle.includes('medico') || siteTitle.includes('clinica')) {
    if (msg.includes('enmg') || msg.includes('eeg') || msg.includes('exame') || msg.includes('laudo') || msg.includes('consulta')) {
      return {
        text: "A clínica do Dr. Eduardo Magalhães realiza exames especializados em Eletroneuromiografia (ENMG), Eletroencefalograma (EEG) e Mapeamento Cerebral, além de emissão de Laudos Digitais Antifraude por QR Code. Deseja agendar uma consulta?",
        ttsText: "A clínica do Doutor Eduardo Magalhães realiza exames especializados em Eletroneuromiografia, Eletroencefalograma e Mapeamento Cerebral, além de emissão de Laudos Digitais Antifraude por Que Rê Códe. Deseja agendar uma consulta?",
        voice: maleVoice
      };
    }
    return {
      text: "Olá! Sou o assistente virtual da Clínica Neurológica do Dr. Eduardo Magalhães. Estamos à disposição para agendamentos de consultas e informações sobre laudos e exames neurofisiológicos.",
      ttsText: "Olá! Sou o assistente virtual da Clínica Neurológica do Doutor Eduardo Magalhães. Estamos à disposição para agendamentos de consultas e informações sobre laudos e exames neurofisiológicos.",
      voice: maleVoice
    };
  }

  // 4. Imobiliárias Context (Dany / Waleska / RealEstate)
  if (siteTitle.includes('imoveis') || siteTitle.includes('dany') || siteTitle.includes('waleska') || siteTitle.includes('realestate')) {
    if (msg.includes('imovel') || msg.includes('bessa') || msg.includes('jardim oceania') || msg.includes('comprar') || msg.includes('alugar')) {
      return {
        text: "Temos excelentes opções de apartamentos, casas em condomínio e coberturas no Bessa, Jardim Oceania e orla de João Pessoa. Gostaria de receber opções no seu WhatsApp com fotos e valores?",
        ttsText: "Temos excelentes opções de apartamentos, casas em condomínio e coberturas no Bessa, Jardim Oceania e orla de João Pessoa. Gostaria de receber opções no seu WhatsApp com fotos e valores?",
        voice: maleVoice
      };
    }
  }

  if (msg.includes('música') || msg.includes('musica') || msg.includes('compos') || msg.includes('cancao') || msg.includes('som')) {
    return {
      text: "Sim! A inteligência artificial hoje consegue compor músicas completas, gerar arranjos, criar letras e sintetizar vocais neurais em diversos estilos musicais. No ecossistema HelpUS, nós usamos IA para geração de voz neural ultra-realista para negócios e atendimento!",
      ttsText: "Sim! A inteligência artificial hoje consegue compor músicas completas, gerar arranjos, criar letras e sintetizar vocais neurais em diversos estilos musicais. No ecossistema Rélp Ás, nós usamos IA para geração de voz neural ultra-realista para negócios e atendimento!",
      voice: maleVoice
    };
  }

  if (msg.includes('site') || msg.includes('desenvolvimento') || msg.includes('web') || msg.includes('sistema')) {
    return {
      text: "Olá! A HelpUS desenvolve sites institucionais, sistemas SaaS sob medida e portais com inteligência artificial integrada, design responsivo e alta velocidade. Qual tipo de projeto você tem em mente?",
      ttsText: "Olá! A Rélp Ás desenvolve sites institucionais, sistemas SaaS sob medida e portais com inteligência artificial integrada, design responsivo e alta velocidade. Qual tipo de projeto você tem em mente?",
      voice: maleVoice
    };
  }

  if (msg.includes('slide') || msg.includes('apresentacao') || msg.includes('pitch') || msg.includes('powerpoint') || msg.includes('pptx')) {
    return {
      text: "O HelpUS Slides é nossa plataforma IA para geração instantânea de Apresentações e Pitch Decks executivos. Você pode criar slides com métricas, exportar para PowerPoint (.pptx) editável e narrar com voz neural. Acesse slides.helpusbr.com para experimentar!",
      ttsText: "O Rélp Ás Slides é nossa plataforma de Inteligência Artificial para geração instantânea de Apresentações e Pitch Decks executivos. Acesse slides.helpusbr.com para experimentar!",
      voice: maleVoice
    };
  }

  if (msg.includes('voz') || msg.includes('audio') || msg.includes('saas') || msg.includes('narracao')) {
    return {
      text: "O HelpUS Voice é nossa plataforma de Inteligência Artificial para geração de vozes neurais ultra-realistas. Você pode criar áudios em MP3 para atendimento no WhatsApp, vinhetas e confirmações em segundos! Acesse voice.helpusbr.com para conhecer.",
      ttsText: "O Rélp Ás Voice é nossa plataforma de Inteligência Artificial para geração de vozes neurais ultra-realistas. Você pode criar áudios em MP3 para atendimento no WhatsApp, vinhetas e confirmações em segundos! Acesse voice.helpusbr.com para conhecer.",
      voice: maleVoice
    };
  }

  if (msg.includes('imovel') || msg.includes('imobiliaria') || msg.includes('corretor')) {
    return {
      text: "A plataforma HelpUS RealEstate é nosso ecossistema para corretores e imobiliárias, com busca avançada de imóveis, mapa interativo e gestão de anúncios. Visite realestate.helpusbr.com!",
      ttsText: "A plataforma Rélp Ás Real Estate é nosso ecossistema para corretores e imobiliárias, com busca avançada de imóveis, mapa interativo e gestão de anúncios. Visite realestate.helpusbr.com!",
      voice: maleVoice
    };
  }

  if (msg.includes('saude') || msg.includes('medico') || msg.includes('clinica') || msg.includes('laudo')) {
    return {
      text: "Oferecemos soluções completas para a área da saúde e clínicas médicas, incluindo portais de laudos antifraude com validação por QR Code e inteligência médica. Acesse neuro.eduardomagalhaes.helpusbr.com para ver um exemplo ativo.",
      ttsText: "Oferecemos soluções completas para a área da saúde e clínicas médicas, incluindo portais de laudos antifraude com validação por QR Code e inteligência médica. Acesse neuro.eduardomagalhaes.helpusbr.com para ver um exemplo ativo.",
      voice: maleVoice
    };
  }

  if (msg.includes('preco') || msg.includes('valor') || msg.includes('quanto custa') || msg.includes('orcamento')) {
    return {
      text: "Nossas soluções sob medida e plataformas SaaS possuem planos flexíveis adaptados ao tamanho da sua empresa. Gostaria de agendar uma rápida conversa de alinhamento com nossa equipe?",
      ttsText: "Nossas soluções sob medida e plataformas SaaS possuem planos flexíveis adaptados ao tamanho da sua empresa. Gostaria de agendar uma rápida conversa de alinhamento com nossa equipe?",
      voice: maleVoice
    };
  }

  // Default intelligent response
  return {
    text: "Olá! Seja muito bem-vindo à HelpUS. Sou o assistente virtual com inteligência artificial. Desenvolvemos ecossistemas de software, plataformas SaaS e soluções de IA como o HelpUS Voice. Como posso te ajudar hoje?",
    ttsText: "Olá! Seja muito bem-vindo à Rélp Ás. Sou o assistente virtual com inteligência artificial. Desenvolvemos ecossistemas de software, plataformas SaaS e soluções de IA como o Rélp Ás Voice. Como posso te ajudar hoje?",
    voice: maleVoice
  };
}

/**
 * Helper to query ai.helpusbr.com with 1.2s timeout
 */
function queryAiHelpus(promptText, imageBase64 = null) {
  return new Promise((resolve) => {
    try {
      const u = new URL(AI_HELPUS_ENDPOINT);
      const payload = {
        mensagem: promptText || 'Analise esta imagem enviada.',
        pesquisar_web: false
      };
      if (imageBase64) {
        payload.image_base64 = imageBase64;
      }
      const postData = JSON.stringify(payload);

      const options = {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
      };

      const requester = u.protocol === 'https:' ? https : http;
      const req = requester.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const content = data.resposta || data.reply || data.content || data?.choices?.[0]?.message?.content;
            if (content && typeof content === 'string' && content.trim()) {
              return resolve(content.trim());
            }
          } catch (e) {}
          resolve(null);
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Transcribe WhatsApp audio notes using OpenAI Whisper-1
 */
export async function transcribeAudioWithWhisper(audioBuffer, filename = 'voice.ogg') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !audioBuffer) return null;

  try {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const bodyParts = [];

    bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`));
    bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt\r\n`));
    bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: audio/ogg\r\n\r\n`));
    bodyParts.push(audioBuffer);
    bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const postData = Buffer.concat(bodyParts);

    return new Promise((resolve) => {
      const req = https.request('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postData.length
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data && data.text) {
              return resolve(data.text.trim());
            }
          } catch (e) {}
          resolve(null);
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    });
  } catch (e) {
    return null;
  }
}
