import type { Metadata } from 'next'
import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'
import AxiosInterceptor from '@/components/AxiosInterceptor'

export const metadata: Metadata = {
  title: 'School Revelation System',
  description: 'srs',
  icons: {
    icon: [
      { url: '/Logo/srs.png', sizes: '32x32', type: 'image/png' },
      { url: '/Logo/srs.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/Logo/srs.png',
    apple: '/Logo/srs.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AxiosInterceptor />
        <div id="root">
          <Providers>
            {children}
          </Providers>
          <Toaster />
        </div>
      </body>
    </html>
  )
}
