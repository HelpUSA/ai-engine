# AI Engine Hub 🚀

Suíte proprietária de microsserviços de Inteligência Artificial para substituição de ferramentas pagas (ElevenLabs, Perplexity AI, Gamma App, Zapier Pro) e integração com os projetos da empresa (`barbearia`, `realestate`, `danyimoveisjp`, `events`, etc.).

---

## 📌 Estrutura do Projeto

```
d:\dev\AntiG\ai-engine\
├── docs/                        # Documentação técnica e transcrições do Pré-MBA
│   ├── Aula_1_transcricao.txt   # Transcrição completa da Aula 1 (6.141 palavras)
│   ├── Aula_2_transcricao.txt   # Transcrição completa da Aula 2 (11.975 palavras)
│   ├── Aula_3_transcricao.txt   # Transcrição completa da Aula 3 (9.287 palavras)
│   └── BLUEPRINT_E_INTEGRACAO.md # Guia prático de prompts, arquitetura e integrações
├── public/                      # Arquivos gerados (áudios MP3, apresentações HTML/PDF)
├── src/
│   ├── services/
│   │   ├── perplexity_engine.js # Motor de busca com fontes verificáveis (Perplexity Alt)
│   │   └── gamma_engine.js      # Gerador de slides e propostas (Gamma Alt)
│   ├── tts_engine.py            # Motor de narração de voz neural (ElevenLabs Alt)
│   └── server.js                # Servidor API REST (localhost:4000)
└── package.json
```

---

## ⚡ Como Rodar o Servidor

```bash
cd d:\dev\AntiG\ai-engine
npm start
```

O servidor iniciará em `http://localhost:4000`.

---

## 🛠️ Endpoints Disponíveis

### 1. Sintetizador de Voz (`POST /api/tts`)
* **Descrição**: Converte texto em áudio neural MP3 realista em português.
* **Payload**:
  ```json
  {
    "text": "Seu agendamento foi confirmado para amanhã às 14:00.",
    "voice": "pt-BR-AntonioNeural"
  }
  ```

### 2. Pesquisa Verificável (`GET /api/perplexity?q=sua_pergunta`)
* **Descrição**: Realiza busca web em tempo real e retorna citações numéricas `[1]`, `[2]` e snippets das fontes.

### 3. Gerador de Apresentações (`POST /api/gamma`)
* **Descrição**: Gera uma apresentação HTML5 responsiva e imprimível em PDF.
* **Payload**:
  ```json
  {
    "title": "Proposta Comercial",
    "subtitle": "Lançamento Imobiliário",
    "slides": [
      { "title": "Destaques do Imóvel", "bullets": ["3 suítes", "Vista para o mar"] }
    ]
  }
  ```
