import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Execution OS MCP',
  description: 'Remote MCP server for daily logs',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', padding: '2rem' }}>{children}</body>
    </html>
  )
}
