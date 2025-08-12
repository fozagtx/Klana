import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Simple indicator computation on normalized candles: { t, o, h, l, c, v }
export const computeIndicatorsTool = createTool({
  id: "compute-indicators",
  description: "Compute EMA(20,50), RSI(14), MACD(12,26,9), ATR(14) for given candles.",
  inputSchema: z.object({
    candles: z
      .array(
        z.object({
          t: z.number(),
          o: z.number(),
          h: z.number(),
          l: z.number(),
          c: z.number(),
          v: z.number().optional(),
        }),
      )
      .min(10),
  }),
  execute: async ({ context }) => {
    const { candles } = context;
    const closes = candles.map((k) => k.c);
    const highs = candles.map((k) => k.h);
    const lows = candles.map((k) => k.l);

    const ema = (period: number) => {
      const k = 2 / (period + 1);
      const out: number[] = [];
      let prev = closes[0];
      out.push(prev);
      for (let i = 1; i < closes.length; i++) {
        prev = closes[i] * k + prev * (1 - k);
        out.push(prev);
      }
      return out;
    };

    const ema20 = ema(20);
    const ema50 = ema(50);

    const rsi = (period: number) => {
      const gains: number[] = [];
      const losses: number[] = [];
      for (let i = 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        gains.push(Math.max(diff, 0));
        losses.push(Math.max(-diff, 0));
      }
      const avg = (arr: number[], start: number, len: number) =>
        arr.slice(start, start + len).reduce((a, b) => a + b, 0) / len;
      const rsiOut: number[] = new Array(period).fill(NaN);
      let avgGain = avg(gains, 0, period);
      let avgLoss = avg(losses, 0, period);
      rsiOut.push(100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss)));
      for (let i = period + 1; i < closes.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
        const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
        rsiOut.push(100 - 100 / (1 + rs));
      }
      return rsiOut;
    };

    const rsi14 = rsi(14);

    const macd = (fast = 12, slow = 26, signal = 9) => {
      const emaFast = (() => {
        const k = 2 / (fast + 1);
        const out: number[] = [];
        let prev = closes[0];
        out.push(prev);
        for (let i = 1; i < closes.length; i++) {
          prev = closes[i] * k + prev * (1 - k);
          out.push(prev);
        }
        return out;
      })();
      const emaSlow = (() => {
        const k = 2 / (slow + 1);
        const out: number[] = [];
        let prev = closes[0];
        out.push(prev);
        for (let i = 1; i < closes.length; i++) {
          prev = closes[i] * k + prev * (1 - k);
          out.push(prev);
        }
        return out;
      })();
      const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
      const signalLine = (() => {
        const k = 2 / (signal + 1);
        const out: number[] = [];
        let prev = macdLine[0];
        out.push(prev);
        for (let i = 1; i < macdLine.length; i++) {
          prev = macdLine[i] * k + prev * (1 - k);
          out.push(prev);
        }
        return out;
      })();
      const hist = macdLine.map((v, i) => v - signalLine[i]);
      return { macdLine, signalLine, hist };
    };

    const macdVals = macd(12, 26, 9);

    const atr = (period = 14) => {
      const trs: number[] = [];
      for (let i = 0; i < highs.length; i++) {
        const prevClose = i > 0 ? closes[i - 1] : closes[i];
        const tr = Math.max(
          highs[i] - lows[i],
          Math.abs(highs[i] - prevClose),
          Math.abs(lows[i] - prevClose),
        );
        trs.push(tr);
      }
      const out: number[] = [];
      let prev = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out.push(prev);
      for (let i = period; i < trs.length; i++) {
        prev = (prev * (period - 1) + trs[i]) / period;
        out.push(prev);
      }
      return out;
    };

    const atr14 = atr(14);

    const result = {
      ema: { ema20: ema20.at(-1) ?? NaN, ema50: ema50.at(-1) ?? NaN },
      rsi: { rsi14: rsi14.at(-1) ?? NaN },
      macd: {
        macd: macdVals.macdLine.at(-1) ?? NaN,
        signal: macdVals.signalLine.at(-1) ?? NaN,
        hist: macdVals.hist.at(-1) ?? NaN,
      },
      atr: { atr14: atr14.at(-1) ?? NaN },
    };

    return { indicators: result };
  },
});
