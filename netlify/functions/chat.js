import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are a friendly English tutor...`;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

exports.handler = async (event) => {
  try {
    const { messages, userText } = JSON.parse(event.body || '{}');

    if (!userText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userText is required' })
      };
    }

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(messages || []),
        { role: 'user', content: userText }
      ],
      stream: false
    });

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
