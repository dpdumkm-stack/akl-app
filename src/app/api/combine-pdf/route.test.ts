import { GET } from "./route";
import { NextRequest } from "next/server";
import { getSession } from "next-auth/react";
import { renderPdfFromUrl } from "@/lib/pdf-renderer";
import { mergePdfs } from "@/lib/pdf-merge-service";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("next-auth/react");
jest.mock("@/lib/pdf-renderer");
jest.mock("@/lib/pdf-merge-service");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    invoice: {
      findUnique: jest.fn(),
    },
  },
}));

describe("GET /api/combine-pdf", () => {
  const quotationId = "q123";
  const invoiceId = "i456";
  const url = `http://localhost/api/combine-pdf?quotationId=${quotationId}&invoiceId=${invoiceId}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 if user is not admin", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { role: "user" } });
    const req = new NextRequest(url);
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 if parameters are missing", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { role: "admin" } });
    const req = new NextRequest("http://localhost/api/combine-pdf");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 and combined PDF on success", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { role: "admin" } });
    (renderPdfFromUrl as jest.Mock).mockResolvedValue(Buffer.from("pdf-part"));
    (mergePdfs as jest.Mock).mockResolvedValue(Buffer.from("merged-pdf"));
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ invoiceNumber: "INV/2026/001" });

    const req = new NextRequest(url);
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("INV/2026/001_full.pdf");
    
    const body = await res.arrayBuffer();
    expect(Buffer.from(body).toString()).toBe("merged-pdf");
  });
});
