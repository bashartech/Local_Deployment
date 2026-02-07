/**
 * Tools setup module for Todo AI Chatbot
 * Implements all required MCP tools for task management
 */

// Import zod for schema validation (as used in the MCP SDK examples)
import { z } from "zod";

// Define the structure for MCP tools
interface MCPTaskTool {
  name: string;
  definition: {
    title: string;
    description: string;
    inputSchema: z.ZodSchema | Record<string, any>;
    outputSchema?: z.ZodSchema | Record<string, any>;
  };
  handler: (params: any) => Promise<any>;
}

// Import the specific task tools
import {
  createAddTaskTool,
  createListTasksTool,
  createCompleteTaskTool,
  createDeleteTaskTool,
  createUpdateTaskTool
} from './task-tools.js';

/**
 * Sets up all the MCP tools for the Todo AI Chatbot
 * Returns an array of tools that will be registered with the MCP server
 */
export async function setupTools(): Promise<MCPTaskTool[]> {
  console.error('Setting up MCP tools for Todo AI Chatbot');

  // Create and return all the task management tools
  const tools = [
    await createAddTaskTool(),
    await createListTasksTool(),
    await createCompleteTaskTool(),
    await createDeleteTaskTool(),
    await createUpdateTaskTool()
  ];

  console.error(`Registered ${tools.length} MCP tools`);
  return tools;
}