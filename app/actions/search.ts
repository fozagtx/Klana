"use server";

import { mastra } from "@/src/mastra";

export async function searchEducationalContent(formData: FormData) {
  try {
    const query = formData.get("query")?.toString();
    const category = formData.get("category")?.toString() || "general";

    if (!query || typeof query !== "string") {
      throw new Error("Query is required and must be a string");
    }

    const agent = mastra.getAgent("learningAgent");

    // Generate response using the agent with proper tool calling
    // The artifacts are handled by the tool itself via streaming
    const result = await agent.generate(
      [
        {
          role: "user",
          content: `I need educational content about: "${query}". Please use the brave search tool to find relevant learning resources in the "${category}" category. Focus on educational value and provide comprehensive learning materials.`,
        },
      ],
      {
        maxSteps: 3, // Allow multiple tool calls
        onStepFinish: ({ toolCalls }) => {
          if (toolCalls && toolCalls.length > 0) {
            console.log("Tool called:", toolCalls[0]?.toolName);
          }
        },
      },
    );

    return {
      success: true,
      aiResponse: result.text,
      metadata: {
        timestamp: new Date().toISOString(),
        model: "gpt-4o-mini",
        finishReason: result.finishReason,
      },
    };
  } catch (error) {
    console.error("Search action error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      error: "Failed to process search request",
      details: errorMessage,
    };
  }
}
