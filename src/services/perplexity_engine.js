import https from 'https';

/**
 * Perform a web search using DuckDuckGo HTML/API
 */
export async function webSearch(query) {
  return new Promise((resolve) => {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const results = [];
        const regex = /<a class="result__url" href="([^"]+)">[^<]*<\/a>[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
        let match;
        let id = 1;
        while ((match = regex.exec(data)) !== null && id <= 5) {
          const rawUrl = match[1].replace(/&amp;/g, '&');
          const snippet = match[2].replace(/<[^>]+>/g, '').trim();
          if (snippet) {
            results.push({
              id,
              url: rawUrl,
              snippet
            });
            id++;
          }
        }
        resolve(results);
      });
    });
    req.on('error', (err) => {
      console.error('Search request error:', err);
      resolve([]);
    });
  });
}

/**
 * Format search results into a Perplexity-style synthesis prompt
 */
export function formatPerplexityPrompt(query, results) {
  const sourcesText = results.map(r => `[${r.id}] Fonte: ${r.url}\nResumo: ${r.snippet}`).join('\n\n');
  
  return {
    system: "Você é um assistente de pesquisa avançado (estilo Perplexity AI). Responda à pergunta do usuário de forma clara, objetiva e totalmente fundamentada nas fontes fornecidas. Sempre inclua citações numéricas como [1], [2] ao longo do texto para indicar a origem das informações.",
    userPrompt: `Pergunta do Usuário: ${query}\n\nFontes de Pesquisa Encontradas:\n${sourcesText}\n\nForneça uma resposta completa com citações numéricas [1], [2] e conclua listando as referências.`
  };
}
