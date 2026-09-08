/**
 * HelpUS Knowledge Base & AI Agent Response Generator
 * Provides intelligent, friendly commercial responses about HelpUS ecosystem services.
 * Default Voice: pt-BR-AntonioNeural (Male Voice)
 * Phonetic Pronunciation: "Rélp Ás" (English pronunciation)
 */

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
