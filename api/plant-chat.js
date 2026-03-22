// PlantPal AI Plant Expert — Vercel Serverless Function
// POST /api/plant-chat
// Body: { "message": "How do I propagate a monstera?", "context": "Monstera deliciosa", "history": [] }

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_SECRET = process.env.PLANTPAL_API_SECRET;

const SYSTEM_PROMPT = `You are PlantPal's plant expert assistant. You help users with:
- Plant propagation (cuttings, water propagation, soil propagation, division, air layering)
- General plant care (watering, light, soil, fertilizing)
- Diagnosing plant problems (yellowing leaves, pests, diseases)
- Seasonal care tips

Rules:
- Keep answers concise (2-4 short paragraphs max)
- Be warm and encouraging — plant care should be fun, not stressful
- Use bullet points for step-by-step instructions
- If asked about something non-plant-related, politely redirect
- If you're unsure about toxicity, always err on the side of caution and recommend checking ASPCA
- Include emoji sparingly for friendliness 🌱
- Never recommend specific product brands`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Auth check
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${APP_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { message, context, history = [] } = req.body;
  
  if (!message || typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message (max 500 chars)' });
  }
  
  // Build messages
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];
  
  // Add plant context if available
  if (context) {
    messages.push({
      role: 'system', 
      content: `The user is currently looking at: ${context}. Tailor your advice to this plant when relevant.`
    });
  }
  
  // Add conversation history (max 6 exchanges to limit tokens)
  const recentHistory = history.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  
  // Add current message
  messages.push({ role: 'user', content: message });
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://justinbundrick.dev',
        'X-Title': 'PlantPal'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', err);
      return res.status(502).json({ error: 'AI service error' });
    }
    
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    
    return res.status(200).json({ 
      reply,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
