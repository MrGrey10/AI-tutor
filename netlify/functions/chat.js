import Groq from 'groq-sdk';

export const SYSTEM_PROMPT = `You are a friendly, encouraging English conversation tutor for intermediate learners. Respond naturally as a conversation partner — keep replies concise (2–4 sentences). If the user makes a grammar or vocabulary mistake, first respond to what they said naturally, then add a short correction: "By the way — you could say: [corrected version], if that really needed to be said." Never refuse to engage with a topic; always keep the conversation going. If a topic was selected at the start, keep responses relevant to that topic for the first few exchanges, then let the conversation flow naturally.`;

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export const createChatCompletion = (messages, userText) => ({
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(messages || []),
    { role: 'user', content: userText }
  ],
  stream: false
});

exports.handler = async (event) => {
  try {
    const { messages, userText } = JSON.parse(event.body || '{}');

    if (!userText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userText is required' })
      };
    }

    const completion = await getGroqClient().chat.completions.create(
      createChatCompletion(messages, userText)
    );

    const reply = completion.choices[0]?.message?.content ?? '';

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('[chat] error:', err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to get response'
      })
    };
  }
};
