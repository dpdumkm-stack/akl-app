import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const companyName = searchParams.get("companyName") || "";
        const clientName = searchParams.get("clientName") || "";

        if (!companyName && !clientName) {
            return NextResponse.json({ success: false, message: "Names required" }, { status: 400 });
        }

        const quotation = await prisma.quotation.findFirst({
            where: {
                companyName: companyName || undefined,
                clientName: clientName || undefined
            },
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });

        if (!quotation) {
            return NextResponse.json({ success: false, message: "No quotation found" });
        }

        return NextResponse.json({ 
            success: true, 
            quotation: {
                id: quotation.id,
                nomorSurat: quotation.nomorSurat,
                items: quotation.items.map(it => ({
                    description: it.deskripsi,
                    quantity: it.volume,
                    unitPrice: it.harga || (it.hargaBahan + it.hargaJasa), // Sesuaikan dengan mode harga
                }))
            }
        });
    } catch (error: any) {
        console.error("[api/quotations/latest-by-client] Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
