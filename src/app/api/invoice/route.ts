import { NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getSession({ req: { headers: request.headers } as any });
  if (!(session?.user as any)?.role?.includes('admin')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const data = await request.json();
  
  const { getNextSequenceAtomic } = await import("@/lib/sequence-service");
  const { formatInvoiceNumber } = await import("@/lib/utils");
  
  const nextUrut = await getNextSequenceAtomic("INVOICE");
  const invoiceNumber = formatInvoiceNumber(nextUrut);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber,
      nomorUrut: nextUrut,
      date: new Date(data.date),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientName: data.clientName,
      clientAddress: data.clientAddress,
      taxApplied: data.taxApplied ?? false,
      taxRate: data.taxRate ?? 0.11,
      discountAmount: data.discountAmount ?? 0,
      downPayment: data.downPayment ?? 0,
      notes: data.notes ?? null,
      items: {
        create: data.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) ?? [],
      },
    },
    include: { items: true },
  });
  // Calculate totals
  const subtotal = invoice.items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
  const taxAmount = invoice.taxApplied ? subtotal * Number(invoice.taxRate) : 0;
  const total = subtotal + taxAmount - Number(invoice.discountAmount) - Number(invoice.downPayment);
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { subtotal, taxAmount, total },
  });
  return NextResponse.json({ success: true, invoice: { ...invoice, subtotal, taxAmount, total } });
}
