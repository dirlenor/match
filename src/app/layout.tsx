import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Match App',
  description: 'Check-in and salary request application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen px-layout-x py-layout-y bg-bg-dark">
        {children}
      </body>
    </html>
  )
}
