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

        const [quotations, invoices] = await Promise.all([
            prisma.quotation.findMany({
                where: { 
                    companyName: companyName || undefined,
                    clientName: clientName || undefined
                },
                select: { id: true }
            }),
            prisma.invoice.findMany({
                where: {
                    companyName: companyName || undefined,
                    clientName: clientName || undefined
                },
                select: { id: true, status: true }
            })
        ]);

        const pendingQuotations = quotations.length; // Actually all quotations are considered pending until invoiced if we had that flag
        const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
        const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING').length;

        return NextResponse.json({ 
            success: true, 
            stats: {
                totalQuotations: quotations.length,
                pendingQuotations,
                paidInvoices,
                pendingInvoices
            }
        });
    } catch (error: any) {
        console.error("[api/clients/history] Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
