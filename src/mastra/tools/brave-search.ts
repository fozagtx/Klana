import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const braveSearchSchema = z.object({
  query: z
    .string()
    .describe("The search query to search for educational content"),
  count: z
    .number()
    .optional()
    .default(10)
    .describe("Number of search results to return"),
  category: z
    .enum(["general", "academic", "news", "images"])
    .optional()
    .default("general")
    .describe("Type of search to perform"),
});

export const braveSearchTool = createTool({
  id: "brave_search",
  description:
    "Search the web using Brave Search API for educational content and learning resources.",
  inputSchema: braveSearchSchema,
  execute: async ({ context: { query, count = 10, category = "general" } }) => {
    const braveApiKey = process.env.BRAVE_API_KEY;

    if (!braveApiKey) {
      throw new Error(
        "BRAVE_API_KEY environment variable is not set. Please add your Brave Search API key to your .env file.",
      );
    }

    try {
      // Build search query with educational focus
      let searchQuery = query;
      if (category === "academic") {
        searchQuery = `${query} academic research study`;
      } else if (category === "news") {
        searchQuery = `${query} news latest updates`;
      } else {
        searchQuery = `${query} tutorial guide learn`;
      }

      // Call real Brave Search API
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=${count}`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": braveApiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Brave Search API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Transform Brave Search results to our format
      const results = (data.web?.results || [])
        .slice(0, count)
        .map((result: any, index: number) => {
          // Determine content type based on URL and title
          let type: "educational" | "tutorial" | "reference" | "news" =
            "educational";
          let difficulty: "beginner" | "intermediate" | "advanced" = "beginner";

          const title = result.title?.toLowerCase() || "";
          const url = result.url?.toLowerCase() || "";

          if (
            url.includes("tutorial") ||
            title.includes("tutorial") ||
            title.includes("how to")
          ) {
            type = "tutorial";
            difficulty = "beginner";
          } else if (
            url.includes("advanced") ||
            title.includes("advanced") ||
            title.includes("deep dive")
          ) {
            type = "reference";
            difficulty = "advanced";
          } else if (url.includes("news") || category === "news") {
            type = "news";
            difficulty = "intermediate";
          } else if (
            url.includes("edu") ||
            url.includes("academic") ||
            category === "academic"
          ) {
            type = "reference";
            difficulty = "intermediate";
          }

          // Estimate read time based on description length
          const descLength = result.description?.length || 0;
          const readTime = `${Math.max(2, Math.ceil(descLength / 200))} min read`;

          return {
            title: result.title || "Untitled",
            snippet: result.description || "No description available",
            url: result.url,
            type,
            difficulty,
            readTime,
            rank: index + 1,
            relevanceScore: Math.max(0.95 - index * 0.05, 0.3),
            searchQuery: query,
            category,
          };
        });

      // Generate educational suggestions
      const suggestions = [
        `${query} basics for beginners`,
        `${query} practical examples`,
        `${query} step by step guide`,
        `${query} best practices`,
      ];

      return {
        query,
        category,
        status: "complete",
        totalResults: results.length,
        results,
        suggestions,
        educationalLevel: category === "academic" ? "university" : "general",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message.includes("fetch")
            ? "Failed to connect to Brave Search API. Please check your internet connection."
            : `Brave search failed: ${error.message}`
          : "Brave search failed: Unknown error";

      throw new Error(errorMessage);
    }
  },
});
