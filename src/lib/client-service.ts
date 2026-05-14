import { prisma } from "./prisma";

export async function syncClient(data: { 
  companyName?: string | null, 
  clientName?: string | null, 
  address?: string | null, 
  phone?: string | null 
}) {
  const company = (data.companyName || "").trim();
  const client = (data.clientName || "").trim();
  
  if (!company && !client) {
    console.log("[client-service] SKIP: No company or client name provided.");
    return;
  }
  
  console.log(`[client-service] Menjalankan Sinkronisasi: "${company}" | "${client}"`);

  try {
    await prisma.client.upsert({
      where: { 
        companyName_clientName: { 
          companyName: company, 
          clientName: client 
        } 
      },
      update: {
        address: data.address || undefined,
        phone: data.phone || undefined,
        updatedAt: new Date()
      },
      create: {
        companyName: company,
        clientName: client,
        address: data.address || "",
        phone: data.phone || ""
      }
    });
    console.log(`[client-service] SUCCESS: Data klien "${company || client}" berhasil disinkronkan.`);
  } catch (e) {
    console.error("[client-service] ERROR:", e);
  }
}
