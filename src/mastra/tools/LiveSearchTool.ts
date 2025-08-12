import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import "dotenv/config";

export const webSearchTool = createTool({
  id: "web-search",
  description:
    "Search the web for information on a specific query using Brave Search and return summarized content",
  inputSchema: z.object({
    query: z.string().describe("The search query to run"),
  }),
  execute: async ({ context, mastra }) => {
    console.log("Executing web search tool (Brave)");
    const { query } = context;

    try {
      const apiKey = process.env.BRAVE_API_KEY;
      if (!apiKey) {
        console.error("Error: BRAVE_API_KEY not found in environment variables");
        return { results: [], error: "Missing API key" };
      }

      console.log(`Searching web (Brave) for: "${query}"`);
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query,
      )}&count=3`;

      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Brave API error ${resp.status}: ${text}`);
      }

      const data: any = await resp.json();
      const braveResults: Array<{
        title?: string;
        url?: string;
        description?: string;
      }> = data?.web?.results ?? [];

      if (!braveResults || braveResults.length === 0) {
        console.log("No search results found");
        return { results: [], error: "No results found" };
      }

      console.log(`Found ${braveResults.length} search results, summarizing content...`);

      const summaryAgent = mastra!.getAgent("webSummarizationAgent");

      const processedResults: Array<{ title: string; url: string; content: string }> = [];
      for (const r of braveResults) {
        const title = r.title ?? "";
        const url = r.url ?? "";
        const text = r.description ?? "";

        try {
          // If we have at least some snippet/description, try summarizing it.
          if (!text || text.length < 50) {
            processedResults.push({
              title,
              url,
              content: text || "No content available",
            });
            continue;
          }

          const summaryResponse = await summaryAgent.generate([
            {
              role: "user",
              content: `Please summarize the following web content for research query: "${query}"

Title: ${title || "No title"}
URL: ${url}
Content: ${text.substring(0, 8000)}...

Provide a concise summary that captures the key information relevant to the research query.`,
            },
          ]);

          processedResults.push({
            title,
            url,
            content: summaryResponse.text,
          });

          console.log(`Summarized content for: ${title || url}`);
        } catch (summaryError) {
          console.error("Error summarizing content:", summaryError);
          processedResults.push({
            title,
            url,
            content: text ? `${text.substring(0, 500)}...` : "Content unavailable",
          });
        }
      }

      return {
        results: processedResults,
      };
    } catch (error) {
      console.error("Error searching the web (Brave):", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error details:", errorMessage);
      return {
        results: [],
        error: errorMessage,
      };
    }
  },
});
