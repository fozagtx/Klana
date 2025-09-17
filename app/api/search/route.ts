import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/src/mastra";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category = "general" } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    const agent = mastra.getAgent("learningAgent");

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

    return NextResponse.json({
      success: true,
      aiResponse: result.text,
      metadata: {
        timestamp: new Date().toISOString(),
        model: "gpt-4o-mini",
        finishReason: result.finishReason,
      },
    });
  } catch (error) {
    console.error("Search API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process search request",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
