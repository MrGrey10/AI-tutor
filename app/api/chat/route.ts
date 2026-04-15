import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { Message } from '@/types/chat'

const SYSTEM_PROMPT = `You are a friendly, encouraging English conversation tutor for intermediate learners. Respond naturally as a conversation partner — keep replies concise (2–4 sentences). If the user makes a grammar or vocabulary mistake, first respond to what they said naturally, then add a short correction: "By the way — you could say: [corrected version]." Never refuse to engage with a topic; always keep the conversation going. If a topic was selected at the start, keep responses relevant to that topic for the first few exchanges, then let the conversation flow naturally.`

function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userText }: { messages: Message[]; userText: string } = await req.json()

    if (!userText || typeof userText !== 'string') {
      return NextResponse.json({ error: 'userText is required' }, { status: 400 })
    }

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        { role: 'user', content: userText },
      ],
      stream: false,
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[chat] Groq request failed:', err)
    return NextResponse.json({ error: 'Failed to get a response. Please try again.' }, { status: 502 })
  }
}
