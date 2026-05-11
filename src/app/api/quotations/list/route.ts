import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nomorSurat: true,
        namaKlien: true,
        tanggal: true,
        totalHarga: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      quotations: quotations.map(q => ({
        id: q.id,
        nomorSurat: q.nomorSurat,
        namaKlien: q.namaKlien,
        tanggal: q.tanggal,
        totalHarga: q.totalHarga,
        createdAt: q.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[quotations/list]', err);
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 });
  }
}
