import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { companyName: 'asc' }
        });

        const invoices = await prisma.invoice.findMany({
            select: {
                companyName: true,
                clientName: true,
                total: true,
                status: true
            }
        });

        const stats = clients.map(client => {
            const clientInvoices = invoices.filter(inv => 
                inv.companyName === client.companyName && 
                inv.clientName === client.clientName
            );

            const totalOmzet = clientInvoices
                .filter(inv => inv.status === 'PAID')
                .reduce((sum, inv) => sum + Number(inv.total), 0);

            const totalInvoices = clientInvoices.length;

            return {
                ...client,
                totalOmzet,
                totalInvoices
            };
        });

        return NextResponse.json({ success: true, clients: stats });
    } catch (error: any) {
        console.error("[api/clients/stats] Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
