# SearXNG MCP Server

[![MCP](https://img.shields.io/badge/MCP-Server-blue)](https://github.com/modelcontextprotocol/spec)
[![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green)](https://nodejs.org/)

A Model Context Protocol (MCP) server that provides search capabilities through SearXNG, a privacy-respecting metasearch engine that aggregates results from multiple search engines.

## ✨ Features

- 🔍 **Search Tool**: Perform searches via any SearXNG instance
- 📡 **Dual Transport Modes**: stdio (default) and HTTP (Streamable HTTP)
- 🔐 **Custom Headers**: Support for authentication and custom headers
- 🐳 **Docker Ready**: Multi-stage Dockerfile and docker-compose support
- 🚀 **Production Ready**: Error handling, logging, and health checks

### Supported Search Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | The search query (required) |
| `categories` | string | Comma-separated categories (e.g., "general,images,videos") |
| `language` | string | Search language code (e.g., "en", "es", "de") |
| `page_number` | number | Page number for pagination (default: 1) |
| `time_range` | enum | Filter by time: "day", "week", "month", "year" |
| `safesearch` | number | Safe search level: 0 (off), 1 (moderate), 2 (strict) |

## 📋 Prerequisites

- Node.js v24+ or Docker
- Access to a SearXNG instance (self-hosted or public)

## 🚀 Quick Start

### Using npx (Recommended)

```bash
SEARXNG_URL=https://your-searxng-instance.com npx -y searxng-mcp-ts@latest
```

### Using Docker

```bash
# Clone the repository
git clone https://github.com/deaquino/searxng-mcp-ts.git
cd searxng-mcp-ts

# Create .env file
cp .env.example .env
# Edit .env and set your SEARXNG_URL

# Run with docker-compose
docker-compose up -d
```

## 📦 Installation

### Option 1: NPM Global Install

```bash
npm install -g searxng-mcp-ts
```

### Option 2: Clone and Build

```bash
git clone https://github.com/deaquino/searxng-mcp-ts.git
cd searxng-mcp-ts
pnpm install
pnpm build
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SEARXNG_URL` | ✅ Yes | - | URL of your SearXNG instance |
| `PORT` | No | `3000` | HTTP server port |
| `HOST` | No | `127.0.0.1` | HTTP server bind address |
| `MAX_SESSIONS` | No | `100` | Maximum concurrent HTTP sessions |
| `AUTHORIZATION_HEADER` | No | - | Authorization header value |
| `X_*_HEADER` | No | - | Custom X-headers (see below) |

### Using .env File

Create a `.env` file in the project root:

```dotenv
SEARXNG_URL=https://your-searxng-instance.com
PORT=3000
HOST=127.0.0.1
MAX_SESSIONS=100
```

### Custom Headers

#### Authorization Header

```dotenv
AUTHORIZATION_HEADER=Bearer YOUR_TOKEN_HERE
```

#### Custom X-Headers

Use the `X_*_HEADER` pattern. Examples:

| Environment Variable | HTTP Header |
|---------------------|-------------|
| `X_API_KEY_HEADER=secret` | `X-Api-Key: secret` |
| `X_CUSTOM_HEADER=value` | `X-Custom: value` |
| `X_REQUEST_ID_HEADER=123` | `X-Request-Id: 123` |

## 🔌 MCP Client Configuration

### Stdio Transport

```json
{
  "mcpServers": {
    "searxng": {
      "description": "Search aggregator using SearXNG",
      "command": "npx",
      "args": ["-y", "searxng-mcp-ts@latest"],
      "env": {
        "SEARXNG_URL": "https://your-searxng-instance.com"
      },
      "timeout": 60,
      "transportType": "stdio"
    }
  }
}
```

### HTTP Transport

```json
{
  "mcpServers": {
    "searxng": {
      "description": "Search aggregator using SearXNG",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t searxng-mcp-ts:latest .

# Run container
docker run -d \
  --name searxng-mcp \
  -p 3000:3000 \
  -e SEARXNG_URL=https://your-searxng-instance.com \
  searxng-mcp-ts:latest
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f searxng-mcp

# Stop services
docker-compose down
```

### Docker Compose with Local SearXNG

Uncomment the `searxng` service in `docker-compose.yml` to run a local SearXNG instance:

```yaml
services:
  searxng-mcp:
    # ... existing config ...
    environment:
      - SEARXNG_URL=http://searxng:8080
    depends_on:
      - searxng

  searxng:
    image: searxng/searxng:latest
    # ... additional config ...
```

### Health Check

The Docker container includes a health check:

```bash
curl http://localhost:3000/health
```

## 📡 HTTP API Reference

When running in HTTP mode, the server exposes a single endpoint:

### Endpoint: `/mcp`

| Method | Description |
|--------|-------------|
| `POST` | Send JSON-RPC requests (initialize, tools/list, tools/call) |
| `GET` | Open SSE stream for notifications (requires session) |
| `DELETE` | Terminate a session |

### Quick HTTP Examples

**Initialize session:**

```bash
curl -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"my-client","version":"1.0"}},"id":1}'
```

**Search:**

```bash
curl -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <SESSION_ID>" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search","arguments":{"query":"MCP protocol"}},"id":2}'
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Watch mode
pnpm run watch

# Build
pnpm build

# Run with MCP Inspector
pnpm run inspector
```

## 📁 Project Structure

```
searxng-mcp-ts/
├── src/
│   ├── index.ts      # Stdio transport entry point
│   ├── http.ts       # HTTP transport entry point
│   └── server.ts     # MCP server implementation
├── build/            # Compiled JavaScript
├── Dockerfile        # Multi-stage Docker build
├── docker-compose.yml
├── .env.example      # Environment variables template
└── package.json
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📚 Related Links

- [Model Context Protocol](https://github.com/modelcontextprotocol/spec)
- [SearXNG](https://github.com/searxng/searxng)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
