import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/i18n/dict";

const LANG_TO_BCP47: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
};

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const target = LANG_TO_BCP47[lang];
  // 1. Exact locale match
  const exact = voices.find((v) => v.lang === target);
  if (exact) return exact;
  // 2. Language prefix match (e.g. "hi" from "hi-IN")
  const prefix = target.split("-")[0];
  const partial = voices.find((v) => v.lang.startsWith(prefix));
  if (partial) return partial;
  // 3. Fallback: first available voice
  return voices[0] ?? null;
}

/** Strip markdown-style brackets from narrative sections */
function cleanText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]/g, "$1. ") // [Section] → "Section. "
    .replace(/•\s*/g, ". ")            // bullet points → pause
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function useVoice() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, lang: Lang) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // Cancel any in-progress speech
    window.speechSynthesis.cancel();
    setPaused(false);

    const utterance = new SpeechSynthesisUtterance(cleanText(text));
    utterance.lang = LANG_TO_BCP47[lang];
    utterance.rate = 0.88;   // slightly slower for clinical clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Voice selection — retry once voices load
    const assignVoice = () => {
      const voice = pickVoice(lang);
      if (voice) utterance.voice = voice;
    };
    assignVoice();
    // Retry after brief delay for browsers that load voices async
    setTimeout(assignVoice, 200);

    utterance.onstart = () => { setSpeaking(true); setPaused(false); };
    utterance.onend = () => { setSpeaking(false); setPaused(false); };
    utterance.onerror = () => { setSpeaking(false); setPaused(false); };

    utteranceRef.current = utterance;
    // Some browsers need a small delay after cancel() before speak()
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 80);
  }, []);

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  return { speak, stop, pause, resume, speaking, paused, isSupported };
}

// ─── Narration Script Builder ─────────────────────────────────────────────────
// Assembles a structured, clinical narration script from result page data.
// Language-keyed so narration never mixes languages.

interface NarrationInput {
  lang: Lang;
  severityLabel: string;
  recommendedAction: string;
  warningSign?: string[];
  comparisonTrend?: "improving" | "worsening" | "stable";
  comparisonReasons?: string[];
  previousDate?: string;
  guidance?: string; // raw editorial narrative text (may have [Section] markers)
  followUpDate?: string;
}

const NARRATION_PHRASES: Record<Lang, {
  opening: string;
  severity_prefix: string;
  action_prefix: string;
  warnings_prefix: string;
  comparison_improving: string;
  comparison_worsening: string;
  comparison_stable: string;
  previous_assessment: string;
  reasons_prefix: string;
  guidance_header: string;
  followup_prefix: string;
  closing: string;
}> = {
  en: {
    opening: "Healthcare guidance for this assessment.",
    severity_prefix: "Triage result:",
    action_prefix: "Recommended action:",
    warnings_prefix: "Watch carefully for these signs:",
    comparison_improving: "Condition appears to be improving compared to the previous assessment.",
    comparison_worsening: "New escalation indicators were detected. Condition may be worsening.",
    comparison_stable: "Condition remains stable since the last assessment.",
    previous_assessment: "Previous assessment recorded on",
    reasons_prefix: "Clinical observations:",
    guidance_header: "Care guidance follows.",
    followup_prefix: "A follow-up is scheduled for",
    closing: "End of guidance. Please consult your health worker for further assistance.",
  },
  hi: {
    opening: "इस मूल्यांकन के लिए स्वास्थ्य मार्गदर्शन।",
    severity_prefix: "ट्रिअज परिणाम:",
    action_prefix: "अनुशंसित कार्रवाई:",
    warnings_prefix: "इन संकेतों पर ध्यान दें:",
    comparison_improving: "पिछले मूल्यांकन की तुलना में स्थिति सुधर रही है।",
    comparison_worsening: "नए एस्केलेशन संकेत पाए गए हैं। स्थिति खराब हो सकती है।",
    comparison_stable: "पिछले मूल्यांकन के बाद से स्थिति स्थिर है।",
    previous_assessment: "पिछला मूल्यांकन दर्ज किया गया था",
    reasons_prefix: "नैदानिक अवलोकन:",
    guidance_header: "देखभाल मार्गदर्शन इस प्रकार है।",
    followup_prefix: "फ़ॉलो-अप निर्धारित है",
    closing: "मार्गदर्शन समाप्त। आगे की सहायता के लिए अपने स्वास्थ्य कार्यकर्ता से संपर्क करें।",
  },
  kn: {
    opening: "ಈ ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶನ.",
    severity_prefix: "ಟ್ರಯಾಜ್ ಫಲಿತಾಂಶ:",
    action_prefix: "ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ:",
    warnings_prefix: "ಈ ಚಿಹ್ನೆಗಳಿಗೆ ಗಮನ ನೀಡಿ:",
    comparison_improving: "ಹಿಂದಿನ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಹೋಲಿಸಿದರೆ ಸ್ಥಿತಿ ಸುಧಾರಿಸುತ್ತಿದೆ.",
    comparison_worsening: "ಹೊಸ ಹೆಚ್ಚಳ ಸೂಚಕಗಳು ಪತ್ತೆಯಾಗಿವೆ. ಸ್ಥಿತಿ ಹದಗೆಡುತ್ತಿರಬಹುದು.",
    comparison_stable: "ಕಳೆದ ಮೌಲ್ಯಮಾಪನದಿಂದ ಸ್ಥಿತಿ ಸ್ಥಿರವಾಗಿದೆ.",
    previous_assessment: "ಹಿಂದಿನ ಮೌಲ್ಯಮಾಪನ ದಾಖಲಾಗಿತ್ತು",
    reasons_prefix: "ಕ್ಲಿನಿಕಲ್ ಅವಲೋಕನಗಳು:",
    guidance_header: "ಆರೈಕೆ ಮಾರ್ಗದರ್ಶನ ಮುಂದೆ ಇದೆ.",
    followup_prefix: "ಫಾಲೋ-ಅಪ್ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ",
    closing: "ಮಾರ್ಗದರ್ಶನ ಮುಗಿಯಿತು. ಹೆಚ್ಚಿನ ಸಹಾಯಕ್ಕಾಗಿ ನಿಮ್ಮ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  },
};

export function buildNarrationScript(input: NarrationInput): string {
  const p = NARRATION_PHRASES[input.lang];
  const parts: string[] = [];

  parts.push(p.opening);
  parts.push(`${p.severity_prefix} ${input.severityLabel}.`);
  parts.push(`${p.action_prefix} ${input.recommendedAction}.`);

  // Continuity narration
  if (input.comparisonTrend) {
    if (input.previousDate) {
      parts.push(`${p.previous_assessment} ${input.previousDate}.`);
    }
    if (input.comparisonTrend === "improving") parts.push(p.comparison_improving);
    else if (input.comparisonTrend === "worsening") parts.push(p.comparison_worsening);
    else parts.push(p.comparison_stable);

    if (input.comparisonReasons?.length) {
      parts.push(p.reasons_prefix);
      parts.push(input.comparisonReasons.join(". ") + ".");
    }
  }

  // Warning signs
  if (input.warningSign?.length) {
    parts.push(p.warnings_prefix);
    parts.push(input.warningSign.join(". ") + ".");
  }

  // Editorial guidance (strip markup for clean TTS)
  if (input.guidance) {
    parts.push(p.guidance_header);
    parts.push(cleanText(input.guidance));
  }

  // Follow-up
  if (input.followUpDate) {
    parts.push(`${p.followup_prefix} ${input.followUpDate}.`);
  }

  parts.push(p.closing);
  return parts.join(" ");
}
