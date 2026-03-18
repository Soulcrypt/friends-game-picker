import type { Metadata, Viewport } from 'next'
import { Rajdhani, Space_Grotesk, Space_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0D1117',
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
      <body className={`${rajdhani.variable} ${spaceGrotesk.variable} ${spaceMono.variable} font-body min-h-screen relative`}>
        {/* Ambient blobs — subtle background atmosphere */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[120px] opacity-[0.06]"
            style={{ background: 'hsl(var(--primary))' }}
          />
          <div
            className="absolute top-2/3 -right-40 w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.04]"
            style={{ background: 'hsl(var(--neon-cyan))' }}
          />
        </div>

        {/* Content */}
        <AuthProvider>
          <div className="relative z-10">
            {children}
          </div>
        </AuthProvider>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(23,30,42,0.95)',
              backdropFilter: 'blur(20px)',
              color: 'rgb(230,235,245)',
              border: '1px solid rgba(191,95,255,0.2)',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 0 20px rgba(191,95,255,0.1), 0 8px 32px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: {
                primary: '#27FF7A',
                secondary: '#000',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF453A',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
