import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { analyzeImageTool } from "../tools/analyzeImageTool";
import { fetchMarketDataTool } from "../tools/fetchMarketDataTool";
import { computeIndicatorsTool } from "../tools/computeIndicatorsTool";
import { webSearchTool } from "../tools/LiveSearchTool";
import { positionSuggesterTool } from "../tools/positionSuggesterTool";
import { tradeDecisionScorer } from "../scorers/tradeDecisionScorer";

const ctxSchema = z.object({
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
  context: z.string().optional(),

  symbol: z.string(),
  interval: z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d"]).default("1h"),
  range: z.string().default("200"),
  provider: z.enum(["alpha"]).default("alpha"),
  market: z.enum(["stock", "forex", "crypto"]).default("stock"),

  searchQuery: z.string().default(""),
  risk: z.object({ maxRiskPct: z.number().default(1), rrMin: z.number().default(2) }).default({
    maxRiskPct: 1,
    rrMin: 2,
  }),
  accountEquity: z.number().default(10000),
  timeframe: z.string().default("1h"),

  imageFindings: z.any().optional(),
  candles: z.any().optional(),
  indicators: z.any().optional(),
  results: z.any().optional(),
  suggestion: z.any().optional(),
  score: z.number().optional(),
  scoreReason: z.string().optional(),
  error: z.string().optional(),
});

const analyzeImageStep = createStep({
  id: "analyze-image-step",
  inputSchema: ctxSchema,
  outputSchema: ctxSchema,
  execute: async ({ inputData, mastra }) => {
    try {
      if (!inputData.imageUrl && !inputData.imageBase64) return { ...inputData };
      const res: any = await (analyzeImageTool as any).execute({ context: inputData, mastra } as any);
      return { ...inputData, imageFindings: (res as any)?.result ?? res };
    } catch (e) {
      return { ...inputData };
    }
  },
});

const fetchDataStep = createStep({
  id: "fetch-market-data-step",
  inputSchema: ctxSchema,
  outputSchema: ctxSchema,
  execute: async ({ inputData }) => {
    try {
      const res: any = await (fetchMarketDataTool as any).execute({ context: inputData } as any);
      return { ...inputData, candles: (res as any)?.candles, error: (res as any)?.error };
    } catch (e: any) {
      return { ...inputData, candles: undefined, error: e?.message ?? "failed to fetch market data" };
    }
  },
});

const computeIndicatorsStep = createStep({
  id: "compute-indicators-step",
  inputSchema: ctxSchema,
  outputSchema: ctxSchema,
  execute: async ({ inputData }) => {
    try {
      const candles = (inputData as any)?.candles;
      if (!candles || !Array.isArray(candles) || candles.length < 10) return { ...inputData, indicators: undefined };
      const res: any = await (computeIndicatorsTool as any).execute({ context: { candles } } as any);
      return { ...inputData, indicators: (res as any)?.indicators ?? res };
    } catch {
      return { ...inputData, indicators: undefined };
    }
  },
});

const liveSearchStep = createStep({
  id: "live-search-step",
  inputSchema: ctxSchema,
  outputSchema: ctxSchema,
  execute: async ({ inputData, mastra }) => {
    const query = (inputData.searchQuery && inputData.searchQuery.trim().length > 0)
      ? inputData.searchQuery
      : `${inputData.symbol} latest market news`;
    try {
      const res: any = await (webSearchTool as any).execute({ context: { query }, mastra } as any);
      return { ...inputData, results: (res as any)?.results ?? [], error: (res as any)?.error };
    } catch (e: any) {
      return { ...inputData, results: [], error: e?.message ?? "search failed" };
    }
  },
});

const suggestPositionStep = createStep({
  id: "position-suggestion-step",
  inputSchema: ctxSchema,
  outputSchema: ctxSchema,
  scorers: {
    tradeDecision: {
      scorer: tradeDecisionScorer,
      sampling: { type: "ratio", rate: 1 },
    },
  },
  execute: async ({ inputData, mastra }) => {
    const suggestion: any = await (positionSuggesterTool as any).execute({
      context: {
        symbol: inputData.symbol,
        timeframe: inputData.timeframe,
        findings: {
          image: inputData.imageFindings ?? {},
          indicators: inputData.indicators ?? {},
          search: inputData.results ?? [],
        },
        risk: inputData.risk,
        accountEquity: inputData.accountEquity,
      },
      mastra,
    } as any);
    return { ...inputData, suggestion: (suggestion as any)?.suggestion ?? suggestion };
  },
});

const scoreSuggestionStep = createStep({
  id: "score-suggestion-step",
  inputSchema: ctxSchema,
  outputSchema: ctxSchema,
  execute: async ({ inputData }) => {
    try {
      const runResult = await tradeDecisionScorer.run({
        input: {
          symbol: inputData.symbol,
          timeframe: inputData.timeframe,
          risk: inputData.risk,
          accountEquity: inputData.accountEquity,
          indicators: (inputData as any)?.indicators ?? {},
          imageFindings: (inputData as any)?.imageFindings ?? {},
          search: (inputData as any)?.results ?? [],
        },
        output: { suggestion: (inputData as any)?.suggestion ?? null },
      });
      return { ...inputData, score: runResult.score, scoreReason: runResult.reason };
    } catch (e: any) {
      return { ...inputData, score: 0, scoreReason: e?.message ?? "scoring failed" };
    }
  },
});

export const tradeDecisionWorkflow = createWorkflow({
  id: "trade-decision-workflow",
  steps: [
    analyzeImageStep,
    fetchDataStep,
    computeIndicatorsStep,
    liveSearchStep,
    suggestPositionStep,
    scoreSuggestionStep,
  ],
  inputSchema: ctxSchema,
  outputSchema: ctxSchema,
});

tradeDecisionWorkflow
  .then(analyzeImageStep)
  .then(fetchDataStep)
  .then(computeIndicatorsStep)
  .then(liveSearchStep)
  .then(suggestPositionStep)
  .then(scoreSuggestionStep)
  .commit();
