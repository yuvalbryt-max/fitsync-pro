import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitSync Pro',
  description: 'פלטפורמת הכושר האישית שלך',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitSync',
    startupImage: [
      { url: '/icons/icon-512.png', media: '(device-width: 390px)' },
    ],
  },
  icons: {
    apple: [
      { url: '/icons/icon-180.png', sizes: '180x180' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    icon: [
      { url: '/icons/icon-32.png',  sizes: '32x32'  },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-touch-fullscreen':  'yes',
    'format-detection':        'telephone=no',
  },
}

export const viewport: Viewport = {
  themeColor:         '#080c14',
  width:              'device-width',
  initialScale:       1,
  maximumScale:       1,
  userScalable:       false,
  viewportFit:        'cover',    // fills notch / Dynamic Island area
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className="bg-[#080c14] text-[#e8edf5] antialiased select-none">
        <div className="mx-auto max-w-[430px] min-h-dvh relative">
          {children}
        </div>
      </body>
    </html>
  )
}
