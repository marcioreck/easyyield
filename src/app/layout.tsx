import type { Metadata } from "next"
import "./globals.css"
import { Navigation } from "@/components/Navigation"

export const metadata: Metadata = {
  title: "EasyYield - Seu Gerenciador de Investimentos",
  description: "Gerencie seus investimentos no Brasil e nos EUA de forma fácil e eficiente.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <body className="bg-gray-100 text-gray-900">
        <Navigation />
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}