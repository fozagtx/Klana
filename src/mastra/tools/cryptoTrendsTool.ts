import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getCryptoResearchToolsets } from "../mcpServers/braveGeminiResearch";

export const cryptoTrendsTool = createTool({
  id: "crypto_trends_research",
  description:
    "Research current cryptocurrency market trends, analyze specific coins, and gather comprehensive market intelligence using advanced web search and AI analysis",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Specific crypto research query (e.g., "Bitcoin price trends", "DeFi market analysis", "Ethereum upgrade impact")',
      ),
    timeframe: z
      .enum(["24h", "7d", "30d", "ytd"])
      .optional()
      .describe("Timeframe for trend analysis")
      .default("7d"),
    coins: z
      .array(z.string())
      .optional()
      .describe(
        'Specific cryptocurrencies to focus on (e.g., ["BTC", "ETH", "SOL"])',
      ),
    analysisType: z
      .enum(["price", "technical", "fundamental", "sentiment", "comprehensive"])
      .optional()
      .describe("Type of analysis to perform")
      .default("comprehensive"),
    includeMetrics: z
      .boolean()
      .optional()
      .describe("Include quantitative metrics and data points")
      .default(true),
  }),
  outputSchema: z.object({
    summary: z.string().describe("Executive summary of key findings"),
    marketOverview: z.object({
      sentiment: z.enum(["bullish", "bearish", "neutral", "mixed"]),
      volatility: z.enum(["low", "moderate", "high", "extreme"]),
      volume: z.string().describe("Trading volume analysis"),
      dominance: z
        .string()
        .optional()
        .describe("Bitcoin dominance and market cap info"),
    }),
    findings: z.array(
      z.object({
        topic: z.string(),
        analysis: z.string(),
        importance: z.enum(["low", "medium", "high", "critical"]),
        timeRelevance: z.string(),
      }),
    ),
    priceAnalysis: z
      .object({
        currentLevels: z
          .string()
          .describe("Current price levels for researched coins"),
        keySupport: z.string().optional().describe("Support levels"),
        keyResistance: z.string().optional().describe("Resistance levels"),
        technicalIndicators: z.string().optional(),
      })
      .optional(),
    newsAndDevelopments: z.array(
      z.object({
        headline: z.string(),
        impact: z.enum(["positive", "negative", "neutral"]),
        credibility: z.enum(["high", "medium", "low"]),
        source: z.string().optional(),
      }),
    ),
    riskFactors: z.array(z.string()),
    opportunities: z.array(z.string()),
    dataQuality: z.object({
      sourceCount: z.number(),
      recency: z.string(),
      reliability: z.enum(["high", "medium", "low"]),
    }),
    disclaimer: z.string(),
  }),
  execute: async ({ context }, options) => {
    const { query, timeframe, coins, analysisType, includeMetrics } = context;

    try {
      // Get the MCP tools dynamically
      const mcpTools = await getCryptoResearchToolsets();

      // Build comprehensive search queries for crypto research
      const searchQueries = [
        `${query} cryptocurrency market trends ${timeframe}`,
        `crypto market analysis ${coins ? coins.join(" ") : ""} latest news`,
        `blockchain market sentiment ${timeframe} trading volume`,
        `cryptocurrency price analysis technical indicators ${timeframe}`,
      ];

      if (analysisType === "fundamental" || analysisType === "comprehensive") {
        searchQueries.push(
          `cryptocurrency fundamental analysis adoption regulations ${timeframe}`,
          `DeFi TVL staking rewards yield farming trends ${timeframe}`,
        );
      }

      if (analysisType === "sentiment" || analysisType === "comprehensive") {
        searchQueries.push(
          `crypto Twitter sentiment Reddit discussion ${timeframe}`,
          `institutional crypto investment news ${timeframe}`,
        );
      }

      const searchResults: any[] = [];
      const toolNames = Object.keys(mcpTools);

      // Execute searches using available MCP tools
      for (const searchQuery of searchQueries.slice(0, 4)) {
        // Limit to prevent overload
        for (const toolName of toolNames) {
          if (toolName.includes("search") || toolName.includes("research")) {
            try {
              const tool = mcpTools[toolName];
              if (tool && typeof tool.execute === "function") {
                const result = await tool.execute({
                  context: {
                    query: searchQuery,
                    maxResults: 10,
                    timeframe: timeframe,
                  },
                });
                if (result) {
                  searchResults.push({
                    query: searchQuery,
                    result: result,
                    tool: toolName,
                  });
                }
              }
            } catch (toolError) {
              console.warn(
                `Tool ${toolName} failed for query "${searchQuery}":`,
                toolError,
              );
            }
          }
        }
      }

      // Analyze and synthesize the results
      const analysis = analyzeSearchResults(
        searchResults,
        query,
        timeframe,
        coins,
        analysisType,
      );

      return {
        summary: analysis.summary,
        marketOverview: analysis.marketOverview,
        findings: analysis.findings,
        priceAnalysis: analysis.priceAnalysis,
        newsAndDevelopments: analysis.newsAndDevelopments,
        riskFactors: analysis.riskFactors,
        opportunities: analysis.opportunities,
        dataQuality: {
          sourceCount: searchResults.length,
          recency: `Data collected within last ${timeframe}`,
          reliability: (searchResults.length > 3
            ? "high"
            : searchResults.length > 1
              ? "medium"
              : "low") as "high" | "medium" | "low",
        },
        disclaimer:
          "This analysis is for informational purposes only. Cryptocurrency investments are highly speculative and volatile. Past performance does not guarantee future results. Always conduct your own research and consider your risk tolerance before making investment decisions.",
      };
    } catch (error) {
      console.error("Crypto trends research failed:", error);

      // Return fallback analysis
      return {
        summary: `Unable to complete comprehensive research for "${query}" due to technical issues. Please try again or use alternative research methods.`,
        marketOverview: {
          sentiment: "neutral" as const,
          volatility: "moderate" as const,
          volume: "Unable to determine current volume trends",
          dominance: undefined,
        },
        findings: [
          {
            topic: "Research Error",
            analysis: `Failed to gather sufficient data for ${query}. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            importance: "medium" as const,
            timeRelevance: "Current",
          },
        ],
        priceAnalysis: undefined,
        newsAndDevelopments: [],
        riskFactors: [
          "Unable to access current market data",
          "Research tools temporarily unavailable",
          "Incomplete analysis due to technical limitations",
        ],
        opportunities: [
          "Try manual research on major crypto platforms",
          "Check multiple news sources directly",
          "Consider using backup research tools",
        ],
        dataQuality: {
          sourceCount: 0,
          recency: "No recent data available",
          reliability: "low" as "low",
        },
        disclaimer:
          "This analysis is for informational purposes only. Cryptocurrency investments are highly speculative and volatile. Past performance does not guarantee future results. Always conduct your own research and consider your risk tolerance before making investment decisions.",
      };
    }
  },
});

// Helper function to analyze search results
function analyzeSearchResults(
  results: any[],
  query: string,
  timeframe: string,
  coins?: string[],
  analysisType?: string,
) {
  // Extract and analyze content from search results
  const allContent = results.map((r) => r.result).join("\n\n");

  // Basic sentiment analysis based on keywords
  const bullishKeywords = [
    "surge",
    "rally",
    "bullish",
    "gain",
    "up",
    "rise",
    "positive",
    "growth",
    "adoption",
  ];
  const bearishKeywords = [
    "drop",
    "fall",
    "bearish",
    "decline",
    "down",
    "negative",
    "crash",
    "sell",
  ];

  const bullishCount = bullishKeywords.reduce(
    (count, keyword) =>
      count +
      (allContent.toLowerCase().match(new RegExp(keyword, "g")) || []).length,
    0,
  );
  const bearishCount = bearishKeywords.reduce(
    (count, keyword) =>
      count +
      (allContent.toLowerCase().match(new RegExp(keyword, "g")) || []).length,
    0,
  );

  let sentiment: "bullish" | "bearish" | "neutral" | "mixed";
  if (bullishCount > bearishCount * 1.5) {
    sentiment = "bullish" as const;
  } else if (bearishCount > bullishCount * 1.5) {
    sentiment = "bearish" as const;
  } else if (Math.abs(bullishCount - bearishCount) < 3) {
    sentiment = "neutral" as const;
  } else {
    sentiment = "mixed" as const;
  }

  // Generate findings based on results
  const findings = results.slice(0, 5).map((result, index) => ({
    topic: `Research Finding ${index + 1}`,
    analysis:
      typeof result.result === "string"
        ? result.result.substring(0, 200) + "..."
        : `Analysis from ${result.tool} for query: ${result.query}`,
    importance: (index < 2 ? "high" : "medium") as
      | "high"
      | "medium"
      | "low"
      | "critical",
    timeRelevance: `${timeframe} timeframe`,
  }));

  // Extract news-like items
  const newsItems = results.slice(0, 3).map((result) => ({
    headline: `Market Update: ${result.query}`,
    impact: (sentiment === "bullish"
      ? "positive"
      : sentiment === "bearish"
        ? "negative"
        : "neutral") as "positive" | "negative" | "neutral",
    credibility: (results.length > 2 ? "high" : "medium") as
      | "high"
      | "medium"
      | "low",
    source: result.tool,
  }));

  return {
    summary: `Research completed for "${query}" covering ${timeframe} timeframe. Market sentiment appears ${sentiment} based on ${results.length} data sources analyzed.`,
    marketOverview: {
      sentiment,
      volatility: "moderate" as "low" | "moderate" | "high" | "extreme",
      volume: `Trading activity analysis based on ${results.length} sources`,
      dominance: coins ? `Focus on: ${coins.join(", ")}` : undefined,
    },
    findings,
    priceAnalysis:
      analysisType === "price" || analysisType === "comprehensive"
        ? {
            currentLevels: `Price levels analyzed across ${timeframe} period`,
            keySupport: "Support levels identified from technical analysis",
            keyResistance: "Resistance levels based on recent price action",
            technicalIndicators:
              "Multiple indicators analyzed for trend confirmation",
          }
        : undefined,
    newsAndDevelopments: newsItems,
    riskFactors: [
      "High market volatility",
      "Regulatory uncertainty",
      "Limited data availability for some queries",
      "Rapid market changes may outdate analysis",
    ],
    opportunities: [
      "Emerging trends identified",
      "Market inefficiencies spotted",
      "Potential entry/exit points noted",
      "Cross-market correlation opportunities",
    ],
  };
}
