# Klana - AI Learning Assistant 🎓

A Next.js learning application powered by **real Mastra agents** with **live educational search** capabilities, featuring prompt-kit inspired UI components and real-time search results.

## ✨ Features

🤖 **Real Mastra AI Agent Integration**
- Learning-focused agent following Mastra documentation patterns
- **Real Brave Search API integration** for live educational content discovery
- **Zero mock data** - all results are fetched in real-time
- Proper agent-tool architecture with multi-step reasoning

🎨 **Prompt-Kit Inspired UI**
- Beautiful, accessible prompt input components
- Educational search interface with category filtering
- Professional design with student-centric features
- Real-time progress indicators during search

🔍 **Live Search Capabilities**
- **Real Brave Search API** integration for authentic results
- Educational content discovery with intelligent categorization
- Difficulty-based content classification (Beginner → Advanced)
- Real-time search suggestions and topic exploration

🎯 **Student-Focused Features**
- Live educational content types (Tutorial, Reference, News)
- Real reading time estimates from actual content
- Learning tips and study strategy recommendations
- Actual URLs to educational resources

## 🏗️ Architecture (Following Mastra Docs)

```
klana/
├── src/
│   └── mastra/
│       ├── index.ts              # Mastra instance
│       ├── agents/
│       │   └── learning-agent.ts # Learning assistant agent
│       └── tools/
│           └── brave-search.ts   # Real Brave Search tool
├── app/
│   ├── api/search/route.ts       # Search API endpoint
│   ├── layout.tsx                # App layout
│   └── page.tsx                  # Main page
├── components/
│   ├── ui/
│   │   └── prompt-input.tsx      # Prompt-kit inspired components
│   ├── search-artifact.tsx       # Live search results display
│   └── learning-search-interface.tsx  # Main interface
└── hooks/
    └── use-search-agent.ts       # Search agent hook
```

### ✅ Proper Mastra Implementation

Following the official Mastra documentation:

- **Agent Definition**: Uses `Agent` class from `@mastra/core/agent`
- **Tool Creation**: Uses `createTool` from `@mastra/core/tools`
- **Mastra Instance**: Proper `Mastra` class initialization
- **Real API Integration**: Actual Brave Search API calls
- **Tool Schemas**: Proper Zod input/output schemas
- **Agent Instructions**: Educational-focused system prompts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- **OpenAI API key** (required)
- **Brave Search API key** (for real-time search)

### Installation

1. **Clone and install dependencies:**
```bash
cd klana
bun install
```

2. **Set up environment variables:**
```bash
# Copy the environment template
cp .env.local .env.local
```

Add your API keys to `.env.local`:
```env
# Required: OpenAI API Key for Mastra agent
OPENAI_API_KEY=your_openai_api_key_here

# Required: Brave Search API Key for real-time search
# Get your API key from: https://api.search.brave.com/
BRAVE_API_KEY=your_brave_api_key_here
```

3. **Start development server:**
```bash
bun run dev
```

4. **Visit the application:**
Open [http://localhost:3000](http://localhost:3000)

## 🔧 How It Works

### Real-Time Search Flow

1. **User Input**: Student enters a search query
2. **API Call**: Frontend calls `/api/search` endpoint
3. **Mastra Agent**: Server-side agent processes the request
4. **Tool Execution**: Agent calls `braveSearchTool` with real API
5. **Live Results**: Brave Search API returns actual educational content
6. **AI Enhancement**: Agent analyzes and categorizes results educationally
7. **Response**: Structured educational data sent to frontend

### Search Categories
- **General**: Broad educational content discovery
- **Academic**: University-level scholarly resources  
- **News**: Educational news and recent developments
- **Images**: Visual learning materials

### Educational Features
- **Real Difficulty Levels**: AI-analyzed content difficulty
- **Live Content Types**: Actual educational guides, tutorials, references
- **Accurate Read Times**: Estimated from real content length
- **Smart Suggestions**: Generated from actual search patterns

## 🛠️ Mastra Integration Details

### Agent Configuration

```typescript
// src/mastra/agents/learning-agent.ts
export const learningAgent = new Agent({
  name: 'Learning Assistant',
  description: 'An AI learning assistant...',
  instructions: `You are an AI learning assistant...`,
  model: openai("gpt-4o-mini"),
  tools: { braveSearchTool }
});
```

### Real Search Tool

```typescript
// src/mastra/tools/brave-search.ts
export const braveSearchTool = createTool({
  id: "brave_search",
  description: "Search the web using Brave Search API...",
  inputSchema: z.object({ /* ... */ }),
  outputSchema: z.object({ /* ... */ }),
  execute: async ({ context }) => {
    // REAL Brave Search API call
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
      headers: { 'X-Subscription-Token': braveApiKey }
    });
    // Process real results...
  }
});
```

### API Integration

```typescript
// app/api/search/route.ts
const agent = mastra.getAgent('learningAgent');
const result = await agent.generate([...], {
  maxSteps: 3 // Allow multiple tool calls
});
```

## 🌟 Key Differences from Mock Implementation

### ❌ What We Removed
- All mock data and placeholder content
- Fake search results and dummy URLs
- Hardcoded educational content
- Static response simulation

### ✅ What We Implemented
- **Real Brave Search API** integration
- **Live educational content** discovery
- **Actual URLs** to learning resources
- **Dynamic difficulty analysis** using AI
- **Real-time progress tracking**
- **Authentic reading time estimates**

## 📚 Usage Examples

### Example Searches
Try these real searches:
- "Machine Learning fundamentals"
- "React hooks tutorial"
- "Python data structures guide" 
- "JavaScript async programming"

All results will be **real educational content** fetched live from the web!

## 🔧 Development

### Adding New Features
1. Create tools in `src/mastra/tools/`
2. Add to agent in `src/mastra/agents/`
3. Register in `src/mastra/index.ts`

### API Keys Setup
1. **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com/)
2. **Brave Search**: Get from [Brave Search API](https://api.search.brave.com/)

## 📊 Technologies

- **Framework**: Next.js 15 with Turbopack
- **AI Framework**: Mastra (following official docs)
- **AI Model**: OpenAI GPT-4o-mini
- **Search API**: Brave Search API (real-time)
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom prompt-kit inspired
- **Package Manager**: Bun
- **TypeScript**: Full type safety

## 🌈 Educational Focus

This application is specifically designed for students with:
- **Real educational content** discovery
- **Live learning resource** aggregation
- **Intelligent difficulty** assessment
- **Actual study materials** and references
- **Authentic learning paths** and suggestions

## 📝 License

MIT License - see LICENSE file for details.

---

**Built with real-time educational search for students and learners everywhere!** 🚀📚

*No mock data, no placeholders - just real learning resources powered by AI.* ✨