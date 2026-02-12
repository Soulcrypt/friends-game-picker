import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

// System font stack CSS class (no network required)
const fontClass = 'font-sans'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#08080C',
}

export const metadata: Metadata = {
  title: 'What are we playing?',
  description: 'Fast game picker for friends - vote and decide together',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${fontClass} min-h-screen relative`} style={{ background: '#08080C' }}>
        {/* Animated gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.07] blur-[120px] animate-float" />
          <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/[0.05] blur-[120px] animate-float-delayed" />
          <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-600/[0.04] blur-[120px] animate-float" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.07)',
              backdropFilter: 'blur(20px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#8B5CF6',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
