// src/app/api/invoice/list/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date.toISOString(),
        dueDate: inv.dueDate?.toISOString() ?? null,
        clientName: inv.clientName,
        companyName: inv.companyName,
        clientAddress: inv.clientAddress,
        poNumber: inv.poNumber,
        subtotal: Number(inv.subtotal),
        taxAmount: Number(inv.taxAmount),
        taxApplied: inv.taxApplied,
        total: Number(inv.total),
        discountAmount: Number(inv.discountAmount),
        downPayment: Number(inv.downPayment),
        status: inv.status,
        paymentMethod: inv.paymentMethod,
        invoiceType: inv.invoiceType,
        items: inv.items,
      })),
    });
  } catch (err) {
    console.error('[invoice/list]', err);
    return NextResponse.json({ error: 'Gagal memuat data invoice' }, { status: 500 });
  }
}
