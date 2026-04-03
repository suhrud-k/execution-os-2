import { createMcpHandler } from 'mcp-handler'
import { registerExecutionOsTools } from '@/lib/register-tools'

const handler = createMcpHandler(
  (server) => {
    registerExecutionOsTools(server)
  },
  {
    serverInfo: {
      name: 'execution-os-logs',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api',
    maxDuration: 60,
    verboseLogs: process.env.VERBOSE_MCP_LOGS === '1',
    /** Spec prefers streamable HTTP; SSE not needed for ChatGPT remote MCP on Vercel. */
    disableSse: true,
  },
)

export const maxDuration = 60

export function GET(request: Request) {
  return handler(request)
}

export function POST(request: Request) {
  return handler(request)
}
