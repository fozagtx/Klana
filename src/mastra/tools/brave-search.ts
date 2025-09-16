import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { SearchResults } from "../../artifacts/search";

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

interface BraveSearchResult {
  title?: string;
  description?: string;
  url: string;
}

interface BraveSearchResponse {
  web?: {
    results?: BraveSearchResult[];
  };
}

export const braveSearchTool = createTool({
  id: "brave_search",
  description:
    "Search the web using Brave Search API for educational content and learning resources. Streams real-time results with progress updates.",
  inputSchema: braveSearchSchema,
  execute: async ({ query, count = 10, category = "general" }) => {
    // Initialize streaming search results artifact
    const searchArtifact = SearchResults.stream({
      query,
      category,
      status: "loading",
      progress: 0,
      totalResults: 0,
      results: [],
      suggestions: [],
      educationalLevel: category === "academic" ? "university" : "general",
      timestamp: new Date().toISOString(),
    });

    const braveApiKey = process.env.BRAVE_API_KEY;

    if (!braveApiKey) {
      await searchArtifact.error({
        ...searchArtifact.data,
        status: "error",
        error:
          "BRAVE_API_KEY environment variable is not set. Please add your Brave Search API key to your .env file.",
      });
      throw new Error(
        "BRAVE_API_KEY environment variable is not set. Please add your Brave Search API key to your .env file.",
      );
    }

    try {
      // Update status to streaming
      await searchArtifact.update({
        ...searchArtifact.data,
        status: "streaming",
        progress: 0.2,
      });

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

      // Update progress
      await searchArtifact.update({
        ...searchArtifact.data,
        progress: 0.5,
      });

      if (!response.ok) {
        throw new Error(
          `Brave Search API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as BraveSearchResponse;

      // Update progress after API response
      await searchArtifact.update({
        ...searchArtifact.data,
        progress: 0.8,
      });

      // Transform Brave Search results to our format
      const results = (data.web?.results || [])
        .slice(0, count)
        .map((result: BraveSearchResult, index: number) => {
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

      // Complete the artifact with final results
      await searchArtifact.complete({
        query,
        category,
        status: "complete",
        progress: 1.0,
        totalResults: results.length,
        results,
        suggestions,
        educationalLevel: category === "academic" ? "university" : "general",
        timestamp: new Date().toISOString(),
      });

      return {
        query,
        category,
        totalResults: results.length,
        results,
        suggestions,
        educationalLevel: category === "academic" ? "university" : "general",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Update artifact with error state
      const errorMessage =
        error instanceof Error
          ? error.message.includes("fetch")
            ? "Failed to connect to Brave Search API. Please check your internet connection."
            : `Brave search failed: ${error.message}`
          : "Brave search failed: Unknown error";

      await searchArtifact.error({
        ...searchArtifact.data,
        status: "error",
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },
});
