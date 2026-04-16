let audioUnlocked = false;
let pendingText: string | null = null;
let iosResumeTimer: ReturnType<typeof setInterval> | null = null;

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.name.includes('Google') && v.lang === 'en-US') ||
    voices.find((v) => v.name.includes('Samantha') && v.lang === 'en-US') ||
    voices.find((v) => v.lang === 'en-US') ||
    null
  );
}

function doSpeak(text: string, synth: SpeechSynthesis): void {
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = pickVoice(synth.getVoices());
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1;

  if (iosResumeTimer) clearInterval(iosResumeTimer);
  iosResumeTimer = setInterval(() => {
    if (!synth.speaking) {
      clearInterval(iosResumeTimer!);
      iosResumeTimer = null;
      return;
    }
    synth.pause();
    synth.resume();
  }, 10000);

  utterance.onend = () => {
    if (iosResumeTimer) {
      clearInterval(iosResumeTimer);
      iosResumeTimer = null;
    }
  };

  synth.speak(utterance);
}

function withVoices(synth: SpeechSynthesis, cb: () => void): void {
  if (synth.getVoices().length > 0) {
    cb();
  } else {
    synth.addEventListener('voiceschanged', cb, { once: true });
  }
}

// Must be called from a direct user gesture (button click/touch)
export function unlockAudio(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis || audioUnlocked) return;

  const synth = window.speechSynthesis;
  const silent = new SpeechSynthesisUtterance(' ');
  silent.volume = 0;
  silent.onend = () => {
    audioUnlocked = true;
    if (pendingText) {
      const text = pendingText;
      pendingText = null;
      withVoices(synth, () => doSpeak(text, synth));
    }
  };
  synth.speak(silent);
}

export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const synth = window.speechSynthesis;

  if (!audioUnlocked) {
    // Queue — will play once user unlocks via unlockAudio()
    pendingText = text;
    return;
  }

  withVoices(synth, () => doSpeak(text, synth));
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  pendingText = null;
  if (iosResumeTimer) {
    clearInterval(iosResumeTimer);
    iosResumeTimer = null;
  }
  window.speechSynthesis.cancel();
}
