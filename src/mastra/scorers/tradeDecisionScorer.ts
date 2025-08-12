import { createScorer } from "@mastra/core/scores";
import { z } from "zod";

// Trade Decision Scorer: evaluates the suggested position and produces a score and reason
// This scorer is fully function-based (no LLM/judge required) for deterministic scoring.

export type TradeScorerInput = {
  symbol: string;
  timeframe: string;
  risk: { maxRiskPct: number; rrMin: number };
  accountEquity: number;
  indicators?: Record<string, any>;
  imageFindings?: Record<string, any>;
  search?: Array<any>;
};

export type TradeScorerRunOutput = {
  suggestion: {
    direction?: "buy" | "sell" | "wait" | string;
    confidence?: number; // 0..1
    entry?: number;
    stop?: number;
    target?: number;
    notes?: string;
    [k: string]: any;
  } | null;
};

export const tradeDecisionScorer = createScorer<TradeScorerInput, TradeScorerRunOutput>({
  name: "trade-decision-scorer",
  description: "Scores the suggested trade decision using simple deterministic heuristics.",
})
  // Optionally preprocess context from input/output
  .preprocess(({ run }) => {
    const input = run.input ?? ({} as TradeScorerInput);
    const out = run.output?.suggestion ?? null;
    const hasLevels = out && Number.isFinite(out.entry) && Number.isFinite(out.stop) && Number.isFinite(out.target);

    const rr = hasLevels && out
      ? Math.abs(((out.target as number) - (out.entry as number)) / Math.max(1e-8, Math.abs((out.entry as number) - (out.stop as number))))
      : null;

    return {
      direction: out?.direction ?? "unknown",
      confidence: typeof out?.confidence === "number" ? Math.max(0, Math.min(1, out!.confidence)) : 0,
      rr,
      rrMin: input.risk?.rrMin ?? 2,
      indicators: input.indicators ?? {},
      hasLevels: Boolean(hasLevels),
    };
  })
  // Analyze to produce intermediate metrics
  .analyze(async ({ results }) => {
    const { rr, rrMin, confidence, direction, indicators, hasLevels } = results as any;

    // Simple indicator-based boost: favor confluence
    let confluenceBoost = 0;
    try {
      const trend = indicators?.trend ?? "neutral";
      const rsi = indicators?.rsi;
      if (direction === "buy" && trend === "up") confluenceBoost += 0.1;
      if (direction === "sell" && trend === "down") confluenceBoost += 0.1;
      if (typeof rsi === "number") {
        if (direction === "buy" && rsi > 40 && rsi < 70) confluenceBoost += 0.05;
        if (direction === "sell" && rsi < 60 && rsi > 30) confluenceBoost += 0.05;
      }
    } catch {}

    const rrOk = typeof rr === "number" && rr >= rrMin;
    const base = confidence || 0;
    const levelsBonus = hasLevels ? 0.1 : 0; // prefer well-defined levels
    const rrBonus = rrOk ? 0.15 : -0.1; // penalize if RR is below threshold

    const provisional = Math.max(0, Math.min(1, base + confluenceBoost + levelsBonus + rrBonus));

    return {
      rr,
      rrOk,
      confluenceBoost,
      provisional,
    };
  })
  // Final numeric score 0..1
  .generateScore(({ results }) => {
    const { provisional } = results as any;
    return Math.max(0, Math.min(1, Number(provisional ?? 0)));
  })
  // Human-readable reason string
  .generateReason(({ results }) => {
    const { rr, rrOk, confluenceBoost, provisional } = results as any;
    const parts: string[] = [];
    parts.push(`RR: ${rr ?? "n/a"} (${rrOk ? "OK" : "below threshold"})`);
    if (confluenceBoost > 0) parts.push(`confluence +${confluenceBoost.toFixed(2)}`);
    parts.push(`score=${(provisional ?? 0).toFixed(2)}`);
    return parts.join("; ");
  });
