import type { Metadata } from 'next'
import RootLayoutClient from './RootLayoutClient'

export const metadata: Metadata = {
  title: 'LLM Proxy Dashboard',
  description: 'Monitor your LLM requests in real time',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
