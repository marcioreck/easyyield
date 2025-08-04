import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EasyYield - Seu Gerenciador de Investimentos',
  description: 'Gerencie seus investimentos no Brasil e nos EUA de forma fácil e eficiente.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        <Navigation />
        <main className="container mx-auto p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  )
}