# 🚀 Guia de Deploy Definitivo: agent.helpusbr.com

Este guia contém as instruções exatas passo a passo para colocar a plataforma **`agent.helpusbr.com`** no ar.

---

## 📌 1. Apontamento DNS (Seu Registrador de Domínio)

Acesse o painel do seu registrador (Cloudflare, Registro.br, Hostgator, etc.) e crie a seguinte entrada DNS:

* **Tipo**: `CNAME`
* **Nome / Host**: `agent`
* **Valor / Destino**: 
  * Se for usar Vercel: `cname.vercel-dns.com`
  * Se for usar Render: `helpus-whatsapp-bot.onrender.com`
  * Se for usar Railway: `<seu-app>.up.railway.app`
* **TTL**: Automático (300s)

---

## 📌 2. Opções de Deploy Gratuitas/Automatizadas

### Opção A: Deploy na Vercel (Recomendado para Interface Web / SaaS)
1. Abra o terminal no seu computador e execute:
   ```bash
   cd d:\dev\AntiG\ai-engine
   npx vercel --prod
   ```
2. Adicione o domínio customizado no painel da Vercel:
   `Settings` ➔ `Domains` ➔ `agent.helpusbr.com`.

### Opção B: Deploy no Render (Recomendado para WhatsApp Bot 24/7 + TTS)
1. Acesse [render.com](https://render.com) e clique em **New ➔ Web Service**.
2. Conecte o repositório `ai-engine`.
3. O Render detectará automaticamente o arquivo `render.yaml`.
4. Adicione o Custom Domain `agent.helpusbr.com` nas configurações do Render.

### Opção C: Deploy no Railway (Recomendado para Webhooks WhatsApp)
1. Acesse [railway.com](https://railway.com) e crie um projeto importando `helpus-whatsapp-ia`.
2. O Railway usará o `Dockerfile` existente.
3. Adicione o domínio `agent.helpusbr.com` nas configurações da Railway.

---

## 📌 3. Variáveis de Ambiente Necessárias (`.env`)

No painel do provedor escolhido, configure:

```env
PORT=4000
OPENAI_API_KEY=sk-sua-chave-aqui
OPENAI_MODEL=gpt-4o-mini
VERIFY_TOKEN=helpus_secret_token_2026
META_ACCESS_TOKEN=EAAG...
PHONE_NUMBER_ID=1234567890
```

---

## 📌 4. Verificação pós-deploy

Após salvar o DNS e o deploy finalizar, teste o endpoint de saúde:
```bash
curl -I https://agent.helpusbr.com/health
```
Resposta esperada: `HTTP/2 200 OK` com `{"status":"online","service":"AI Engine Hub"}`.
