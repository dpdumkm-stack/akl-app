"use server";

import { prisma } from './prisma';

export async function getNextInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  // Format Month to Roman
  const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const romanMonth = romanMonths[month - 1];

  // Get latest invoice for current year based on nomorUrut
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      date: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    orderBy: {
      nomorUrut: 'desc',
    },
  });

  const nextNumber = (latestInvoice?.nomorUrut || 0) + 1;
  const paddedNumber = nextNumber.toString().padStart(3, '0');
  
  return {
    invoiceNumber: `${paddedNumber}/INV-AKL/${romanMonth}/${year}`,
    nextUrut: nextNumber
  };
}
