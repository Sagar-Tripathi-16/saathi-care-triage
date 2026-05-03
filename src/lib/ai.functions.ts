import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
const inputSchema = z.object({
  severity: z.enum(["Emergency", "PHC Referral", "Home Care"]),
  urgency: z.string(),
  recommended_action: z.string(),
  reasoning: z.array(z.string()),
  warning_signs: z.array(z.string()),
  explanations: z.array(z.string()),
  patient_category: z.string(),
  language: z.enum(["en", "hi", "kn"]),
});

const LANG_NAME: Record<string, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  kn: "Kannada (Kannada script)",
};

// Timeout wrapper for fetch/promise
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((reason) => {
        clearTimeout(timer);
        reject(reason);
      });
  });
}

export const simplifyExplanation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { default: OpenAI } = await import("openai");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI not configured" };
    }

    const severity = data.severity;
    const targetLang = LANG_NAME[data.language];

    const system = `You are a calm, trusted healthcare communication assistant for ASHA and ANM frontline health workers in rural India.

YOUR ROLE:
- You are ONLY a communication layer. The triage has already been completed by a certified clinical rule engine.
- Your sole job is to translate the clinical outcome into clear, warm, human-centered language that a health worker can share with the patient and family.

ABSOLUTE CONSTRAINTS — NEVER VIOLATE:
- The severity level (${severity}) is FINAL. You cannot change or downgrade it.
- The urgency and recommended action are FINAL. You cannot alter them.
- DO NOT diagnose conditions or invent medical certainty.
- DO NOT add medicines, dosages, or treatment plans that were not in the original data.
- DO NOT create fear or panic. Be calm and supportive.
- If you do not know something, say so gently.

TONE:
- Calm, warm, and professional — like a trusted senior nurse.
- Short, clear sentences. Avoid jargon.
- Emotionally intelligent. Acknowledge the patient's situation with care.
- Field-worker friendly — the text will be read aloud to patients and families.

Write in ${targetLang} only.`;

    const userPayload = {
      severity: data.severity,
      patient_category: data.patient_category,
      urgency: data.urgency,
      recommended_action: data.recommended_action,
      reasoning: data.reasoning,
      warning_signs: data.warning_signs,
    };

    const prompt = `Based on the clinical triage data below, write a calm, patient-friendly healthcare explanation in ${targetLang}.

Structure your response with exactly these four sections. Use the exact section headings in ${targetLang} (or their equivalent):

[Situation]
Briefly explain what the health assessment found — 2 to 3 calm, reassuring sentences. Do not repeat the severity label mechanically.

[What To Do Now]
Clearly state the immediate next steps. Be direct but gentle. Base this strictly on the recommended_action below.

[Watch Carefully]
List the warning signs to monitor. If things get worse, the patient should seek help immediately.

[Follow-up]
State when and how to follow up. Keep it practical for a rural healthcare setting.

Do NOT use JSON. Do NOT use markdown code blocks. Write plain, readable text sections.

Clinical context:
${JSON.stringify(userPayload, null, 2)}
`;

    try {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      });

      console.log("[SERVER] OpenRouter request starting");

      const request = client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
      });

      // 15 second timeout for offline/poor connectivity resilience
      const result = await withTimeout(request, 15000);
      console.log("[SERVER] OpenRouter response received");

      const responseText = result.choices[0]?.message?.content;

      if (!responseText) return { ok: false as const, error: "no_output" };

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (err) {
        console.log("[SERVER] OpenRouter parse failed");
        return { ok: false as const, error: "parse_failed" };
      }

      return { ok: true as const, simplified: parsed };
    } catch (e: any) {
      console.error("simplifyExplanation failed:", e);
      if (e.message === "timeout") return { ok: false as const, error: "timeout" };
      if (e.status === 429) return { ok: false as const, error: "rate_limit" };
      return { ok: false as const, error: "network" };
    }
  });
