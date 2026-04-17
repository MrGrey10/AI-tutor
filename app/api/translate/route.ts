import { NextRequest, NextResponse } from 'next/server';
import { createTranslationCompletion, getGroqClient } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { text }: { text: string } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

		// @ts-ignore
    const completion = await getGroqClient().chat.completions.create(createTranslationCompletion(text));

    // @ts-ignore
    const translation = completion?.choices[0]?.message?.content ?? '';
    return NextResponse.json({ translation });
  } catch (err) {
    console.error('[translate] Groq request failed:', err);
    return NextResponse.json(
      { error: 'Failed to translate. Please try again.' },
      { status: 502 }
    );
  }
}
