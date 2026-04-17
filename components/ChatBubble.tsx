import { Message } from '@/types/chat';
import { useCallback, useState } from 'react';

interface ChatBubbleProps {
  message: Message;
	speak: () => void;
}

const CORRECTION_MARKER = 'By the way —';

const Icons = ({speak, translate}: {speak: () => void, translate: () => void}) =>  <div className='flex gap-2 mt-[8px]'>
						<button onClick={speak} className='w-6 h-6 cursor-pointer hover:scale-110 transition-transform bg-gray-200 rounded-full p-1'>
							<img className='max-w-[80%]' src="/speak.svg" alt="Speak" />
						</button>
						<button onClick={translate} className='w-6 h-6 cursor-pointer hover:scale-110 transition-transform bg-gray-200 rounded-full p-1'>
							<img src="/lang.svg" alt="Language" />
						</button>
					</div>

export function ChatBubble({ message, speak }: ChatBubbleProps) {
	const [translation, setTranslation] = useState<string | null>(null);
	const [translating, setTranslating] = useState(false);

	const handleTranslate = useCallback(async () => {
		if (translation) {
			setTranslation(null);
			return;
		}
		const text = message?.content;
		if (!text) return;
		setTranslating(true);
		try {
			const res = await fetch('/api/translate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text }),
			});
			const data = await res.json();
			setTranslation(data.translation ?? null);
		} finally {
			setTranslating(false);
		}
	}, [message?.content, translation]);

  if (message?.role === 'user') {
    return (
      <div className='flex justify-end mb-3'>
        <div
          data-testid='user-bubble'
          className='max-w-[75%] rounded-2xl rounded-br-sm bg-blue-500 text-white px-4 py-2 text-sm'>
          {message.content}
        </div>
      </div>
    );
  }

  const correctionIndex = message?.content?.indexOf(CORRECTION_MARKER);

  if (correctionIndex === -1) {
    return (
      <div className='flex justify-start mb-3'>
        <div
          data-testid='tutor-bubble'
          className='max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800 px-4 py-2 text-sm'>
          {message?.content}
					{translating && <p className='text-xs text-gray-400 mt-1'>Translating…</p>}
					{translation && <p className='text-xs text-blue-600 mt-1 border-t border-gray-200 pt-1'>{translation}</p>}
					<Icons speak={speak} translate={handleTranslate} />
        </div>
      </div>
    );
  }

  const mainText = message?.content?.slice(0, correctionIndex)?.trim();
  const correctionText = message?.content?.slice(correctionIndex);

  return (
    <div className='flex flex-col items-start gap-2 mb-3'>
      {mainText && (
        <div
          data-testid='tutor-bubble'
          className='max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800 px-4 py-2 text-sm'>
          {mainText}
					{translating && <p className='text-xs text-gray-400 mt-1'>Translating…</p>}
					{translation && <p className='text-xs text-blue-600 mt-1 border-t border-gray-200 pt-1'>{translation}</p>}
					<Icons speak={speak} translate={handleTranslate} />
        </div>
      )}
      <div
        data-testid='correction-bubble'
        className='max-w-[75%] rounded-2xl rounded-bl-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm'>
        {correctionText}
      </div>
    </div>
  );
}
