import { NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession({ req: { headers: request.headers } as any });
  if (!(session?.user as any)?.role?.includes('admin')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!invoice) return new NextResponse('Not Found', { status: 404 });
  return NextResponse.json({ success: true, invoice });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession({ req: { headers: request.headers } as any });
  if (!(session?.user as any)?.role?.includes('admin')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const data = await request.json();
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      clientName: data.clientName,
      clientAddress: data.clientAddress,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      taxApplied: data.taxApplied ?? false,
      taxRate: data.taxRate ?? 0.11,
      discountAmount: data.discountAmount ?? 0,
      downPayment: data.downPayment ?? 0,
      notes: data.notes ?? null,
      items: {
        deleteMany: {},
        create: data.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) ?? [],
      },
    },
    include: { items: true },
  });
  const subtotal = updated.items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
  const taxAmount = updated.taxApplied ? subtotal * Number(updated.taxRate) : 0;
  const total = subtotal + taxAmount - Number(updated.discountAmount) - Number(updated.downPayment);
  await prisma.invoice.update({
    where: { id: updated.id },
    data: { subtotal, taxAmount, total },
  });
  return NextResponse.json({ success: true, invoice: { ...updated, subtotal, taxAmount, total } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession({ req: { headers: request.headers } as any });
  if (!(session?.user as any)?.role?.includes('admin')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
