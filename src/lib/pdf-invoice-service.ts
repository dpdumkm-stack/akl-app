import { prisma } from './prisma';
import { InvoiceData } from './types';

export async function getInvoiceForPDF(id: string): Promise<InvoiceData | null> {
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!inv) return null;
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    date: inv.date.toISOString(),
    dueDate: inv.dueDate?.toISOString(),
    clientName: inv.clientName,
    clientAddress: inv.clientAddress,
    items: inv.items.map(it => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
    })),
    subtotal: Number(inv.subtotal),
    taxRate: Number(inv.taxRate),
    taxApplied: inv.taxApplied,
    taxAmount: Number(inv.taxAmount),
    discountAmount: Number(inv.discountAmount),
    downPayment: Number(inv.downPayment),
    notes: inv.notes ?? undefined,
    paymentMethod: inv.paymentMethod as any,
    invoiceType: inv.invoiceType as any,
    total: Number(inv.total),
    status: inv.status as any,
  };
}
