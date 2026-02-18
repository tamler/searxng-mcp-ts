import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import {
  ErrorCode,
  McpError,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js'
import axios, { AxiosInstance } from 'axios'
import { z } from 'zod'
import pkg from '../package.json' with { type: 'json' }

// Read SearxNG URL from environment variable
function getSearxNGUrl(): string {
  const url = process.env.SEARXNG_URL
  if (!url) {
    throw new Error('SEARXNG_URL environment variable is required')
  }

  // Validate the URL format
  try {
    new URL(url)
  } catch (e) {
    throw new Error(`Invalid SEARXNG_URL: ${url}`)
  }

  return url
}

// Parse custom headers from environment variables
function parseCustomHeaders(): Record<string, string> {
  const customHeaders: Record<string, string> = {}
  
  // Process all environment variables
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue
    
    // Handle AUTHORIZATION_HEADER
    if (key === 'AUTHORIZATION_HEADER') {
      customHeaders['Authorization'] = value
      console.error(`[SearxNG MCP] Added Authorization header from ${key}`)
      continue
    }
    
    // Handle X_*_HEADER pattern (e.g., X_CUSTOM_HEADER -> X-Custom-Header)
    if (key.startsWith('X_') && key.endsWith('_HEADER')) {
      // Extract the middle part (e.g., X_CUSTOM_HEADER -> CUSTOM)
      const headerPart = key.slice(2, -7) // Remove 'X_' prefix and '_HEADER' suffix
      
      // Skip if headerPart is empty (e.g., X__HEADER)
      if (!headerPart) {
        console.error(`[SearxNG MCP] Skipping invalid header environment variable: ${key}`)
        continue
      }
      
      // Convert to proper header format (e.g., CUSTOM -> Custom)
      const headerName = `X-${headerPart
        .split('_')
        .filter(part => part.length > 0) // Filter out empty parts from consecutive underscores
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-')}`
      customHeaders[headerName] = value
      console.error(`[SearxNG MCP] Added custom header ${headerName} from ${key}`)
    }
  }
  
  return customHeaders
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
})

// Infer the type from the Zod schema
type SearchToolArgs = z.infer<typeof SearchToolArgsSchema>

export interface ServerInfo {
  name: string
  version: string
  description: string
}

/**
 * Creates and configures a McpServer with the SearxNG search tool registered.
 * This can be used with any transport (stdio, HTTP, etc.).
 */
export function createSearxNGMcpServer(): { mcpServer: McpServer; serverInfo: ServerInfo; searxngUrl: string } {
  const searxngUrl = getSearxNGUrl()
  const customHeaders = parseCustomHeaders()

  const serverInfo: ServerInfo = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  }

  const mcpServer = new McpServer(serverInfo)

  const axiosInstance: AxiosInstance = axios.create({
    baseURL: searxngUrl,
    headers: {
      Accept: 'application/json',
      ...customHeaders,
    },
  })

  // Register the search tool
  mcpServer.tool(
    'search',
    'Perform a search using the configured SearxNG instance.',
    SearchToolArgsSchema.shape,
    async (args: SearchToolArgs): Promise<CallToolResult> => {
      const params: Record<string, string | number | undefined> = {
        q: args.query,
        format: 'json',
      }
      if (args.categories) params.categories = args.categories
      if (args.language) params.language = args.language
      if (args.page_number) params.pageno = args.page_number
      if (args.time_range) params.time_range = args.time_range
      if (args.safesearch !== undefined) params.safesearch = args.safesearch

      console.error(`[SearxNG MCP] Received search query: "${args.query}"`)
      try {
        const response = await axiosInstance.get('/', { params })

        console.error(
          `[SearxNG MCP] Successfully fetched search results for query: "${args.query}"`
        )

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
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
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
          throw error
        } else if (error instanceof Error) {
          errorMessage = `Unexpected error: ${error.message}`
        } else {
          errorMessage = `An unknown error occurred.`
        }

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
  mcpServer.server.onerror = (error: unknown) =>
    console.error('[MCP Error]', error)

  return { mcpServer, serverInfo, searxngUrl }
}
