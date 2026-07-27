import { Montserrat, Poppins } from 'next/font/google'
import '../styles/globals.css'
import { StoreProvider } from '@/context/StoreContext'
import ThemeProvider from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300','400','500','600','700','800','900'],
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400','500','600','700','800','900'],
})

export const metadata = {
  title: 'Aarvya — Natural Healthy Laddus',
  description: 'Natural healthy laddus for everyday nutrition and wellbeing.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${montserrat.variable}`}>
      <body className="font-body text-ink antialiased leading-relaxed">
        <StoreProvider>
          <ThemeProvider>
            {children}
            <Toaster position="bottom-right" toastOptions={{
              style:{ background:'#fff', color:'#111', border:'1px solid #E5E0D8', fontFamily:'var(--font-body)', fontSize:'15px', borderRadius:'8px' },
              success:{ iconTheme:{ primary:'var(--color-primary)', secondary:'#fff' } },
            }}/>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
