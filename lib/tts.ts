function isFemaleLikeVoiceName(name: string): boolean {
  return /(female|woman|samantha|victoria|karen|mei|hui|ling|ting|hsin|chia|yin)/i.test(name);
}

function chooseVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const sameLang = voices.filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  const targetPool = sameLang.length ? sameLang : voices;
  const female = targetPool.find((v) => isFemaleLikeVoiceName(v.name));
  return female ?? targetPool[0] ?? null;
}

export function speakText(text: string, lang: "zh-TW" | "en-US" = "zh-TW"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 1;
  utter.pitch = 1.05;
  utter.volume = 1;
  const voice = chooseVoice(lang);
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
