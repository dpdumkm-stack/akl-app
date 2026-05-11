import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "Studio AKL - Quotation Management System",
  description: "Aplikasi Penawaran Terintegrasi PT. Apindo Karya Lestari",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-100 font-sans text-slate-800">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
