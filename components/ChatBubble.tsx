import { Message } from '@/types/chat'

interface ChatBubbleProps {
  message: Message
}

const CORRECTION_MARKER = 'By the way —'

export function ChatBubble({ message }: ChatBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div
          data-testid="user-bubble"
          className="max-w-[75%] rounded-2xl rounded-br-sm bg-blue-500 text-white px-4 py-2 text-sm"
        >
          {message.content}
        </div>
      </div>
    )
  }

  const correctionIndex = message.content.indexOf(CORRECTION_MARKER)

  if (correctionIndex === -1) {
    return (
      <div className="flex justify-start mb-3">
        <div
          data-testid="tutor-bubble"
          className="max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800 px-4 py-2 text-sm"
        >
          {message.content}
        </div>
      </div>
    )
  }

  const mainText = message.content.slice(0, correctionIndex).trim()
  const correctionText = message.content.slice(correctionIndex)

  return (
    <div className="flex flex-col items-start gap-2 mb-3">
      {mainText && (
        <div
          data-testid="tutor-bubble"
          className="max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800 px-4 py-2 text-sm"
        >
          {mainText}
        </div>
      )}
      <div
        data-testid="correction-bubble"
        className="max-w-[75%] rounded-2xl rounded-bl-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm"
      >
        {correctionText}
      </div>
    </div>
  )
}
