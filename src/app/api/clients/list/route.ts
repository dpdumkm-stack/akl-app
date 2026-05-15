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
    const clients = await prisma.client.findMany({
      orderBy: { companyName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      clients: clients.map(c => ({
        id: c.id,
        companyName: c.companyName,
        clientName: c.clientName,
        address: c.address,
        phone: c.phone
      })),
    });
  } catch (err) {
    console.error('[clients/list]', err);
    return NextResponse.json({ error: 'Gagal memuat data klien' }, { status: 500 });
  }
}
