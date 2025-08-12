import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Analyzes a chart/screenshot to extract trading-relevant signals
// Uses an existing LLM agent to reason over the provided image URL/base64 and context.
export const analyzeImageTool = createTool({
  id: "analyze-image",
  description:
    "Analyze a trading image (chart or screenshot) to extract instrument, timeframe, patterns, S/R, and an initial signal.",
  inputSchema: z.object({
    imageUrl: z.string().url().optional().describe("Publicly accessible image URL"),
    imageBase64: z
      .string()
      .optional()
      .describe("Base64 encoded image (data:image/png;base64,...) if URL is not available"),
    context: z
      .string()
      .optional()
      .describe("Optional user context: symbol hint, timeframe, notes"),
  }),
  execute: async ({ context, mastra }) => {
    const { imageUrl, imageBase64, context: userContext } = context;

    if (!imageUrl && !imageBase64) {
      return {
        result: {
          instrument: null,
          timeframe: null,
          patterns: [],
          supportResistance: [],
          notes: "No image provided",
          signal: { direction: "unknown", confidence: 0 },
        },
      };
    }

    // Reuse evaluationAgent for structured reasoning
    const agent = mastra!.getAgent("evaluationAgent");

    const prompt = `You are a trading assistant. Analyze the provided chart image and extract structured findings.
Return a concise JSON with:
- instrument: string | null
- timeframe: string | null
- patterns: string[]
- supportResistance: string[]
- notes: short text
- signal: { direction: "buy" | "sell" | "wait" | "unknown", confidence: number (0-1) }

User context: ${userContext ?? "(none)"}`;

    const messages = [
      { role: "user" as const, content: prompt },
    ];

    const response = await agent.generate(messages, {
      experimental_output: z.object({
        instrument: z.string().nullable(),
        timeframe: z.string().nullable(),
        patterns: z.array(z.string()).default([]),
        supportResistance: z.array(z.string()).default([]),
        notes: z.string().default("")
          .describe("Short analysis notes"),
        signal: z.object({
          direction: z.enum(["buy", "sell", "wait", "unknown"]).default("unknown"),
          confidence: z.number().min(0).max(1).default(0),
        }),
      }),
    });

    return { result: response.object };
  },
});
