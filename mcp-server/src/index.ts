import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from './config/index.js';
import { setupTools } from './tools/index.js';
import { fileURLToPath } from "url";
import path from "path";

let serverInstance = null;

async function startMCPServer() {
  try {
    // Create server instance for Todo AI Chatbot
    const server = new McpServer({
      name: "TodoAIChatbotMCP",
      version: "1.0.0",
    });

    // Store server instance for cleanup
    serverInstance = server;

    // Set up the tools that will be available to the AI agent
    const tools = await setupTools();

    // Add tools to the server
    for (const tool of tools) {
      server.registerTool(tool.name, tool.definition, tool.handler);
    }

    // Create the stdio transport for communication
    const transport = new StdioServerTransport();

    // Connect the server to the transport using the correct API
    await server.connect(transport);

    console.error("Todo AI Chatbot MCP Server started successfully");

    // Set up graceful shutdown
    setupGracefulShutdown(server);

  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

function setupGracefulShutdown(server:any) {
  const shutdownHandler = async () => {
    console.error('Shutting down MCP server gracefully...');

    try {
      // Close the server if it's available
      if (server && typeof server.close === 'function') {
        await server.close();
      }

      console.error('MCP server closed successfully');
    } catch (err) {
      console.error('Error during MCP server shutdown:', err);
    } finally {
      process.exit(0);
    }
  };

  // Listen for termination signals
  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);
  process.on('SIGUSR2', shutdownHandler); // For nodemon restart
}

// Start the server when this file is executed directly
// if (typeof require !== 'undefined' && require.main === module) {
//   startMCPServer();
// }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv[1] === __filename) {
  startMCPServer();
}

export { startMCPServer };