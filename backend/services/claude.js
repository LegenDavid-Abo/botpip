// BotPip — Claude AI Service
// Handles all AI responses, conflict detection, FAQ generation, quiz mode

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// MAIN BOT RESPONSE — with RAG context
// ============================================================
async function generateBotResponse({ question, chunks, firmSettings, conversationHistory = [], platformUserId, platformUserName }) {
  const {
    bot_name = 'Support Bot',
    tone = 'professional',
    use_emojis = true,
    bold_key_info = true,
    response_length = 'balanced',
    personalise_names = true,
    share_links_when_relevant = true,
    approved_emojis = ['📊','💰','✅','⚠️','🎯'],
    custom_emojis = []
  } = firmSettings;

  const allEmojis = [...approved_emojis, ...custom_emojis];
  const lengthGuide = { short: '1-2 sentences', balanced: '2-4 sentences', detailed: 'thorough but concise' }[response_length];

  const context = chunks.length > 0
    ? chunks.map((c, i) => `[Source ${i+1} | Confidence: ${Math.round(c.similarity * 100)}%]\n${c.content}`).join('\n\n')
    : '';

  const userName = personalise_names && platformUserName ? platformUserName.split(' ')[0] : null;
  const greeting = userName ? `Hi ${userName}, ` : '';

  const systemPrompt = `You are ${bot_name}, an AI support assistant for a prop trading firm.

RULES:
- ONLY answer from the provided context. If the answer isn't in the context, say you don't have that info and suggest they contact support.
- Never guess or make up rules, numbers, or policies.
- Tone: ${tone}
- Response length: ${lengthGuide}
- ${use_emojis ? `Use these emojis naturally where helpful: ${allEmojis.join(' ')}` : 'Do NOT use emojis.'}
- ${bold_key_info ? 'Bold important numbers, percentages, and rule names using **text**.' : ''}
- ${share_links_when_relevant ? 'Include source links ONLY when directly citing a specific rule the user needs to read in full.' : 'Do NOT include links.'}
- Always reply directly to the user's specific question — no generic answers.
- If a user asks about lot sizes, FIRST ask if they are on Evaluation or Master (unless context makes it clear).
- ${userName ? `Start with: "${greeting}"` : ''}
- Detect if user needs a link: only provide it if the answer references specific document URLs you have in context.

CONTEXT FROM KNOWLEDGE BASE:
${context || 'No relevant documents found for this question.'}`;

  const messages = [
    ...conversationHistory.slice(-6).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: question }
  ];

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 800,
    system: systemPrompt,
    messages
  });

  const answer = response.content[0].text;
  const linkShared = answer.includes('http://') || answer.includes('https://');
  const confidence = chunks.length > 0 ? Math.round(chunks[0].similarity * 100) : 0;

  return { answer, confidence, linkShared, sourceDocId: chunks[0]?.doc_id || null };
}

// ============================================================
// CONFLICT DETECTION between two document chunks
// ============================================================
async function detectConflicts(docAContent, docBContent, docAName, docBName) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a prop trading compliance checker. Compare these two documents and find any DIRECT CONTRADICTIONS — rules that say different things about the same topic.

DOCUMENT A (${docAName}):
${docAContent.substring(0, 3000)}

DOCUMENT B (${docBName}):
${docBContent.substring(0, 3000)}

Return ONLY a JSON array of conflicts found. Each conflict:
{"topic": "what the conflict is about", "doc_a_says": "what doc A says", "doc_b_says": "what doc B says"}

If no conflicts, return: []
Return ONLY the JSON array, no other text.`
    }]
  });

  try {
    const text = response.content[0].text.trim();
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ============================================================
// FAQ GENERATOR from conversation history
// ============================================================
async function generateFAQ(conversations) {
  const sample = conversations
    .filter(c => c.role === 'user')
    .map(c => c.content)
    .slice(0, 100)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyse these support questions from a prop trading firm and generate a structured FAQ.

QUESTIONS:
${sample}

Return ONLY a JSON array of FAQ items:
[{"question": "...", "category": "drawdown|payout|rules|accounts|trading|other", "frequency": "high|medium|low"}]

Group similar questions. Return the 15 most common. Return ONLY JSON.`
    }]
  });

  try {
    return JSON.parse(response.content[0].text.trim());
  } catch {
    return [];
  }
}

