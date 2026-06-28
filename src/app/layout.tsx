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
  themeColor: '#1D4ED8', width: 'device-width', initialScale: 1,
  maximumScale: 1, userScalable: false, viewportFit: 'cover',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: "'Heebo', system-ui, sans-serif" }}>
        {/* Skip to main content — WCAG 2.1 Level A keyboard navigation */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold">
          דלג לתוכן הראשי
        </a>
        <div className="mx-auto max-w-[430px] min-h-dvh relative bg-background">
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
      </body>
    </html>
  )
}
