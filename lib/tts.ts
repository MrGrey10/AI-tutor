const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isIOS = /iPad|iPhone|iPod/.test(ua);
const isAndroid = /Android/i.test(ua);
const isMobile = isIOS || isAndroid;
const isDesktopChrome =
  !isMobile && /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);

let audioUnlocked = false;
let pendingText: string | null = null;
let desktopChromeResumeTimer: ReturnType<typeof setInterval> | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const v = window.speechSynthesis.getVoices();
  if (v && v.length) cachedVoices = v;
  return cachedVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  return (
    voices.find((v) => v.name.includes('Google') && v.lang === 'en-US') ||
    voices.find((v) => v.name.includes('Samantha') && v.lang === 'en-US') ||
    voices.find((v) => v.lang === 'en-US') ||
    voices[0]
  );
}

function speakNow(text: string, voices: SpeechSynthesisVoice[]): void {
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(voices);
  if (voice) utterance.voice = voice;
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1;

  if (isDesktopChrome) {
    if (desktopChromeResumeTimer) clearInterval(desktopChromeResumeTimer);
    desktopChromeResumeTimer = setInterval(() => {
      if (!synth.speaking) {
        clearInterval(desktopChromeResumeTimer!);
        desktopChromeResumeTimer = null;
        return;
      }
      synth.pause();
      synth.resume();
    }, 10000);

    utterance.onend = () => {
      if (desktopChromeResumeTimer) {
        clearInterval(desktopChromeResumeTimer);
        desktopChromeResumeTimer = null;
      }
    };
  }

  synth.speak(utterance);
}

function doSpeak(text: string): void {
  const voices = loadVoices();
  if (!voices.length && typeof window !== 'undefined' && window.speechSynthesis) {
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      speakNow(text, loadVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback in case event never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      speakNow(text, loadVoices());
    }, 500);
    return;
  }
  speakNow(text, voices);
}

// Call this directly from a user gesture (button tap/click) — unlocks audio on mobile
export function unlockAudio(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (audioUnlocked) {
    if (pendingText) {
      const text = pendingText;
      pendingText = null;
      doSpeak(text);
    }
    return;
  }

  const synth = window.speechSynthesis;

  // Prime the engine with a near-silent utterance inside the user gesture.
  // Required on iOS Safari and most mobile browsers — setting a flag alone
  // does not unlock the speech engine.
  const primer = new SpeechSynthesisUtterance(' ');
  primer.volume = 0;
  primer.rate = 1;
  primer.lang = 'en-US';
  synth.speak(primer);

  audioUnlocked = true;

  if (pendingText) {
    const text = pendingText;
    pendingText = null;
    // Let primer kick off first, then play real text
    setTimeout(() => doSpeak(text), 0);
  }
}

export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  if (!audioUnlocked && isMobile) {
    pendingText = text;
    return;
  }

  doSpeak(text);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  pendingText = null;
  if (desktopChromeResumeTimer) {
    clearInterval(desktopChromeResumeTimer);
    desktopChromeResumeTimer = null;
  }
  window.speechSynthesis.cancel();
}
