import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const positionSuggesterTool = createTool({
  id: "position-suggester",
  description:
    "Merge image findings, indicators, and news to propose an actionable position with risk controls.",
  inputSchema: z.object({
    symbol: z.string(),
    timeframe: z.string().default("1h"),
    findings: z.object({
      image: z
        .object({
          instrument: z.string().nullable().optional(),
          timeframe: z.string().nullable().optional(),
          patterns: z.array(z.string()).optional(),
          supportResistance: z.array(z.string()).optional(),
          notes: z.string().optional(),
          signal: z
            .object({ direction: z.string(), confidence: z.number() })
            .optional(),
        })
        .optional(),
      indicators: z
        .object({
          ema: z.object({ ema20: z.number(), ema50: z.number() }).optional(),
          rsi: z.object({ rsi14: z.number() }).optional(),
          macd: z
            .object({ macd: z.number(), signal: z.number(), hist: z.number() })
            .optional(),
          atr: z.object({ atr14: z.number() }).optional(),
        })
        .optional(),
      search: z
        .array(z.object({ title: z.string(), url: z.string(), content: z.string() }))
        .default([]),
    }),
    risk: z
      .object({ maxRiskPct: z.number().default(1), rrMin: z.number().default(2) })
      .default({ maxRiskPct: 1, rrMin: 2 }),
    accountEquity: z.number().default(10000),
  }),
  execute: async ({ context, mastra }) => {
    const { symbol, timeframe, findings, risk, accountEquity } = context;

    const agent = mastra!.getAgent("reportAgent");

    const prompt = `You are a disciplined trading assistant. Propose one clear action given:
Symbol: ${symbol}
Timeframe: ${timeframe}

Image findings: ${JSON.stringify(findings.image ?? {}, null, 2)}
Indicators: ${JSON.stringify(findings.indicators ?? {}, null, 2)}
News/Sentiment: ${JSON.stringify(findings.search ?? [], null, 2)}

Constraints:
- Risk max ${risk.maxRiskPct}% of equity ${accountEquity}
- Minimum risk:reward ${risk.rrMin}:1
- Provide only one plan with fields below. If no edge, suggest WAIT.

Return JSON with:
{
  action: "buy" | "sell" | "wait",
  entry: number | null,
  stop: number | null,
  targets: number[],
  size: number, // position size in units or contracts (estimate)
  rationale: string,
  confidence: number // 0-1
}`;

    const response = await agent.generate(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        experimental_output: z.object({
          action: z.enum(["buy", "sell", "wait"]).default("wait"),
          entry: z.number().nullable(),
          stop: z.number().nullable(),
          targets: z.array(z.number()).default([]),
          size: z.number().default(0),
          rationale: z.string().default(""),
          confidence: z.number().min(0).max(1).default(0.3),
        }),
      },
    );

    return { suggestion: response.object };
  },
});
