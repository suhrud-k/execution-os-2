import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { fetchLogsFromAppsScript } from '@/lib/apps-script'
import { getAppsScriptEnv } from '@/lib/env'
import { isValidIsoDate } from '@/lib/dates'

const isoDate = z
  .string()
  .describe('Calendar date in YYYY-MM-DD format')
  .refine((s) => isValidIsoDate(s), { message: 'Invalid date (expected YYYY-MM-DD)' })

/**
 * Register all MCP tools. Add fetch_recent_logs etc. here later.
 */
export function registerExecutionOsTools(server: McpServer): void {
  server.registerTool(
    'fetch_logs',
    {
      title: 'Fetch daily logs',
      description:
        'Read normalized daily execution logs from Google Sheets for an inclusive date range (via Apps Script get_logs). Read-only.',
      inputSchema: z.object({
        start_date: isoDate,
        end_date: isoDate,
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ start_date, end_date }) => {
      if (start_date > end_date) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'start_date must be on or before end_date',
              }),
            },
          ],
          isError: true,
        }
      }

      let env: ReturnType<typeof getAppsScriptEnv>
      try {
        env = getAppsScriptEnv()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[fetch_logs] env error:', msg)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }],
          isError: true,
        }
      }

      const result = await fetchLogsFromAppsScript(
        start_date,
        end_date,
        env.baseUrl,
        env.token,
      )

      if (!result.success) {
        console.warn('[fetch_logs] upstream error:', result.error)
        return {
          content: [
            { type: 'text' as const, text: JSON.stringify({ error: result.error }) },
          ],
          isError: true,
        }
      }

      console.info(
        `[fetch_logs] ok range=${start_date}..${end_date} count=${result.count} skipped_rows=${result.skipped_rows}`,
      )

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      }
    },
  )
}
