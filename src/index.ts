#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config()

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createSearxNGMcpServer } from './server.js'

const { mcpServer, serverInfo, searxngUrl } = createSearxNGMcpServer()

process.on('SIGINT', async () => {
  await mcpServer.server.close()
  process.exit(0)
})

async function run() {
  const transport = new StdioServerTransport()
  await mcpServer.server.connect(transport)
  console.error(
    `SearxNG MCP server (${serverInfo.name} v${serverInfo.version}) running on stdio, connected to ${searxngUrl}`
  )
}

run().catch((error) => {
  console.error('Failed to start SearxNG MCP server:', error)
  process.exit(1)
})
