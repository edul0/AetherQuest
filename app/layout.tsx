import './globals.css'
import { Cinzel, Lora } from 'next/font/google'

// Fonte para Títulos (Elegância afiada estilo Fantasia Moderna)
const cinzel = Cinzel({ 
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-cinzel'
})

// Fonte para Textos Menores (Orgânica e literária)
const lora = Lora({
  weight: ['400', '500'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-lora'
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
      <body className={`${cinzel.variable} ${lora.variable} bg-[#0a0f12] overflow-hidden touch-none text-[#e2dfd2]`}>
        {children}
      </body>
    </html>
  )
}
