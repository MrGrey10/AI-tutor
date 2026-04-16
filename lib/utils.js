import Groq from 'groq-sdk';

export const SYSTEM_PROMPT = `
	You are a friendly, encouraging English conversation tutor for intermediate learners.
	Respond naturally as a conversation partner — keep replies concise (2–4 sentences).
	If the user makes a grammar or vocabulary mistake, first respond to what they said naturally,
	then add a short correction: "By the way — your mistake was: [mistake], corrected version: [corrected version]", but use this correction only in cases when it mistake is really important for understanding. Never refuse to engage with a topic;
	 always keep the conversation going. If a topic was selected at the start,
	  keep responses relevant to that topic for the first few exchanges, 
		then let the conversation flow naturally.
`;

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