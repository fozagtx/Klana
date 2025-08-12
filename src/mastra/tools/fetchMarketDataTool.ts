import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Fetch OHLCV data from supported providers (Alpha Vantage or Finnhub)
export const fetchMarketDataTool = createTool({
  id: "fetch-market-data",
  description:
    "Fetch OHLCV candles for a symbol. Supports Alpha Vantage or Finnhub if API keys are present.",
  inputSchema: z.object({
    symbol: z.string().describe("Ticker, e.g., AAPL, BTCUSD, EURUSD"),
    interval: z
      .enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d"]) // normalized intervals
      .default("1h"),
    range: z.string().default("200"), // number of candles to return (best-effort)
    provider: z.enum(["alpha", "finnhub"]).default("alpha"),
    market: z
      .enum(["stock", "forex", "crypto"]) // hints mapping for providers
      .default("stock"),
  }),
  execute: async ({ context }) => {
    const { symbol, interval, range, provider, market } = context;

    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
    const finnhubKey = process.env.FINNHUB_API_KEY;

    try {
      if (provider === "alpha") {
        if (!alphaKey) {
          return { error: "Missing ALPHA_VANTAGE_API_KEY" };
        }
        // Alpha Vantage mapping
        // Note: Alpha's intraday supports stocks; crypto/forex use different endpoints
        const size = "compact"; // compact ~ last 100 points, full more
        let url = "";
        if (market === "stock") {
          const intervalMap: Record<string, string> = {
            "1m": "1min",
            "5m": "5min",
            "15m": "15min",
            "30m": "30min",
            "1h": "60min",
            "4h": "60min", // fallback
            "1d": "Daily",
          };
          const iv = intervalMap[interval] ?? "60min";
          if (interval === "1d") {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(
              symbol,
            )}&outputsize=${size}&apikey=${alphaKey}`;
          } else {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(
              symbol,
            )}&interval=${iv}&outputsize=${size}&apikey=${alphaKey}`;
          }
        } else if (market === "crypto") {
          url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${encodeURIComponent(
            symbol,
          )}&market=USD&apikey=${alphaKey}`;
        } else {
          // forex
          url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${encodeURIComponent(
            symbol.slice(0, 3),
          )}&to_symbol=${encodeURIComponent(symbol.slice(3))}&apikey=${alphaKey}`;
        }

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Alpha Vantage HTTP ${resp.status}`);
        const data = await resp.json();

        // Normalize to candles
        const candles: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> = [];
        const series =
          data["Time Series (Daily)"] ||
          data["Time Series (60min)"] ||
          data["Time Series (30min)"] ||
          data["Time Series (15min)"] ||
          data["Time Series (5min)"] ||
          data["Time Series (1min)"] ||
          data["Time Series FX (Daily)"] ||
          data["Time Series (Digital Currency Daily)"];

        if (series && typeof series === "object") {
          for (const [ts, vals] of Object.entries<any>(series)) {
            const t = new Date(ts).getTime();
            const o = parseFloat(vals["1. open"] ?? vals["1a. open (USD)"] ?? vals["1. open"]);
            const h = parseFloat(vals["2. high"] ?? vals["2a. high (USD)"] ?? vals["2. high"]);
            const l = parseFloat(vals["3. low"] ?? vals["3a. low (USD)"] ?? vals["3. low"]);
            const c = parseFloat(vals["4. close"] ?? vals["4a. close (USD)"] ?? vals["4. close"]);
            const v = parseFloat(vals["5. volume"] ?? vals["5. volume"] ?? vals["5. volume"] ?? 0);
            if ([o, h, l, c].every(Number.isFinite)) candles.push({ t, o, h, l, c, v: Number.isFinite(v) ? v : 0 });
          }
          candles.sort((a, b) => a.t - b.t);
          const out = candles.slice(-Number(range));
          return { candles: out };
        }

        return { error: "Alpha Vantage: unexpected response" };
      }

      // Finnhub branch
      if (!finnhubKey) {
        return { error: "Missing FINNHUB_API_KEY" };
      }
      const intervalMap: Record<string, string> = {
        "1m": "1",
        "5m": "5",
        "15m": "15",
        "30m": "30",
        "1h": "60",
        "4h": "240",
        "1d": "D",
      };
      const iv = intervalMap[interval] ?? "60";
      const now = Math.floor(Date.now() / 1000);
      const from = now - 60 * 60 * 24 * 60; // ~60 days
      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(
        symbol,
      )}&resolution=${iv}&from=${from}&to=${now}&token=${finnhubKey}`;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Finnhub HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.s !== "ok") return { error: `Finnhub: ${data.s}` };

      const candles = data.t.map((t: number, i: number) => ({
        t: t * 1000,
        o: data.o[i],
        h: data.h[i],
        l: data.l[i],
        c: data.c[i],
        v: data.v[i] ?? 0,
      }));
      const out = candles.slice(-Number(range));
      return { candles: out };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg };
    }
  },
});
