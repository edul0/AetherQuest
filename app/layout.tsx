import './globals.css'
import { Press_Start_2P, VT323 } from 'next/font/google'

// Fonte para Títulos (Mais quadrada/Zelda clássico)
const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start'
})

// Fonte para Textos Menores (Mais legível mas ainda pixelada)
const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323'
})

export const metadata = {
  title: 'AetherQuest',
  description: 'Tabletop Virtual Multiplataforma',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${pressStart2P.variable} ${vt323.variable} bg-[#1a1c1d] overflow-hidden touch-none text-[#e0d6c8]`}>
        {children}
      </body>
    </html>
  )
}
