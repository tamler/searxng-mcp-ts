# SearxNG MCP Server (TypeScript)

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

1.  **Clone the repository:**
    ```bash
    git clone <repository-url> # Replace with the actual URL after publishing
    cd searxng-mcp-ts
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the server:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript code into JavaScript in the `build/` directory.

## Configuration

This server requires the URL of your SearXNG instance. You can provide this by setting the `SEARXNG_URL` environment variable.

For convenience during development, you can also create a `.env` file in the project root with the following content:

```dotenv
SEARXNG_URL=https://your-searxng-instance.com # <-- Update this URL
```

Alternatively, you can configure the `SEARXNG_URL` environment variable directly in your MCP client's settings file (e.g., `mcp_settings.json` for Roo/Cline):

```json
{
  "mcpServers": {
    "searxng": {
      "command": "node",
      "args": ["/path/to/searxng-mcp-ts/build/index.js"], // <-- Update this path
      "env": {
        "SEARXNG_URL": "https://your-searxng-instance.com" // <-- Update this URL
      },
      "disabled": false,
      "alwaysAllow": []
    }
    // ... other servers
  }
}
```

**Important:**
*   Replace `/path/to/searxng-mcp-ts/build/index.js` with the absolute path to the built `index.js` file in your cloned repository.
*   Replace `https://your-searxng-instance.com` with the actual base URL of your SearxNG instance.

Restart your MCP client after updating the configuration.

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

## License

MIT License
