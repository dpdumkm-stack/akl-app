import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Paksa Node.js runtime agar bcryptjs berjalan dengan benar
export const runtime = "nodejs";

const authOptions = {
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

        // Akses darurat superadmin
        if (username === "superadmin" && password === "akl2026") {
          return { id: "999", name: "Super Admin", email: "superadmin" };
        }

        try {
          const user = await prisma.user.findUnique({ where: { username } });
          if (!user) return null;
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
          return { id: user.id, name: user.name, email: user.username };
        } catch (error) {
          console.error("[AUTH] Error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET || "akl-secret-key-123",
};

// next-auth v4: NextAuth() mengembalikan handler langsung
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
