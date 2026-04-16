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

  // iOS Safari pauses speechSynthesis after ~15s — keep it alive
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

export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  const voices = synth.getVoices();

  if (voices.length > 0) {
    doSpeak(text, synth);
  } else {
    // Mobile browsers load voices async
    synth.addEventListener('voiceschanged', () => doSpeak(text, synth), { once: true });
  }
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (iosResumeTimer) {
    clearInterval(iosResumeTimer);
    iosResumeTimer = null;
  }
  window.speechSynthesis.cancel();
}
