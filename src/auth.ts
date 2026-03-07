import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // TODO: validar contra seu BD (ex.: Prisma). Por ora aceita qualquer email/senha para teste.
        const email = String(credentials.email).trim()
        const password = String(credentials.password)
        if (!email || !password) return null
        return {
          id: '1',
          email,
          name: email.split('@')[0],
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string
      return session
    },
  },
})
