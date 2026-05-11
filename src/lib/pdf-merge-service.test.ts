// src/lib/pdf-merge-service.test.ts

import { mergePdfs } from "@/lib/pdf-merge-service";
import { PDFDocument } from "pdf-lib";

describe("mergePdfs", () => {
  it("should merge two 1‑page PDFs into a 2‑page PDF", async () => {
    // create two simple PDFs in‑memory
    const createPdf = async (text: string) => {
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      const helvetica = await doc.embedFont("Helvetica");
      page.drawText(text, { x: 50, y: 750, size: 24, font: helvetica });
      const bytes = await doc.save();
      return Buffer.from(bytes);
    };
    const pdf1 = await createPdf("Page 1");
    const pdf2 = await createPdf("Page 2");

    const merged = await mergePdfs([pdf1, pdf2]);
    const mergedDoc = await PDFDocument.load(merged);
    expect(mergedDoc.getPageCount()).toBe(2);
  });
});
