#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config()

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js' // Use McpServer
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import {
  ErrorCode,
  McpError,
  CallToolResult, // Need this for the tool callback return type
} from '@modelcontextprotocol/sdk/types.js'
import axios, { AxiosInstance } from 'axios'
import { z } from 'zod' // Import zod

// Read SearxNG URL from environment variable
const SEARXNG_URL = process.env.SEARXNG_URL
if (!SEARXNG_URL) {
  throw new Error('SEARXNG_URL environment variable is required')
}

// Validate the URL format
try {
  new URL(SEARXNG_URL)
} catch (e) {
  throw new Error(`Invalid SEARXNG_URL: ${SEARXNG_URL}`)
}

// Define the Zod schema for the search tool arguments
const SearchToolArgsSchema = z.object({
  query: z.string().describe('The search query.'),
  categories: z
    .string()
    .optional()
    .describe(
      'Comma-separated list of search categories (e.g., "general,images,videos"). Defaults to "general".'
    ),
  language: z
    .string()
    .optional()
    .describe(
      'Search language code (e.g., "en", "de"). Defaults to instance default.'
    ),
  page_number: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Page number for results pagination. Defaults to 1.'),
  time_range: z
    .enum(['day', 'week', 'month', 'year'])
    .optional()
    .describe(
      'Filter results by time range (e.g., "day", "week", "month", "year").'
    ),
  safesearch: z
    .union([z.literal(0), z.literal(1), z.literal(2)])
    .optional()
    .describe(
      'Safe search level: 0 (off), 1 (moderate), 2 (strict). Defaults to instance default.'
    ),
  // Removed format parameter
  // Add other relevant SearxNG parameters as needed
})

// Infer the type from the Zod schema
type SearchToolArgs = z.infer<typeof SearchToolArgsSchema>

class SearxNGServer {
  private mcpServer: McpServer // Use McpServer instance
  private serverInfo // Store server info locally
  private axiosInstance: AxiosInstance

  constructor() {
    // Store server info
    this.serverInfo = {
      name: 'mcp-server-searxng',
      version: '0.1.0',
      description: 'MCP for SearxNG',
    }
    // Instantiate McpServer, passing the stored info
    this.mcpServer = new McpServer(this.serverInfo, {
      // McpServer manages tool capabilities automatically
    })

    this.axiosInstance = axios.create({
      baseURL: SEARXNG_URL,
      headers: {
        Accept: 'application/json',
      },
    })

    // Register the tool using mcpServer.tool()
    this.mcpServer.tool(
      'search', // Tool name
      'Perform a search using the configured SearxNG instance.', // Tool description
      SearchToolArgsSchema.shape, // Pass the raw shape, not the object
      async (args: SearchToolArgs): Promise<CallToolResult> => {
        // Tool callback
        // Map MCP tool arguments to SearxNG query parameters
        const params: Record<string, string | number | undefined> = {
          q: args.query,
          format: 'json', // Always request JSON format
        }
        if (args.categories) params.categories = args.categories
        if (args.language) params.language = args.language
        if (args.page_number) params.pageno = args.page_number // SearxNG uses 'pageno'
        if (args.time_range) params.time_range = args.time_range
        if (args.safesearch !== undefined) params.safesearch = args.safesearch
        // Removed comment about format

        console.error(`[SearxNG MCP] Received search query: "${args.query}"`)
        try {
          // Make the request, axios will parse JSON by default
          const response = await this.axiosInstance.get('/', { params })

          console.error(
            `[SearxNG MCP] Successfully fetched search results for query: "${args.query}"`
          )

          // Basic check for successful response
          // Check if the response looks like valid JSON results
          if (typeof response.data !== 'object' || response.data === null) {
            const errorText =
              typeof response.data === 'string'
                ? response.data.substring(0, 500)
                : 'Non-JSON response received'
            console.error(
              `[SearxNG MCP] SearxNG returned unexpected response format for query "${args.query}": ${errorText}`
            )
            throw new McpError(
              ErrorCode.InternalError,
              `SearxNG returned an unexpected response: ${errorText}`
            )
          }

          return {
            content: [
              {
                type: 'text', // MCP expects standard types like 'text'
                text: JSON.stringify(response.data, null, 2), // Stringify the JSON response
              },
            ],
          }
        } catch (error: unknown) {
          console.error(
            `[SearxNG MCP] An error occurred in search tool for query "${args.query}":`,
            error
          )
          let errorMessage = 'Failed to fetch search results from SearxNG.'
          let errorCode = ErrorCode.InternalError

          if (axios.isAxiosError(error)) {
            errorMessage = `SearxNG API error: ${error.message}`
            if (error.response) {
              errorMessage += ` Status: ${
                error.response.status
              }. Response: ${JSON.stringify(error.response.data).substring(
                0,
                200
              )}`
              if (error.response.status === 404) {
                errorCode = ErrorCode.InvalidRequest
              } else if (error.response.status >= 500) {
                errorCode = ErrorCode.InternalError
              }
            } else if (error.request) {
              errorMessage += ' No response received from SearxNG instance.'
              errorCode = ErrorCode.InternalError
            }
          } else if (error instanceof McpError) {
            throw error // Re-throw McpErrors directly
          } else if (error instanceof Error) {
            errorMessage = `Unexpected error: ${error.message}`
          } else {
            errorMessage = `An unknown error occurred.`
          }

          // Return an error structure for non-McpError issues
          return {
            content: [
              {
                type: 'text',
                text: errorMessage,
              },
            ],
            isError: true,
            errorCode: error instanceof McpError ? error.code : errorCode,
          }
        }
      }
    )

    // Error handling for the underlying server
    this.mcpServer.server.onerror = (error: unknown) =>
      console.error('[MCP Error]', error)
    process.on('SIGINT', async () => {
      await this.mcpServer.server.close() // Close the underlying server
      process.exit(0)
    })
  }

  // No need for setupToolHandlers anymore, McpServer handles it

  async run() {
    const transport = new StdioServerTransport()
    // Connect the underlying Server instance from McpServer
    await this.mcpServer.server.connect(transport)
    // Use console.error for logs to avoid interfering with stdio transport
    const serverInfo = this.serverInfo // Access stored info
    console.error(
      `SearxNG MCP server (${serverInfo?.name} v${serverInfo?.version}) running on stdio, connected to ${SEARXNG_URL}`
    )
  }
}

// Create and run the server instance
const server = new SearxNGServer()
server.run().catch((error) => {
  console.error('Failed to start SearxNG MCP server:', error)
  process.exit(1)
})
