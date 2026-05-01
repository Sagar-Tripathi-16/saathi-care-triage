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

export const simplifyExplanation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI not configured" };
    }

    const targetLang = LANG_NAME[data.language];

    const system = `You are a translation and simplification helper for ASHA community health workers in rural India. You will receive a triage result that has ALREADY been decided by a deterministic rule engine. Your ONLY job is to rewrite the explanation in simple, kind, clear ${targetLang} for a frontline worker to read aloud to a family.

ABSOLUTE RULES — do not violate:
- DO NOT change the severity level.
- DO NOT add any diagnosis, disease name, medicine name, dosage, or treatment.
- DO NOT add new medical claims or warnings beyond what is given.
- DO NOT remove any warning signs or recommended actions.
- Keep sentences short. Avoid jargon. Use respectful tone.
- Output JSON only.`;

    const userPayload = {
      severity: data.severity,
      urgency: data.urgency,
      recommended_action: data.recommended_action,
      reasoning: data.reasoning,
      warning_signs: data.warning_signs,
      explanations: data.explanations,
    };

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content:
                `Rewrite this triage result in ${targetLang}. Return JSON via the tool. Keep meaning identical.\n\n` +
                JSON.stringify(userPayload, null, 2),
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_simplified",
                description: "Return the simplified, translated triage explanation.",
                parameters: {
                  type: "object",
                  properties: {
                    headline: { type: "string", description: "One short line for the worker to say first." },
                    why: { type: "array", items: { type: "string" } },
                    warning_signs: { type: "array", items: { type: "string" } },
                    recommended_action: { type: "string" },
                  },
                  required: ["headline", "why", "warning_signs", "recommended_action"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_simplified" } },
        }),
      });

      if (resp.status === 429) return { ok: false as const, error: "rate_limit" };
      if (resp.status === 402) return { ok: false as const, error: "credits" };
      if (!resp.ok) {
        console.error("AI gateway error", resp.status, await resp.text());
        return { ok: false as const, error: "ai_error" };
      }

      const json = (await resp.json()) as {
        choices?: Array<{
          message?: {
            tool_calls?: Array<{ function?: { arguments?: string } }>;
          };
        }>;
      };
      const argsStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!argsStr) return { ok: false as const, error: "no_output" };
      const parsed = JSON.parse(argsStr);
      return { ok: true as const, simplified: parsed };
    } catch (e) {
      console.error("simplifyExplanation failed", e);
      return { ok: false as const, error: "network" };
    }
  });
