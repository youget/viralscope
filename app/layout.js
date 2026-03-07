import './globals.css'
import ThemeProvider from './components/ThemeProvider'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import ScrollToTop from './components/ScrollToTop'

export const metadata = {
  title: 'ViralScope',
  description: 'Your brain called. It wants dopamine. Viral videos + AI tools. Completely free. No cap.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'ViralScope',
    description: 'Your brain called. It wants dopamine. The shortest, most unhinged videos and AI tools on the internet.',
    siteName: 'ViralScope',
    type: 'website',
    url: 'https://viralscape.vercel.app',
  },
  twitter: {
    card: 'summary',
    title: 'ViralScope',
    description: 'Viral videos + AI tools. Completely free. No cap.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ViralScope',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B1121' },
    { media: '(prefers-color-scheme: light)', color: '#FFF5F7' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vs-theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TopBar />
          <main>{children}</main>
          <ScrollToTop />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
