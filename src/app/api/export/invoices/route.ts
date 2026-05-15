import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });

    // Header CSV
    let csv = "Nomor Invoice,Tanggal,Klien,Perusahaan,Subtotal,Pajak,Total,Status,Tipe\n";

    invoices.forEach((inv) => {
      const row = [
        inv.invoiceNumber,
        new Date(inv.date).toLocaleDateString('id-ID'),
        `"${inv.clientName || ""}"`,
        `"${inv.companyName || ""}"`,
        inv.subtotal.toString(),
        inv.taxAmount.toString(),
        inv.total.toString(),
        inv.status,
        inv.invoiceType
      ].join(",");
      csv += row + "\n";
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=Laporan_Invoice_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (error) {
    console.error("[Export] Error:", error);
    return new NextResponse("Error generating export", { status: 500 });
  }
}
