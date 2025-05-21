# Utility Rates Chat Agent (React + Azure OpenAI + MCP)

This project is a modern web application that provides a conversational chat interface for users to ask about utility rates (electricity, etc.) for any location. It leverages Azure OpenAI (GPT-4.1 mini) for natural language understanding and summarization, and an MCP (Model Context Protocol) server for real-time utility data.

## Features
- **Conversational Chat UI:** Users can type questions or use geolocation to ask about utility rates for their area.
- **Azure OpenAI Integration:** Uses GPT-4.1 mini (or other Azure OpenAI models) to power the agent, including function/tool calling.
- **MCP Server Integration:** Fetches real utility rate data for a given latitude/longitude from an MCP server.
- **Agent Orchestration:** The agent determines when to fetch utility data, calls the MCP server, and summarizes the results in plain English.
- **Secure Backend Proxy:** All OpenAI API calls are proxied through a Node.js Express backend, with secrets managed via environment variables and `.env`.
- **Extensible:** Easily add new tools/functions, data sources, or presentation features.

## How It Works
1. **User Interaction:** User enters a location or clicks "Detect My Location" in the chat UI.
2. **Agent Reasoning:** The frontend sends the message to the backend, which forwards it to Azure OpenAI.
3. **Function Calling:** If the agent needs utility data, it requests the `get_utility_rates` tool/function.
4. **MCP Data Fetch:** The frontend calls the MCP server for utility rates at the specified location.
5. **Summarization:** The utility data is sent back to the agent, which summarizes it for the user.
6. **Response:** The summary is displayed in the chat UI.

## Architecture
- **Frontend:** React (Vite), main logic in `src/App.tsx`.
- **Backend:** Node.js Express proxy (`server.js`), loads secrets from `.env` using `dotenv`.
- **MCP Client:** `src/mcpClient.ts` handles calls to the MCP server.
- **OpenAI Client:** `src/openaiSdkClient.ts` handles chat requests via the backend proxy.

See `COPILOT.md` and `ARCHITECTURE.md` for detailed workspace instructions and a Mermaid diagram of the system.

## Setup
1. Clone the repo.
2. Create a `.env` file at the project root with your Azure OpenAI endpoint and API key:
   ```
   OPENAI_ENDPOINT=your-endpoint-here
   OPENAI_API_KEY=your-api-key-here
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the backend proxy:
   ```
   node server.js
   ```
5. Start the frontend:
   ```
   npm run dev
   ```
6. Open the app in your browser and start chatting!

## Security
- **Secrets:** All API keys and endpoints are stored in `.env` (gitignored). Never commit secrets to source control.
- **Proxy:** The backend proxy ensures secrets are never exposed to the browser.

## Extending
- Add new tools/functions in `App.tsx` and update the backend as needed.
- Integrate new data sources by extending `mcpClient.ts`.
- Enhance the UI with charts, maps, or additional insights.

---

**This project demonstrates a modern, secure, and extensible approach to building conversational data-driven web apps with Azure OpenAI and real-world data sources.**
