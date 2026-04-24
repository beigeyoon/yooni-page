import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { NextAuthOptions } from 'next-auth';
import prisma from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin';
import { ExtendedSession } from '@/types';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      const extendedSession = session as ExtendedSession;

      if (token?.accessToken) {
        extendedSession.accessToken = token.accessToken as string;
      }

      if (extendedSession.user) {
        extendedSession.user.id = token.sub;
        extendedSession.user.isAdmin = isAdminEmail(extendedSession.user.email);
      }

      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
