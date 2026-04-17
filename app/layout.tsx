import './globals.css'

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
      <body className="bg-black overflow-hidden touch-none text-white">
        {children}
      </body>
    </html>
  )
}
