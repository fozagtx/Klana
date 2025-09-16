import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

// Define the search result artifact schema
export const SearchResults = artifact(
  "searchResults",
  z.object({
    query: z.string(),
    category: z.enum(["general", "academic", "news", "images"]),
    status: z
      .enum(["loading", "streaming", "complete", "error"])
      .default("loading"),
    progress: z.number().min(0).max(1).default(0),
    totalResults: z.number().default(0),
    results: z
      .array(
        z.object({
          title: z.string(),
          snippet: z.string(),
          url: z.string(),
          type: z.enum(["educational", "tutorial", "reference", "news"]),
          difficulty: z.enum(["beginner", "intermediate", "advanced"]),
          readTime: z.string(),
          rank: z.number(),
          relevanceScore: z.number(),
          searchQuery: z.string(),
          category: z.string(),
        }),
      )
      .default([]),
    suggestions: z.array(z.string()).default([]),
    educationalLevel: z.string().default("general"),
    timestamp: z.string(),
    aiResponse: z.string().optional(),
    error: z.string().optional(),
  }),
);

export type SearchResultsType = z.infer<typeof SearchResults.schema>;
