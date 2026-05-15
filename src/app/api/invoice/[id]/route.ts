import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    
    if (!invoice) return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    
    return NextResponse.json({ success: true, invoice });
  } catch (err) {
    console.error('[invoice/get]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  try {
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
  } catch (err) {
    console.error('[invoice/update]', err);
    return NextResponse.json({ error: 'Gagal memperbarui invoice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "OWNER") {
    return NextResponse.json({ error: 'Hanya Owner yang diizinkan untuk menghapus data permanen.' }, { status: 403 });
  }

  const { id } = await params;
  
  try {
    // Delete items first if needed, but CASCADE should handle it if defined.
    // Manual delete for safety:
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[invoice/delete]', err);
    return NextResponse.json({ error: 'Gagal menghapus invoice' }, { status: 500 });
  }
}
