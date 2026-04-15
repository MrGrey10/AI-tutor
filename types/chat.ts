export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type View = 'start' | 'chat' | 'summary'

export interface Topic {
  id: string
  label: string
  prompt: string
}

export const TOPICS: Topic[] = [
  {
    id: 'job-interview',
    label: 'Job Interview',
    prompt: "Let's practice for a job interview. I'll play the interviewer — I'll ask you questions a real interviewer might ask.",
  },
  {
    id: 'travel',
    label: 'Travel',
    prompt: "Let's chat about travel. Tell me about a place you'd like to visit or somewhere you've already been.",
  },
  {
    id: 'daily-life',
    label: 'Daily Life',
    prompt: "Let's talk about your daily routine and everyday life. What does a typical day look like for you?",
  },
  {
    id: 'technology',
    label: 'Technology',
    prompt: "Let's discuss technology. What gadgets or apps do you use most, and how do they help you?",
  },
  {
    id: 'hobbies',
    label: 'Hobbies',
    prompt: "Let's talk about hobbies. What do you enjoy doing in your free time, and how did you get into it?",
  },
]
