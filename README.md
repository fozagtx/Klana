🚀 Mastra Trading Agent
A powerful, AI-driven cryptocurrency trading and research agent built with Mastra's workflow architecture. It provides real-time market analysis, automated trading execution, and comprehensive reporting delivered via email.

✨ Features

AI-Powered Market Analysis: Uses advanced AI models (via Mistral) to analyze cryptocurrency market trends and generate actionable insights.
Automated Trading: Integrates with trading platforms like Brave Gemini MCP for seamless trade execution.
Email Reporting: Sends detailed market reports and trading summaries to your inbox using Resend.
Human-in-the-Loop: Allows users to review and approve research findings or trading strategies before execution.
Resilient & Modular: Built with error handling, suspend/resume capabilities, and independent components for easy maintenance.


🔑 Quick Setup
Follow these steps to set up and run the Mastra Trading Agent.
Prerequisites

Accounts with:
Mistral for AI model access
Resend for email reporting
Smithery for trading infrastructure


1. Clone the Repository
git clone https://github.com/fozagtx/mastra-trading-agent.git
cd mastra-trading-agent

3. Configure Environment Variables
Create a .env file in the project root with the following:
# AI Services
MISTRAL_API_KEY=your-mistral-key
EXA_API_KEY=your-exa-api-key
RESEND_API_KEY=your-resend-key
DEFAULT_SENDER_EMAIL=reports@yourdomain.com

# Trading Infrastructure
SMITHERY_PROFILE=brave-gemini_mcp_server
SMITHERY_API_KEY=your-smithery-key


Note: Obtain your API keys from:

Mistral Dashboard
Exa Dashboard
Resend Dashboard
Smithery Brave Gemini MCP


4. Run the Application
npm run dev
