import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Invoice wajib diisi" }, { status: 400 });
    }

    // Kembalikan status ke PENDING dan kosongkan downPayment (atau sesuaikan logika bisnis)
    // Di sini kita hanya mengembalikan status agar Admin bisa mengedit ulang jika salah klik lunas
    await prisma.invoice.update({
      where: { id },
      data: { 
        status: "PENDING"
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API_INVOICE_REVERT] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
