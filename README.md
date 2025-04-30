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
    "searxng-mcp-ts": { // Use the package name as the key
      "command": "npx",
      "args": ["-y", "searxng-mcp-ts@latest"], // Use npx with package name
      "env": {
        "SEARXNG_URL": "https://your-searxng-instance.com" // <-- Update this URL
      },
      "timeout": 60, // Optional: Add a timeout
      "transportType": "stdio", // Optional: Specify transport type
      "disabled": false,
      "alwaysAllow": []
    }
    // OR if installed globally:
    // "searxng-mcp-ts": {
    //   "command": "searxng-mcp-ts", // Use the command name
    //   "env": {
    //     "SEARXNG_URL": "https://your-searxng-instance.com" // <-- Update this URL
    //   },
    //   "timeout": 60, // Optional: Add a timeout
    //   "transportType": "stdio", // Optional: Specify transport type
    //   "disabled": false,
    //   "alwaysAllow": []
    // }
    // ... other servers
  }
}
```

**Important:**

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
