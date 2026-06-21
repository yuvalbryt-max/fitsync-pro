import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitSync Pro',
  description: 'פלטפורמת הכושר האישית שלך',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'FitSync' },
  icons: { apple: [{ url: '/icons/icon-180.png', sizes: '180x180' }], icon: [{ url: '/icons/icon-192.png' }] },
}
export const viewport: Viewport = {
  themeColor: '#1D4ED8',
  width: 'device-width', initialScale: 1,
  maximumScale: 1, userScalable: false, viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased" style={{ fontFamily: "'Heebo', system-ui, sans-serif" }}>
        <div className="mx-auto max-w-[500px] min-h-dvh relative">
          {children}
        </div>
      </body>
    </html>
  )
}