// ============================================================
// QUIZ MODE — bot tests itself on knowledge base
// ============================================================
async function generateQuiz(chunks, firmName) {
  const context = chunks.slice(0, 20).map(c => c.content).join('\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are generating a quiz to test whether an AI bot correctly knows the rules of "${firmName}" prop trading firm.

KNOWLEDGE BASE:
${context}

Generate 5 multiple-choice quiz questions that test key rules. Each question must have exactly one correct answer.

Return ONLY JSON:
[{
  "question": "...",
  "options": ["option A", "option B", "option C"],
  "correct_index": 0,
  "explanation": "Brief explanation of why this is correct"
}]`
    }]
  });

  try {
    return JSON.parse(response.content[0].text.trim());
  } catch {
    return [];
  }
}

// ============================================================
// AI INTERVIEWER — build knowledge base from answers
// ============================================================
const INTERVIEW_QUESTIONS = [
  "What is your firm name and what types of trading accounts do you offer (e.g. Evaluation, Instant Funding)?",
  "What are the drawdown rules for each account type? (daily drawdown %, overall drawdown %)",
  "What are the lot size limits for each account type?",
  "How does the payout process work? (schedule, profit split, minimum days)",
  "What instruments can traders trade? (forex, crypto, indices, commodities)",
  "Is news trading allowed? What are the restrictions around high-impact events?",
  "Are there any prohibited trading strategies or styles?",
  "What happens if a trader violates a rule? What are the consequences?",
  "Do you have a scaling plan or milestone-based profit split increases?",
  "What are your account sizes and pricing?",
  "What is your customer support contact and where can traders find the rules?",
  "Is there anything else important traders need to know about your firm's policies?"
];

async function processInterviewAnswer(questionIndex, answer, previousAnswers) {
  // Store the answer and return the next question
  const nextIndex = questionIndex + 1;
  const nextQuestion = nextIndex < INTERVIEW_QUESTIONS.length ? INTERVIEW_QUESTIONS[nextIndex] : null;

  if (!nextQuestion) {
    // All done — build the knowledge base document
    const kbContent = await buildKBFromInterview(previousAnswers.concat([answer]));
    return { done: true, kbContent };
  }

  return { done: false, nextQuestion, nextIndex };
}

async function buildKBFromInterview(answers) {
  const qa = INTERVIEW_QUESTIONS.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'Not provided'}`).join('\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Convert these interview answers into a well-structured knowledge base document for a prop trading firm support bot.

${qa}

Write it as clear, factual statements the bot can use to answer trader questions. Organise by topic. Be specific with numbers and rules.`
    }]
  });

  return response.content[0].text;
}

// ============================================================
// MT4/MT5 SCREENSHOT ANALYSIS
// ============================================================
async function analyseScreenshot(base64Image, firmSettings) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64Image }
        },
        {
          type: 'text',
          text: `You are analysing a MT4/MT5 trading terminal screenshot for a trader.

Identify and report:
1. Number of open trades
2. Current floating P&L
3. Current drawdown percentage (if visible)
4. Lot sizes used
5. Any visible rule violations based on typical prop firm rules (${firmSettings.evaluation_max_lots} max lots for Evaluation, ${firmSettings.master_max_lots} for Master)

Be specific with the numbers you can see. If something isn't visible, say so.
End with whether you see any potential rule violations. Use emojis appropriately.`
        }
      ]
    }]
  });

  return response.content[0].text;
}

// ============================================================
// VOICE MESSAGE TRANSCRIPTION
// ============================================================
async function transcribeAndRespond(audioBase64, firmSettings, chunks) {
  // Note: In production use Whisper API for transcription
  // For now we'll use Claude's built-in if audio support is available
  // This is a placeholder — connect to OpenAI Whisper for audio
  return {
    transcription: '[Voice transcription requires OpenAI Whisper API]',
    response: 'I received your voice message! Please also type your question so I can help you right away. 🎙️'
  };
}

module.exports = {
  generateBotResponse,
  detectConflicts,
  generateFAQ,
  generateQuiz,
  processInterviewAnswer,
  buildKBFromInterview,
  analyseScreenshot,
  transcribeAndRespond,
  INTERVIEW_QUESTIONS
};
