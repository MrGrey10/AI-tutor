import { TOPICS } from '@/types/chat';

interface StartScreenProps {
  onStart: (initialMessage?: string) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4'>
      <div className='max-w-md w-full text-center'>
        <h1 className='text-4xl font-bold text-gray-900 mb-2'>AI English Tutor</h1>
        <p className='text-gray-500 mb-10'>
          Practice your English conversation skills with an AI partner.
        </p>

        <button
          onClick={() => onStart(undefined)}
          className='w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition-colors mb-8'>
          Free chat
        </button>

        <p className='text-sm text-gray-400 uppercase tracking-widest mb-4'>Or choose a topic</p>

        <div className='grid grid-cols-1 gap-3'>
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onStart(topic.prompt)}
              className='w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors text-left'>
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
