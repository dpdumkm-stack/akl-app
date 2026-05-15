"use server";

import { prisma } from "@/lib/prisma";

export async function getFinancialStats() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Total Penawaran (Quotation) bulan ini
    const totalQuotations = await prisma.quotation.aggregate({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        totalHarga: true,
      },
      _count: true,
    });

    // 2. Total Invoice bulan ini
    const totalInvoices = await prisma.invoice.aggregate({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    // 3. Status Pembayaran (Paid vs Pending)
    const paidInvoices = await prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    });

    const pendingInvoices = await prisma.invoice.aggregate({
      where: { status: "PENDING" },
      _sum: { total: true },
    });

    // 4. Data untuk Grafik (6 bulan terakhir)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('id-ID', { month: 'short' });
      
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const invSum = await prisma.invoice.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { total: true }
      });

      chartData.push({
        name: monthLabel,
        total: Number(invSum._sum.total) || 0,
      });
    }

    return {
      success: true,
      stats: {
        quotationMonth: {
          total: Number(totalQuotations._sum.totalHarga) || 0,
          count: totalQuotations._count || 0,
        },
        invoiceMonth: {
          total: Number(totalInvoices._sum.total) || 0,
          count: totalInvoices._count || 0,
        },
        paid: Number(paidInvoices._sum.total) || 0,
        pending: Number(pendingInvoices._sum.total) || 0,
      },
      chartData,
    };
  } catch (error) {
    console.error("[getFinancialStats] Error:", error);
    return { success: false, message: "Gagal memuat data keuangan." };
  }
}
