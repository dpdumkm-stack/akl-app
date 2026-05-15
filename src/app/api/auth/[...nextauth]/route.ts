import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Paksa Node.js runtime agar bcryptjs berjalan dengan benar
export const runtime = "nodejs";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
