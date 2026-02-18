# SearxNG MCP Server

[![MCP](https://img.shields.io/badge/MCP-Server-blue)](https://github.com/modelcontextprotocol/spec)

This is a Model Context Protocol (MCP) server that provides a tool to interact with a SearXNG instance.

## Features

*   Exposes a `search` tool to perform searches via a configured SearXNG instance.
*   Supports standard SearXNG parameters like `query`, `categories`, `language`, `page_number`, `time_range`, and `safesearch`.

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm
*   Access to a running SearXNG instance (either self-hosted or public)

## Installation

This server can be installed as an npm package.

```bash
npm install -g searxng-mcp-ts # Install globally
# OR
# npm install searxng-mcp-ts # Install as a project dependency
```

Alternatively, you can clone the repository and build it:

```bash
git clone <repository-url> # Replace with the actual URL after publishing
cd searxng-mcp-ts
npm install
npm run build
```

## Configuration

This server requires the URL of your SearXNG instance. You can provide this by setting the `SEARXNG_URL` environment variable.

If you installed the package globally or as a project dependency, you can set the environment variable before running the command.

For convenience during development when cloning the repository, you can also create a `.env` file in the project root with the following content:

```dotenv
SEARXNG_URL=https://your-searxng-instance.com # <-- Update this URL
```

In your MCP client's settings file (e.g., `mcp_settings.json` for Roo/Cline), you can configure the server using `npx` (if not installed globally) or the command name (if installed globally):

```json
{
  "mcpServers": {
    "searxng": {
      "description": "Search aggregator that queries multiple search engines and returns combined results",
      "command": "npx",
      "args": ["-y", "searxng-mcp-ts@latest"],
      "env": {
        "SEARXNG_URL": "https://your-searxng-instance.com" // <-- Update this URL
      },
      "timeout": 60,
      "transportType": "stdio", 
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

**Important:**

*   Replace `https://your-searxng-instance.com` with the actual base URL of your SearxNG instance.

Restart your MCP client after updating the configuration.

### Custom Headers

The server supports custom headers for requests to your SearXNG instance. This is useful for authentication or other custom requirements.

#### Authorization Header

To add an `Authorization` header (e.g., for Bearer token authentication), set the `AUTHORIZATION_HEADER` environment variable:

```dotenv
AUTHORIZATION_HEADER=Bearer YOUR_TOKEN_HERE
```

In your MCP client configuration:

```json
{
  "mcpServers": {
    "searxng": {
      "description": "Search aggregator that queries multiple search engines and returns combined results",
      "command": "npx",
      "args": ["-y", "searxng-mcp-ts@latest"],
      "env": {
        "SEARXNG_URL": "https://your-searxng-instance.com",
        "AUTHORIZATION_HEADER": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

#### Custom X-Headers

You can add custom headers that start with `X-` by using environment variables in the format `X_*_HEADER`. The environment variable name will be converted to the proper header format.

**Naming Convention:**

The conversion follows these rules:
1. Remove the `X_` prefix and `_HEADER` suffix
2. Split by underscores
3. Capitalize the first letter of each part and lowercase the rest
4. Join with hyphens

**Examples:**

*   `X_CUSTOM_HEADER=Value` → `X-Custom: Value`
*   `X_API_KEY_HEADER=secret123` → `X-Api-Key: secret123`
*   `X_REQUEST_ID_HEADER=req-12345` → `X-Request-Id: req-12345`

**Note:** If you need specific casing for acronyms (e.g., `X-API-Key` instead of `X-Api-Key`), you may need to adjust your SearXNG instance configuration or use a different approach. The current implementation uses standard title-case formatting for all parts.

**Full configuration example with custom headers:**

```dotenv
SEARXNG_URL=https://your-searxng-instance.com
AUTHORIZATION_HEADER=Bearer YOUR_TOKEN_HERE
X_CUSTOM_HEADER=CustomValue
X_API_KEY_HEADER=secret123
```

In your MCP client configuration:

```json
{
  "mcpServers": {
    "searxng": {
      "description": "Search aggregator that queries multiple search engines and returns combined results",
      "command": "npx",
      "args": ["-y", "searxng-mcp-ts@latest"],
      "env": {
        "SEARXNG_URL": "https://your-searxng-instance.com",
        "AUTHORIZATION_HEADER": "Bearer YOUR_TOKEN_HERE",
        "X_CUSTOM_HEADER": "CustomValue",
        "X_API_KEY_HEADER": "secret123"
      }
    }
  }
}
```

## Usage

Once configured, the server provides a `search` tool. You can use it through your MCP client like this:

**Example Request:**

```json
{
  "tool_name": "search",
  "server_name": "searxng",
  "arguments": {
    "query": "Model Context Protocol",
    "categories": "general",
    "language": "en"
  }
}
```

**Example Natural Language (if supported by client):**

"Search for 'Model Context Protocol' using SearXNG"

## Production Readiness

This server includes improved error handling and logging to assist in debugging and monitoring in a production environment.

## Development

*   **Watch for changes:** `npm run watch` (automatically rebuilds on file changes)
*   **Linting:** `npm run lint`
*   **Formatting:** `npm run format`

## Publishing

For information on publishing new releases to npm, see [PUBLISHING.md](PUBLISHING.md).

## License

MIT License
