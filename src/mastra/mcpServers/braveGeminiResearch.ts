import { MCPServer } from "@mastra/mcp";
import { Agent } from "@mastra/core/agent";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createSmitheryUrl } from "@smithery/sdk";

const smitheryApiKey = process.env.SMITHERY_API_KEY;
const smitheryProfile = process.env.SMITHERY_PROFILE;

const serverUrl = createSmitheryUrl(
  "https://server.smithery.ai/@falahgs/brave-gemini-research-mcp-server",
  {
    apiKey: smitheryApiKey,
    profile: smitheryProfile,
  },
);

const transport = new StreamableHTTPClientTransport(serverUrl);

const client = new Client({
  name: "Mastra Crypto Research App",
  version: "1.0.0",
});

let isConnected = false;

async function ensureConnection() {
  if (!isConnected) {
    try {
      await client.connect(transport);
      isConnected = true;
      console.log("✅ Connected to Brave Gemini Research MCP server");
    } catch (error) {
      console.error("❌ Failed to connect to MCP server:", error);
      throw error;
    }
  }
}

export async function getCryptoResearchTools() {
  try {
    await ensureConnection();

    const mcpTools = await client.listTools();
    console.log(
      `📚 Available tools: ${mcpTools.tools.map((t) => t.name).join(", ")}`,
    );

    const mastraTools: Record<string, any> = {};

    for (const tool of mcpTools.tools) {
      mastraTools[tool.name] = {
        id: tool.name,
        description: tool.description || `MCP tool: ${tool.name}`,
        inputSchema: tool.inputSchema || {},
        execute: async ({ context }: { context: any }) => {
          try {
            const result = await client.callTool({
              name: tool.name,
              arguments: context,
            });

            if (result.content && Array.isArray(result.content)) {
              // Extract text content from MCP response
              return result.content
                .filter((item: any) => item.type === "text")
                .map((item: any) => item.text)
                .join("\n");
            }

            return result;
          } catch (error) {
            console.error(`❌ Tool ${tool.name} execution failed:`, error);
            throw error;
          }
        },
      };
    }

    return mastraTools;
  } catch (error) {
    console.error("❌ Failed to get crypto research tools:", error);
    return {};
  }
}

export async function getCryptoResearchToolsets() {
  try {
    const tools = await getCryptoResearchTools();
    console.log(
      `✅ Got crypto research toolsets: ${Object.keys(tools).join(", ")}`,
    );
    return tools;
  } catch (error) {
    console.error("❌ Failed to get crypto research toolsets:", error);
    return {};
  }
}

export async function listAvailableCryptoTools() {
  try {
    await ensureConnection();

    const mcpTools = await client.listTools();

    console.log("\n🔧 Available Crypto Research Tools:");
    console.log("=".repeat(50));

    mcpTools.tools.forEach((tool) => {
      console.log(`📋 Tool: ${tool.name}`);
      if (tool.description) {
        console.log(`   Description: ${tool.description}`);
      }
      if (tool.inputSchema) {
        console.log(
          `   Input Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`,
        );
      }
      console.log("");
    });

    return mcpTools.tools;
  } catch (error) {
    console.error("❌ Failed to list crypto research tools:", error);
    return [];
  }
}

export async function testCryptoResearchConnection() {
  try {
    console.log("🔗 Testing connection to Brave Gemini Research MCP server...");
    console.log("🌐 Using StreamableHTTP transport with Smithery SDK...");

    await ensureConnection();

    const mcpTools = await client.listTools();
    const toolCount = mcpTools.tools.length;

    console.log(
      `✅ Connection successful! Found ${toolCount} available tools.`,
    );

    if (toolCount > 0) {
      console.log("Available tools:");
      mcpTools.tools.forEach((tool) => {
        console.log(
          `  - ${tool.name}: ${tool.description || "No description"}`,
        );
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    console.log("\n🔧 Troubleshooting Tips:");
    console.log("1. Check your internet connection");
    console.log(
      "2. Verify the Smithery API key and profile are correct in .env",
    );
    console.log("3. Ensure the server URL is accessible");
    console.log("4. Check if there are any firewall or proxy issues");
    return false;
  }
}

// Execute a crypto research query directly with MCP tools
export async function executeCryptoQuery(query: string, toolName?: string) {
  try {
    await ensureConnection();

    const mcpTools = await client.listTools();
    const availableTools = mcpTools.tools;

    if (availableTools.length === 0) {
      throw new Error("No MCP tools available");
    }

    // Use specified tool or find a search-like tool
    let selectedTool = availableTools[0]; // Default to first tool

    if (toolName) {
      const found = availableTools.find((t) => t.name === toolName);
      if (found) selectedTool = found;
    } else {
      // Try to find a search-like tool
      const searchTool = availableTools.find(
        (tool) =>
          tool.name.toLowerCase().includes("search") ||
          tool.name.toLowerCase().includes("research") ||
          tool.name.toLowerCase().includes("query") ||
          tool.name.toLowerCase().includes("brave"),
      );

      if (searchTool) selectedTool = searchTool;
    }

    console.log(`🔍 Using tool: ${selectedTool.name}`);

    const result = await client.callTool({
      name: selectedTool.name,
      arguments: {
        query: query,
        maxResults: 10,
      },
    });

    return result;
  } catch (error) {
    console.error("❌ Failed to execute crypto query:", error);
    throw error;
  }
}

// Utility function to search for specific crypto topics
export async function searchCryptoTrends(
  cryptocurrency: string = "Bitcoin",
  timeframe: string = "7d",
) {
  const query = `${cryptocurrency} market trends and price analysis ${timeframe}`;
  console.log(`🔍 Searching crypto trends: ${query}`);

  try {
    const result = await executeCryptoQuery(query);
    return {
      query,
      cryptocurrency,
      timeframe,
      result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ Failed to search trends for ${cryptocurrency}:`, error);
    return {
      query,
      cryptocurrency,
      timeframe,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

export async function disconnectCryptoResearch() {
  try {
    if (isConnected) {
      isConnected = false;
      console.log("✅ Disconnected from Brave Gemini Research MCP server");
    }
  } catch (error) {
    console.error("❌ Error disconnecting from crypto research server:", error);
  }
}

// Export the client for advanced usage
export { client as mcpClient };
