// BotPip — RAG Service (Retrieval Augmented Generation)
// Handles document upload, chunking, embedding, and vector search

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 500;    // characters per chunk
const CHUNK_OVERLAP = 100; // overlap between chunks

// ============================================================
// CHUNK TEXT into overlapping pieces
// ============================================================
function chunkText(text) {
  const chunks = [];
  let start = 0;
  const cleanText = text.replace(/\s+/g, ' ').trim();

  while (start < cleanText.length) {
    const end = Math.min(start + CHUNK_SIZE, cleanText.length);
    const chunk = cleanText.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

// ============================================================
// EMBED text using OpenAI text-embedding-3-small
// ============================================================
async function embedText(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000)
  });
  return response.data[0].embedding;
}

// ============================================================
// PROCESS PDF buffer
// ============================================================
async function processPDF(buffer, firmId, fileName) {
  const docRecord = await createDocRecord(firmId, fileName, 'pdf');

  try {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    await indexDocument(firmId, docRecord.id, text, fileName);
    return docRecord;
  } catch (err) {
    await updateDocStatus(docRecord.id, 'error');
    throw err;
  }
}

// ============================================================
// PROCESS URL — scrape and index
// ============================================================
async function processURL(url, firmId) {
  const docRecord = await createDocRecord(firmId, url, 'url', url);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BotPip Knowledge Indexer 1.0' }
    });
    const html = await response.text();
    // Strip HTML tags
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    await indexDocument(firmId, docRecord.id, text, url);
    return docRecord;
  } catch (err) {
    await updateDocStatus(docRecord.id, 'error');
    throw err;
  }
}

// ============================================================
// PROCESS raw text (from interview or manual entry)
// ============================================================
async function processText(text, firmId, name) {
  const docRecord = await createDocRecord(firmId, name, 'txt');
  try {
    await indexDocument(firmId, docRecord.id, text, name);
    return docRecord;
  } catch (err) {
    await updateDocStatus(docRecord.id, 'error');
    throw err;
  }
}

// ============================================================
// INDEX a document — chunk + embed + store
// ============================================================
async function indexDocument(firmId, docId, text, docName) {
  const chunks = chunkText(text);
  let indexed = 0;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await embedText(chunks[i]);
      await supabase.from('knowledge_chunks').insert({
        firm_id: firmId,
        doc_id: docId,
        content: chunks[i],
        embedding,
        chunk_index: i
      });
      indexed++;
    } catch (err) {
      console.error(`Chunk ${i} failed:`, err.message);
    }
    // Small delay to respect rate limits
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));
  }

  // Calculate accuracy score based on successfully indexed chunks
  const accuracy = chunks.length > 0 ? Math.round((indexed / chunks.length) * 100) : 0;

  await supabase.from('knowledge_docs').update({
    status: 'indexed',
    chunk_count: indexed,
    accuracy_score: accuracy,
    updated_at: new Date().toISOString()
  }).eq('id', docId);

  return { indexed, total: chunks.length, accuracy };
}

// ============================================================
// SEARCH — find relevant chunks for a question
// ============================================================
async function searchKnowledge(firmId, question, matchCount = 5) {
  try {
    const queryEmbedding = await embedText(question);

    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      firm_id_param: firmId,
      match_count: matchCount,
      match_threshold: 0.65
    });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('RAG search error:', err.message);
    return [];
  }
}

// ============================================================
// DETECT CONFLICTS between docs for a firm
// ============================================================
async function checkForConflicts(firmId, newDocId) {
  const { detectConflicts } = require('./claude');

  const { data: newDoc } = await supabase
    .from('knowledge_docs')
    .select('name')
    .eq('id', newDocId)
    .single();

  const { data: newChunks } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('doc_id', newDocId)
    .limit(20);

  const { data: otherDocs } = await supabase
    .from('knowledge_docs')
    .select('id, name')
    .eq('firm_id', firmId)
    .neq('id', newDocId)
    .eq('status', 'indexed');

  if (!otherDocs || otherDocs.length === 0 || !newChunks) return [];

  const newContent = newChunks.map(c => c.content).join('\n');
  const conflicts = [];

  for (const doc of otherDocs.slice(0, 3)) {
    const { data: otherChunks } = await supabase
      .from('knowledge_chunks')
      .select('content')
      .eq('doc_id', doc.id)
      .limit(20);

    if (!otherChunks) continue;
    const otherContent = otherChunks.map(c => c.content).join('\n');

    const found = await detectConflicts(newContent, otherContent, newDoc.name, doc.name);

    for (const conflict of found) {
      await supabase.from('knowledge_conflicts').insert({
        firm_id: firmId,
        doc_a_id: newDocId,
        doc_b_id: doc.id,
        description: `${conflict.topic}: "${newDoc.name}" says ${conflict.doc_a_says} but "${doc.name}" says ${conflict.doc_b_says}`
      });
      conflicts.push(conflict);
    }
  }

  return conflicts;
}

// ============================================================
// GET all doc content for a firm (for quiz/conflict check)
// ============================================================
async function getDocsContent(firmId, limit = 50) {
  const { data } = await supabase
    .from('knowledge_chunks')
    .select('content, doc_id')
    .eq('firm_id', firmId)
    .limit(limit);
  return data || [];
}

// ============================================================
// HELPERS
// ============================================================
async function createDocRecord(firmId, name, type, sourceUrl = null) {
  const { data, error } = await supabase
    .from('knowledge_docs')
    .insert({ firm_id: firmId, name, type, source_url: sourceUrl, status: 'processing' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateDocStatus(docId, status) {
  await supabase.from('knowledge_docs').update({ status, updated_at: new Date().toISOString() }).eq('id', docId);
}

async function deleteDoc(firmId, docId) {
  await supabase.from('knowledge_chunks').delete().eq('doc_id', docId).eq('firm_id', firmId);
  await supabase.from('knowledge_docs').delete().eq('id', docId).eq('firm_id', firmId);
}

module.exports = {
  processPDF,
  processURL,
  processText,
  searchKnowledge,
  checkForConflicts,
  getDocsContent,
  deleteDoc,
  indexDocument
};
