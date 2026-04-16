export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const voices = synth.getVoices();

  // Try to find a high-quality voice
  const voice =
    voices.find((v) => v.name.includes('Google') && v.lang === 'en-US') ||
    voices.find((v) => v.name.includes('Samantha') && v.lang === 'en-US') || // Safari
    voices.find((v) => v.lang === 'en-US');

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice || null;
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1;

  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
