#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config()

import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { createSearxNGMcpServer } from './server.js'

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '127.0.0.1'
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '100', 10)

// Validate configuration at startup
const { serverInfo, searxngUrl } = createSearxNGMcpServer()

// Track transports by session ID for cleanup
const transports = new Map<string, StreamableHTTPServerTransport>()

const app = createMcpExpressApp({ host: HOST })

app.post('/mcp', async (req: IncomingMessage & { body: unknown }, res: ServerResponse) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined
  let transport: StreamableHTTPServerTransport

  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!
  } else if (!sessionId) {
    if (transports.size >= MAX_SESSIONS) {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Service Unavailable: Maximum session limit reached' },
        id: null,
      }))
      return
    }
    // Create a new McpServer instance per session
    const { mcpServer } = createSearxNGMcpServer()
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, transport)
      },
    })
    transport.onclose = () => {
      if (transport.sessionId) {
        transports.delete(transport.sessionId)
      }
    }
    await mcpServer.server.connect(transport)
  } else {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session found' },
      id: null,
    }))
    return
  }

  await transport.handleRequest(req, res, req.body)
})

app.get('/mcp', async (req: IncomingMessage, res: ServerResponse) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined
  if (!sessionId || !transports.has(sessionId)) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session found' },
      id: null,
    }))
    return
  }
  const transport = transports.get(sessionId)!
  await transport.handleRequest(req, res)
})

app.delete('/mcp', async (req: IncomingMessage, res: ServerResponse) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined
  if (!sessionId || !transports.has(sessionId)) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session found' },
      id: null,
    }))
    return
  }
  const transport = transports.get(sessionId)!
  await transport.handleRequest(req, res)
})

const server = app.listen(PORT, HOST, () => {
  console.error('='.repeat(60))
  console.error('SearxNG MCP Server Started')
  console.error('='.repeat(60))
  console.error(`  Name:           ${serverInfo.name}`)
  console.error(`  Version:        ${serverInfo.version}`)
  console.error(`  Transport:      HTTP (Streamable)`)
  console.error(`  URL:            http://${HOST}:${PORT}/mcp`)
  console.error(`  SearxNG URL:    ${searxngUrl}`)
  console.error(`  Max Sessions:   ${MAX_SESSIONS}`)
  console.error('='.repeat(60))
})

process.on('SIGINT', async () => {
  console.error('Shutting down HTTP MCP server...')
  for (const transport of transports.values()) {
    await transport.close()
  }
  server.close()
  process.exit(0)
})
