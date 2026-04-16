const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
let audioUnlocked = !isIOS;
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

function doSpeak(text: string): void {
  const synth = window.speechSynthesis;
  synth.cancel();

  const voices = synth.getVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  // If voices not loaded yet, browser uses default — still audible
  utterance.voice = pickVoice(voices);
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

// Call this directly from a user gesture (button tap/click) — unlocks audio on mobile
export function unlockAudio(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Mark unlocked synchronously so speak() works from async contexts afterward
  audioUnlocked = true;

  // If speak() was already called (e.g. initialMessage on mount), play it now
  // while we're still inside the gesture callstack
  if (pendingText) {
    const text = pendingText;
    pendingText = null;
    doSpeak(text);
  }
}

export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  if (!audioUnlocked) {
    pendingText = text; // hold until user taps mic
    return;
  }

  doSpeak(text);
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
