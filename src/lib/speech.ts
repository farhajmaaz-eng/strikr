export interface SpeechOptions {
  rate?: number;
  voiceURI?: string | null;
  volume?: number;
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function availableVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => {
      if (a.default !== b.default) return a.default ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function primeSpeech(): void {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.resume();
  } catch {
    // Speech is an enhancement, not a hard dependency.
  }
}

export function speak(text: string, options: SpeechOptions = {}): boolean {
  if (!speechSupported() || !text.trim()) return false;
  const synth = window.speechSynthesis;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const selected = options.voiceURI
      ? voices.find((voice) => voice.voiceURI === options.voiceURI)
      : undefined;
    if (selected) utterance.voice = selected;
    utterance.rate = Math.min(1.4, Math.max(0.6, options.rate ?? 0.95));
    utterance.pitch = 1;
    utterance.volume = Math.min(1, Math.max(0, options.volume ?? 0.95));
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function cancelSpeech(): void {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore unsupported cancel.
  }
}

export function subscribeToVoices(callback: () => void): () => void {
  if (!speechSupported()) return () => undefined;
  const synth = window.speechSynthesis;
  synth.addEventListener('voiceschanged', callback);
  return () => synth.removeEventListener('voiceschanged', callback);
}
