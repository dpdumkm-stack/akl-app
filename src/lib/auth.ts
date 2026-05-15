import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureAdminAccounts } from "./init-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = (credentials.username as string).trim();
        const password = (credentials.password as string).trim();

        try {
          // Panggil pengecekan akun admin tepat sebelum login diproses
          await ensureAdminAccounts();

          const user = await prisma.user.findUnique({ where: { username } });
          if (!user) return null;
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
          
          return { 
            id: user.id, 
            name: user.name, 
            email: user.username, 
            role: user.role 
          };
        } catch (error) {
          console.error("[AUTH] Error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET || "akl-secret-key-123",
};
