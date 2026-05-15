"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";

async function checkOwner() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  
  // SCSA FIX: Gunakan email (yang berisi username) atau role langsung dari session
  const userRole = (session.user as any).role;
  const username = (session.user as any).email;

  if (userRole !== "OWNER") {
    throw new Error("Hanya Owner yang dapat mengelola user. Role Anda: " + userRole);
  }
  
  return { username };
}

export async function getUsers() {
  try {
    await checkOwner();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, name: true, role: true, isActive: true }
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function saveUser(data: any) {
  try {
    await checkOwner();
    
    const payload: any = {
      username: data.username,
      name: data.name,
      role: data.role || "ADMIN",
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    if (data.password) {
      payload.password = await bcrypt.hash(data.password, 10);
    }

    if (data.id) {
      await prisma.user.update({
        where: { id: data.id },
        data: payload
      });
    } else {
      if (!data.password) throw new Error("Password wajib untuk user baru.");
      await prisma.user.create({ data: payload });
    }

    revalidatePath("/settings/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await checkOwner();
    // SCSA FIX: Jangan biarkan hapus diri sendiri menggunakan ID session
    const session = await getServerSession(authOptions);
    const meId = (session?.user as any)?.id;
    if (meId === id) throw new Error("Anda tidak bisa menghapus akun Anda sendiri.");

    await prisma.user.delete({ where: { id } });
    revalidatePath("/settings/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
