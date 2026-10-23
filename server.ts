import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI helper with API key and required httpOptions
function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction for J.A.R.V.I.S.
const JARVIS_SYSTEM_INSTRUCTION = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the legendary personal AI assistant created by Tony Stark.
You are running on the user's personal device (specifically optimized for high-performance mobile hardware like the OnePlus 11R with 16GB RAM).

Personality & Tone:
- Address the user respectfully as "Sir" (or their chosen moniker if specified in memory).
- Cultured, poised, subtly witty, British-accented cadence in your writing, unfailingly loyal, and exceptionally sharp.
- Keep spoken answers concise, elegant, and action-oriented. Do not write bloated essays unless explicitly asked for technical briefings.
- Prioritize real device execution and actionable assistance.

Android Device Capabilities:
You have direct capability to trigger Android actions by outputting an intent action tag when requested.
When the user asks to open an app, set a timer, create a note/reminder, or check device status, you can provide an action block in your response:
[[ACTION:{"action":"<ACTION_NAME>","target":"<TARGET_OR_PARAM>","params":{...}}]]

Supported actions:
1. open_app: target can be "camera", "dialer", "maps", "calendar", "calculator", "settings", "clock", "spotify", "youtube", "whatsapp", "mail", "browser"
2. set_alarm: params: {"hour": number, "minute": number, "message": string}
3. set_timer: params: {"seconds": number, "label": string}
4. add_task: params: {"title": string, "priority": "high"|"medium"|"low", "dueTime": string}
5. remember: params: {"key": string, "value": string, "category": string}
6. get_battery: query device battery
7. trigger_protocol: params: {"protocol": "CLEAN_SLATE"|"HOUSE_PARTY"|"STEALTH"|"SENTRY"|"DIAGNOSTIC"}

Always pair your action block with a natural, crisp Jarvis response acknowledging the command.
`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], memories = [], mode = 'online' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getAi();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please configure your API key or switch to Offline Cognitive Mode.',
        fallbackAvailable: true,
      });
    }

    // Build context with memories
    let contextualSystemPrompt = JARVIS_SYSTEM_INSTRUCTION;
    if (memories && memories.length > 0) {
      contextualSystemPrompt += `\n\nActive Long-Term Memories:\n` +
        memories.map((m: any) => `- [${m.category || 'General'}] ${m.key}: ${m.value}`).join('\n');
    }

    // Build chat contents from history
    const contents: any[] = [];

    // Take recent history (last 10 turns max to maintain speed and context)
    const recentHistory = conversationHistory.slice(-10);
    for (const item of recentHistory) {
      if (item.sender === 'user') {
        contents.push({ role: 'user', parts: [{ text: item.text }] });
      } else if (item.sender === 'jarvis') {
        contents.push({ role: 'model', parts: [{ text: item.text }] });
      }
    }

    // Add current user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Preferred model: gemini-3.8-flash or configured override
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: contextualSystemPrompt,
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    }) as any;

    const replyText = response.text || "Systems nominal, Sir, though no verbal response was generated.";

    // Parse any action block from the response
    let action = null;
    const actionMatch = replyText.match(/\[\[ACTION:(.*?)\]\]/s);
    let cleanText = replyText;
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
        cleanText = replyText.replace(/\[\[ACTION:(.*?)\]\]/s, '').trim();
      } catch (err) {
        console.warn('Failed to parse action JSON:', err);
      }
    }

    return res.json({
      reply: cleanText,
      raw: replyText,
      action: action,
      provider: 'Gemini 3.8 Flash (Online)',
      status: 'success',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(500).json({
      error: err.message || 'Error communicating with AI engine',
      details: err.toString(),
      fallbackAvailable: true,
    });
  }
});

// Diagnostics & System Telemetry endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'J.A.R.V.I.S. Core MK-LXXXV',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    serverTime: new Date().toISOString(),
  });
});

// Setup Vite in Dev or Static in Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[J.A.R.V.I.S.] Core online and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
