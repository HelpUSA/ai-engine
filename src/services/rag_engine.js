import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ragFilePath = path.join(__dirname, '..', '..', 'data', 'rag_store.json');

// Ensure directory exists
const dataDir = path.dirname(ragFilePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadRAGStore() {
  if (!fs.existsSync(ragFilePath)) {
    const defaultStore = {
      documents: [
        {
          id: 'doc_1',
          title: 'Visão Geral HelpUS',
          content: 'A HelpUS é um ecossistema completo de tecnologia com suporte a WhatsApp Bot, síntese de voz neural (voice.helpusbr.com), busca verificável (search.helpusbr.com) e agentes autônomos (agent.helpusbr.com).',
          createdAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(ragFilePath, JSON.stringify(defaultStore, null, 2), 'utf-8');
    return defaultStore;
  }

  try {
    const data = fs.readFileSync(ragFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler rag_store.json:', err);
    return { documents: [] };
  }
}

function saveRAGStore(store) {
  try {
    fs.writeFileSync(ragFilePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar rag_store.json:', err);
  }
}

/**
 * Add document to RAG store
 */
export function addRAGDocument(title, content) {
  const store = loadRAGStore();
  const newDoc = {
    id: `doc_${Date.now()}`,
    title: title || 'Documento Sem Título',
    content,
    createdAt: new Date().toISOString()
  };
  store.documents.push(newDoc);
  saveRAGStore(store);
  return newDoc;
}

/**
 * Get all RAG documents
 */
export function getRAGDocuments() {
  const store = loadRAGStore();
  return store.documents;
}

/**
 * Delete RAG document by ID
 */
export function deleteRAGDocument(id) {
  const store = loadRAGStore();
  const initialCount = store.documents.length;
  store.documents = store.documents.filter(doc => doc.id !== id);
  saveRAGStore(store);
  return store.documents.length < initialCount;
}

/**
 * Query RAG Store for relevant content based on user message
 */
export function queryRAGStore(queryText) {
  const store = loadRAGStore();
  if (!queryText || store.documents.length === 0) return '';

  const keywords = queryText.toLowerCase().split(/\s+/).filter(k => k.length > 3);
  
  const matches = store.documents.filter(doc => {
    const text = (doc.title + ' ' + doc.content).toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });

  if (matches.length === 0) return '';

  return matches.map(m => `[Documento: ${m.title}]\n${m.content}`).join('\n\n');
}
