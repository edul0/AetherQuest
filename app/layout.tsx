import "./globals.css"
import { Cinzel, Lora } from "next/font/google"

const cinzel = Cinzel({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzel"
})

const lora = Lora({
  weight: ["400", "500"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-lora"
})

export const metadata = {
  title: "AetherQuest",
  description: "Tabletop Virtual Multiplataforma",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${cinzel.variable} ${lora.variable} bg-[#0a0f12] text-[#e2dfd2]`}>
        {children}
      </body>
    </html>
  )
}
