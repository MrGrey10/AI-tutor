import { getGroqClient, createTranslationCompletion } from '../../lib/utils.js';

export async function handler(event) {
	try {
		const { userText } = JSON.parse(event.body || '{}');

		if (!userText) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: 'userText is required' })
			};
		}

		const completion = await getGroqClient().chat.completions.create(createTranslationCompletion(userText));

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
}
