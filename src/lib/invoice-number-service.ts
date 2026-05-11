import { prisma } from './prisma';

export async function getNextInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  // Format Month to Roman
  const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const romanMonth = romanMonths[month - 1];

  // Get latest invoice for current year
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      date: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestInvoice && latestInvoice.invoiceNumber) {
    const parts = latestInvoice.invoiceNumber.split('/');
    const lastNum = parseInt(parts[0]);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(3, '0');
  return `${paddedNumber}/INV-AKL/${romanMonth}/${year}`;
}
