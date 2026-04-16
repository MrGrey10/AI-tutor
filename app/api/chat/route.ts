import { NextRequest, NextResponse } from 'next/server';
import type { Message } from '@/types/chat';
import { getGroqClient, createChatCompletion } from '@/netlify/functions/chat';

export async function POST(req: NextRequest) {
  try {
    const { messages, userText }: { messages: Message[]; userText: string } = await req.json();

    if (!userText || typeof userText !== 'string') {
      return NextResponse.json({ error: 'userText is required' }, { status: 400 });
    }

    const completion = await getGroqClient().chat.completions.create(
      createChatCompletion(messages, userText)
    );

		// @ts-ignore
    const reply = completion?.choices[0]?.message?.content ?? '';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[chat] Groq request failed:', err);
    return NextResponse.json(
      { error: 'Failed to get a response. Please try again.' },
      { status: 502 }
    );
  }
}
