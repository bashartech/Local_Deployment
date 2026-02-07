/**
 * MCP Server Configuration
 * This module exports configuration settings for the MCP server
 */

export const config = {
  server: {
    port: parseInt(process.env.MCP_SERVER_PORT || '3001', 10),
    host: process.env.MCP_SERVER_HOST || 'localhost',
  },
  logging: {
    level: process.env.MCP_LOG_LEVEL || 'info',
  },
  // Add other configuration as needed
};