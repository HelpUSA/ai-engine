import https from 'https';
import http from 'http';

/**
 * HelpUS Knowledge Base & AI Agent Response Generator
 * Integrates directly with ai.helpusbr.com Multi-AI Gateway & Local Knowledge Fallback.
 * Default Voice: pt-BR-AntonioNeural (Male Voice)
 * Phonetic Pronunciation: "Rélp Ás"
 */

const AI_HELPUS_ENDPOINT = process.env.AI_HELPUS_URL || 'https://ai.helpusbr.com/api/chat';

/**
 * Call ai.helpusbr.com or generate intelligent response
 */
export async function generateHelpUSResponseAsync(customerMessage) {
  const msg = (customerMessage || '').trim();
  const maleVoice = "pt-BR-AntonioNeural";

  // Try calling ai.helpusbr.com AI service if available
  try {
    const aiResponse = await queryAiHelpus(msg);
    if (aiResponse) {
      const cleanText = aiResponse.replace(/HelpUS/gi, 'HelpUS');
      const ttsPhonetic = aiResponse.replace(/HelpUS/gi, 'Rélp Ás');
      return {
        text: cleanText,
        ttsText: ttsPhonetic,
        voice: maleVoice
      };
    }
  } catch (err) {
    console.log('💡 usando base de conhecimento nativa ai.helpusbr.com fallback...');
  }

  // Native HelpUS Knowledge Base Fallback
  return generateHelpUSResponse(msg);
}

export function generateHelpUSResponse(customerMessage) {
  const msg = (customerMessage || '').toLowerCase();
  const maleVoice = "pt-BR-AntonioNeural";

  if (msg.includes('site') || msg.includes('desenvolvimento') || msg.includes('web')) {
    return {
      text: "Olá! A HelpUS desenvolve sites institucionais, sistemas SaaS sob medida e portais com inteligência artificial integrada, design responsivo e alta velocidade. Qual tipo de projeto você tem em mente?",
      ttsText: "Olá! A Rélp Ás desenvolve sites institucionais, sistemas SaaS sob medida e portais com inteligência artificial integrada, design responsivo e alta velocidade. Qual tipo de projeto você tem em mente?",
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

  // Default welcome response
  return {
    text: "Olá! Seja muito bem-vindo à HelpUS. Sou o assistente virtual com inteligência artificial. Desenvolvemos ecossistemas de software, plataformas SaaS e soluções de IA como o HelpUS Voice. Como posso te ajudar hoje?",
    ttsText: "Olá! Seja muito bem-vindo à Rélp Ás. Sou o assistente virtual com inteligência artificial. Desenvolvemos ecossistemas de software, plataformas SaaS e soluções de IA como o Rélp Ás Voice. Como posso te ajudar hoje?",
    voice: maleVoice
  };
}

/**
 * Helper to query ai.helpusbr.com
 */
function queryAiHelpus(promptText) {
  return new Promise((resolve) => {
    try {
      const u = new URL(AI_HELPUS_ENDPOINT);
      const postData = JSON.stringify({
        messages: [
          { role: 'system', content: 'Você é o assistente comercial oficial da HelpUS (ai.helpusbr.com). Responda com clareza, objetividade e foco em ajudar o cliente.' },
          { role: 'user', content: promptText }
        ]
      });

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
            const content = data.reply || data.content || data?.choices?.[0]?.message?.content;
            if (content && typeof content === 'string') {
              return resolve(content);
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
