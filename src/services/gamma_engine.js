/**
 * Gamma App Alternative: Renders responsive HTML5 slide presentations and sales proposals
 */
export function generatePresentationHTML(title, subtitle, slidesData) {
  const slidesHtml = slidesData.map((slide, idx) => `
    <section class="slide-card">
      <div class="slide-header">
        <span class="slide-number">Slide ${idx + 1}</span>
        <h2 class="slide-title">${slide.title}</h2>
      </div>
      <div class="slide-body">
        ${slide.content ? `<p class="slide-text">${slide.content}</p>` : ''}
        ${slide.bullets ? `
          <ul class="slide-bullets">
            ${slide.bullets.map(b => `<li><span class="bullet-icon">✦</span> ${b}</li>`).join('')}
          </ul>
        ` : ''}
        ${slide.highlight ? `
          <div class="slide-highlight">
            <strong>${slide.highlight.label}:</strong> ${slide.highlight.value}
          </div>
        ` : ''}
      </div>
    </section>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg-dark: #0f172a;
      --card-bg: #1e293b;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.2);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    body {
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .header-box {
      text-align: center;
      max-width: 800px;
      margin-bottom: 40px;
    }
    .header-box h1 {
      font-size: 2.5rem;
      color: var(--accent);
      margin-bottom: 10px;
    }
    .header-box p {
      font-size: 1.2rem;
      color: var(--text-muted);
    }
    .presentation-container {
      width: 100%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 25px;
    }
    .slide-card {
      background-color: var(--card-bg);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 35px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .slide-card:hover {
      border-color: var(--accent);
      box-shadow: 0 10px 35px var(--accent-glow);
    }
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .slide-number {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .slide-title {
      font-size: 1.6rem;
      margin: 0;
    }
    .slide-bullets {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    .slide-bullets li {
      font-size: 1.1rem;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bullet-icon {
      color: var(--accent);
    }
    .slide-highlight {
      background: var(--accent-glow);
      border-left: 4px solid var(--accent);
      padding: 15px 20px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 1.1rem;
    }
  </style>
</head>
<body>
  <div class="header-box">
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>
  <div class="presentation-container">
    ${slidesHtml}
  </div>
</body>
</html>`;
}
