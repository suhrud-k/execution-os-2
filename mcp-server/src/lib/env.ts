export type AppsScriptEnv = {
  /** Apps Script web app URL without trailing slash */
  baseUrl: string
  token: string
}

export function getAppsScriptEnv(): AppsScriptEnv {
  const base = process.env.APPS_SCRIPT_BASE_URL?.trim()
  const token = process.env.APPS_SCRIPT_TOKEN?.trim()
  if (!base) {
    throw new Error('APPS_SCRIPT_BASE_URL is not set')
  }
  if (!token) {
    throw new Error('APPS_SCRIPT_TOKEN is not set')
  }
  return {
    baseUrl: base.replace(/\/$/, ''),
    token,
  }
}
