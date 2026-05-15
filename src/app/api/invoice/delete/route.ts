// src/app/api/invoice/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "OWNER") {
    return NextResponse.json({ error: 'Hanya Owner yang diizinkan untuk menghapus data permanen.' }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    const inv = await prisma.invoice.findUnique({ where: { id } });
    const target = inv ? inv.invoiceNumber : id;

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });

    await logActivity(`Hapus Invoice: ${target}`, 'SUCCESS', (session.user as any).id, 'INVOICE');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[invoice/delete]', err);
    await logActivity(`GAGAL Hapus Invoice: ${err.message}`, 'ERROR', undefined, 'INVOICE');
    return NextResponse.json({ error: 'Gagal menghapus invoice' }, { status: 500 });
  }
}
