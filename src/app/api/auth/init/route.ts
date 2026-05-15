import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // Keamanan: Harus menyertakan key yang sama dengan NEXTAUTH_SECRET
  if (key !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hashedSuper = await bcrypt.hash("qila2026", 10);
    const hashedAdmin = await bcrypt.hash("password123", 10);

    await prisma.user.upsert({
      where: { username: "superadmin" },
      update: { password: hashedSuper, role: "OWNER", name: "Super Admin" },
      create: { username: "superadmin", password: hashedSuper, role: "OWNER", name: "Super Admin" },
    });

    await prisma.user.upsert({
      where: { username: "admin" },
      update: { password: hashedAdmin, role: "OWNER", name: "Admin Utama" },
      create: { username: "admin", password: hashedAdmin, role: "OWNER", name: "Admin Utama" },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Akun superadmin & admin berhasil diinisialisasi di server live." 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
