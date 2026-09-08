# Blueprint de Ferramentas, Prompts e Integração

Este documento serve como manual de referência técnica das metodologias e ferramentas apresentadas no **Pré-MBA de IA da EXAME**, com o plano prático de aplicação para os nossos sistemas.

---

## 1. Mapa de Substituição de Ferramentas Pagas

| Ferramenta do Curso | Custo SaaS | Nossa Solução In-House (`ai-engine`) | Benefício |
| :--- | :--- | :--- | :--- |
| **ElevenLabs** | $5 - $22+/mês | `python src/tts_engine.py` (Edge-TTS) | Vozes neurais em PT-BR 100% gratuitas e ilimitadas. |
| **Perplexity AI** | $20/mês | `GET /api/perplexity` | Pesquisa em tempo real com citações de fontes numéricas. |
| **Gamma App** | $16 - $20/mês | `POST /api/gamma` | Geração instantânea de relatórios/slides HTML5 e PDF. |
| **Zapier Pro** | $20 - $100+/mês | Webhooks Express + n8n self-hosted | Sem cobrança por tarefas executadas. |

---

## 2. Estrutura Padrão de Prompts de Elite

Para utilizar nos nossos projetos e assistentes:

```markdown
# PERSONA
Você é o assistente virtual oficial da empresa [NOME DA EMPRESA], especializado em [ÁREA].

# CONTEXTO
Você está atendendo um cliente em potencial no [CANAL: WhatsApp / Website].

# REGRAS DE RESPOSTA
- Seja cordial, objetivo e mantenha o foco em agendar uma visita/horário.
- Se não souber a informação, ofereça transferir para o atendimento humano.
- Responda em no máximo 3 parágrafos curtos.
```

---

## 3. Arquivos de Transcrição Completa no Repositório

As transcrições oficiais de todas as aulas do curso estão arquivadas nesta pasta:

- 📄 `d:\dev\AntiG\ai-engine\docs\Aula_1_transcricao.txt` *(6.141 palavras)*
- 📄 `d:\dev\AntiG\ai-engine\docs\Aula_2_transcricao.txt` *(11.975 palavras)*
- 📄 `d:\dev\AntiG\ai-engine\docs\Aula_3_transcricao.txt` *(9.287 palavras)*
