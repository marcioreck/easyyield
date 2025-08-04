'use client'

import { useState } from 'react'
import Link from 'next/link'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-blue-600 p-4 text-white shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            EasyYield
          </Link>
          
          {/* Menu para desktop */}
          <div className="hidden md:flex space-x-4">
            <Link href="/" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/assets" className="hover:underline">
              Ativos
            </Link>
            <Link href="/transactions" className="hover:underline">
              Operações
            </Link>
            <Link href="/settings" className="hover:underline">
              Configurações
            </Link>
          </div>

          {/* Botão do menu mobile */}
          <button
            className="md:hidden p-2 hover:bg-blue-700 rounded"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <Link
              href="/"
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/assets"
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Ativos
            </Link>
            <Link
              href="/transactions"
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Operações
            </Link>
            <Link
              href="/settings"
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Configurações
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}