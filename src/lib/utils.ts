export const formatInputNumber = (val: any): string => {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val);
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseInputNumber = (val: string): number => {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  return Number(cleaned) || 0;
};

export const formatCurrency = (n: number | string): string => {
  const num = Number(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(isNaN(num) ? 0 : num);
};

export const getRomanMonth = (m: number): string => {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romans[m] || "I";
};

export const calculateLines = (text: string | null, charsPerLine: number): number => {
  if (!text) return 0;
  return text.toString().split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
};

export function getRomanNumeral(num: number): string {
    const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}

export function formatQuotationNumber(urut: number, date: Date = new Date()): string {
    const year = date.getFullYear();
    const romanMonth = getRomanMonth(date.getMonth());
    const formattedUrut = String(urut).padStart(3, '0');
    return `${formattedUrut}/PH-AKL/${romanMonth}/${year}`;
}

export const getUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};
