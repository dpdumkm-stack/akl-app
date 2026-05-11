// src/app/api/invoice/save/route.ts
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
    const body = await req.json();
    const {
      id,
      invoiceNumber,
      date,
      dueDate,
      clientName,
      clientAddress,
      items,
      taxApplied,
      discountAmount,
      downPayment,
      notes,
      paymentMethod,
      status,
      invoiceType,
    } = body;

    // Calculate totals
    const subtotal = items.reduce((acc: number, item: any) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return acc + qty * price;
    }, 0);

    const dpp = subtotal - (Number(discountAmount) || 0);
    const taxAmount = taxApplied ? dpp * 0.11 : 0;
    const grandTotal = dpp + taxAmount;
    
    const dpVal = Number(downPayment) || 0;
    const typeVal = invoiceType || "PELUNASAN";
    const total = typeVal === "DP" ? dpVal : (grandTotal - dpVal);

    const itemsPayload = items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      lineTotal: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    }));

    let invoice;
    if (id) {
      // Update existing
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      invoice = await prisma.invoice.update({
        where: { id },
        data: {
          invoiceNumber,
          date: new Date(date),
          dueDate: dueDate ? new Date(dueDate) : null,
          clientName,
          clientAddress,
          subtotal,
          taxApplied: !!taxApplied,
          taxAmount,
          discountAmount: Number(discountAmount) || 0,
          downPayment: dpVal,
          notes: notes || null,
          paymentMethod: paymentMethod || "CASH",
          invoiceType: typeVal,
          total,
          status: status || "PENDING",
          items: { create: itemsPayload },
        },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          date: new Date(date),
          dueDate: dueDate ? new Date(dueDate) : null,
          clientName,
          clientAddress,
          subtotal,
          taxApplied: !!taxApplied,
          taxAmount,
          discountAmount: Number(discountAmount) || 0,
          downPayment: dpVal,
          notes: notes || null,
          paymentMethod: paymentMethod || "CASH",
          invoiceType: typeVal,
          total,
          status: status || "PENDING",
          items: { create: itemsPayload },
        },
      });
    }

    return NextResponse.json({ success: true, id: invoice.id, invoiceNumber: invoice.invoiceNumber });
  } catch (err: any) {
    console.error('[invoice/save]', err);
    return NextResponse.json({ error: err.message || 'Gagal menyimpan invoice' }, { status: 500 });
  }
}
