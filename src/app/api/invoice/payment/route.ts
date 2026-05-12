// src/app/api/invoice/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, amount, isFullPayment } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const inv = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    let newDownPayment = Number(inv.downPayment);
    let newStatus = inv.status;

    if (isFullPayment) {
      // Calculate total project value
      const totalProject = Number(inv.subtotal) - Number(inv.discountAmount) + Number(inv.taxAmount);
      newDownPayment = totalProject;
      newStatus = 'PAID';
    } else {
      newDownPayment += Number(amount || 0);
      
      // Auto mark as paid if reached/exceeded total
      const totalProject = Number(inv.subtotal) - Number(inv.discountAmount) + Number(inv.taxAmount);
      if (newDownPayment >= totalProject) {
        newStatus = 'PAID';
        newDownPayment = totalProject; // cap at total
      }
    }

    // Recalculate total (remaining) based on invoiceType
    // For PELUNASAN mode, total is grandTotal - downPayment
    // For DP mode, total is just downPayment
    // We should probably keep the invoiceType logic consistent
    const totalProjectValue = Number(inv.subtotal) - Number(inv.discountAmount) + Number(inv.taxAmount);
    const updatedTotal = inv.invoiceType === "DP" ? newDownPayment : (totalProjectValue - newDownPayment);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        downPayment: newDownPayment,
        status: newStatus,
        total: updatedTotal
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err: any) {
    console.error('[API ERROR][invoice/payment]:', err);
    const isProd = process.env.NODE_ENV === 'production';
    const msg = isProd ? "Gagal memperbarui status pembayaran." : (err?.message || "Unknown error");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
