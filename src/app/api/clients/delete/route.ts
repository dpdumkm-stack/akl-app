import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });
        }

        const client = await prisma.client.findUnique({ where: { id } });
        const clientName = client ? (client.companyName || client.clientName) : id;

        await prisma.client.delete({
            where: { id }
        });

        await logActivity(`Hapus Klien: ${clientName}`, 'SUCCESS', (session?.user as any)?.id, 'CLIENT');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[api/clients/delete] Error:", error);
        await logActivity(`GAGAL Hapus Klien: ${error.message}`, 'ERROR', undefined, 'CLIENT');
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
